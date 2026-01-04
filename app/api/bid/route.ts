import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BidCreateSchema } from "@/validation/validator";
import { getSession } from "@/lib/session";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { pusherServer } from "@/lib/pusher-server";
import { sendEmail, generateNewBidEmailHTML, generateOutbidEmailHTML } from "@/lib/email";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    const auctionItemId = searchParams.get('auctionItemId');

    const where: Prisma.BidWhereInput = {};
    
    // If userId is 'current', use session user
    if (userIdParam === 'current') {
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      where.userId = session.id;
    } else if (userIdParam) {
      // Admin can view any user's bids, regular users can only view their own
      if (session && (session.accountType === 'Admin' || session.id === userIdParam)) {
        where.userId = userIdParam;
      } else if (session) {
        where.userId = session.id; // Regular users only see their own
      } else {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (session && session.accountType !== 'Admin') {
      // If no userId param and not admin, only show own bids
      where.userId = session.id;
    }
    
    if (auctionItemId) {
      where.auctionItemId = auctionItemId;
    }

    const bids = await prisma.bid.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        auctionItem: {
          include: {
            productImages: true,
            auction: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(bids);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to fetch bids" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = BidCreateSchema.parse(body);

    const { auctionItemId, amount } = validatedData;
    const userId = session.id; // Use authenticated user's ID

    // Check if auction item exists
    const auctionItem = await prisma.auctionItem.findUnique({
      where: { id: auctionItemId },
      include: { auction: true },
    });

    if (!auctionItem) {
      return NextResponse.json(
        { error: "Auction item not found" },
        { status: 404 }
      );
    }

    // Check if auction is closed/ended - Priority 1: Check dates
    // Note: Auction model doesn't have endDate, only AuctionItem has endDate
    const now = new Date();
    const itemEndDate = auctionItem.endDate ? new Date(auctionItem.endDate) : null;
    const isDatePassed = itemEndDate && itemEndDate < now;
    
    // Priority 2: Check status if date hasn't passed
    const isClosed = isDatePassed || 
                     auctionItem.status === 'Closed' || 
                     auctionItem.auction.status === 'Ended' || 
                     auctionItem.auction.status === 'Cancelled';
    
    if (isClosed) {
      return NextResponse.json(
        { error: "Auction is closed. Bidding is no longer available." },
        { status: 409 }
      );
    }
    
    // Also check if auction is not active (for other statuses like Draft, Upcoming)
    if (auctionItem.auction.status !== "Active") {
      return NextResponse.json(
        { error: "Auction is not active" },
        { status: 409 }
      );
    }

    // Check if bid amount is higher than current bid or base bid
    const currentBid = auctionItem.currentBid || auctionItem.baseBidPrice;
    
    // Find previous highest bid to notify the user they've been outbid
    const previousHighestBid = await prisma.bid.findFirst({
      where: { auctionItemId },
      orderBy: { amount: 'desc' },
      include: { user: true }
    });

    if (amount <= currentBid) {
      return NextResponse.json(
        {
          error: `Bid amount must be higher than current bid of ${currentBid}`,
        },
        { status: 409 }
      );
    }

    // Create the bid
    const bid = await prisma.bid.create({
      data: {
        auctionItemId,
        userId,
        amount,
      },
    });

    // Update the current bid on the auction item
    await prisma.auctionItem.update({
      where: { id: auctionItemId },
      data: { currentBid: amount },
    });

    // Notify admins via Pusher and Email
    try {
      // Fetch user details for the notification if not already available
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true }
      });

      const userName = user 
        ? `${user.firstName} ${user.lastName}`.trim() || user.email 
        : "Unknown User";
      
      const itemUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auctions/${auctionItem.auction.id}/items/${auctionItem.id}`;

      // 1. Notify Admins
      const admins = await prisma.user.findMany({
        where: { accountType: 'Admin' }
      });

      // Send to Pusher (Client Notification)
      await pusherServer.trigger("admin-notifications", "new-bid", {
        amount,
        userName,
        auctionItemName: auctionItem.auction.name,
        auctionItemId,
        timestamp: new Date().toISOString(),
      });

      // Send Emails and Create DB Notifications for Admins
      for (const admin of admins) {
        // Create DB Notification
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'BidUpdate',
            title: 'New Bid Placed',
            message: `${userName} placed a bid of £${amount} on ${auctionItem.auction.name}`,
            link: `/cms/pannel/bids`, // Link to admin bids panel
            auctionItemId,
            bidId: bid.id,
          }
        });

        // Send Email
        try {
          const emailHtml = generateNewBidEmailHTML(
            userName,
            user?.email || 'N/A',
            amount,
            auctionItem.auction.name,
            itemUrl
          );
          
          await sendEmail({
            to: admin.email,
            subject: `New Bid: £${amount} on ${auctionItem.auction.name}`,
            html: emailHtml
          });
        } catch (emailError) {
          console.error(`Failed to send admin email to ${admin.email}:`, emailError);
        }
      }

      // 2. Notify Outbid User (if exists and is not the same user)
      if (previousHighestBid && previousHighestBid.userId !== userId) {
        const outbidUser = previousHighestBid.user;
        
        // Create DB Notification
        await prisma.notification.create({
          data: {
            userId: outbidUser.id,
            type: 'Outbid',
            title: 'You have been outbid!',
            message: `Someone placed a higher bid of £${amount} on ${auctionItem.auction.name}`,
            link: `/auctions/${auctionItem.auction.id}/items/${auctionItem.id}`,
            auctionItemId,
            bidId: bid.id, // Reference to the NEW winning bid
          }
        });

        // Trigger Private Pusher Event for User
        await pusherServer.trigger(`user-${outbidUser.id}`, "outbid", {
          auctionItemName: auctionItem.auction.name,
          newAmount: amount,
          timestamp: new Date().toISOString(),
          link: `/auctions/${auctionItem.auction.id}/items/${auctionItem.id}`
        });

        // Send Email
        try {
          const outbidEmailHtml = generateOutbidEmailHTML(
            outbidUser.firstName,
            auctionItem.auction.name,
            amount,
            itemUrl
          );

          await sendEmail({
            to: outbidUser.email,
            subject: `You've been outbid on ${auctionItem.auction.name}`,
            html: outbidEmailHtml
          });
        } catch (emailError) {
          console.error(`Failed to send outbid email to ${outbidUser.email}:`, emailError);
        }
      }

    } catch (error) {
      console.error("Failed to process notifications:", error);
    }

    return NextResponse.json(bid, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
