import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher-server";
import { sendEmail, generateNewBidEmailHTML, generateOutbidEmailHTML } from "@/lib/email";
import { z } from "zod";

const NotifyPayloadSchema = z.object({
  bidId: z.string(),
  auctionItemId: z.string(),
  amount: z.number(),
  userId: z.string(),
});

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const result = NotifyPayloadSchema.safeParse(body);

    if (!result.success) {
      console.error("Invalid queue payload:", result.error);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { bidId, auctionItemId, amount, userId } = result.data;

    // Fetch necessary data
    const [auctionItem, newBidder, admins] = await Promise.all([
      prisma.auctionItem.findUnique({
        where: { id: auctionItemId },
        include: { auction: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
      }),
      prisma.user.findMany({
        where: { accountType: 'Admin' },
      }),
    ]);

    if (!auctionItem || !newBidder) {
      console.error("Data not found for notification:", { auctionItem: !!auctionItem, newBidder: !!newBidder });
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }

    const userName = `${newBidder.firstName} ${newBidder.lastName}`.trim() || newBidder.email;
    const itemUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auctions/${auctionItem.auction.id}/items/${auctionItem.id}`;    
    // Pusher for Admins
    await pusherServer.trigger("admin-notifications", "new-bid", {
      amount,
      userName,
      auctionItemName: auctionItem.auction.name,
      auctionItemId,
      timestamp: new Date().toISOString(),
    });

    // Emails & DB Notifications for Admins
    await Promise.all(admins.map(async (admin) => {
      // Create DB Notification
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'BidUpdate',
          title: 'New Bid Placed',
          message: `${userName} placed a bid of £${amount} on ${auctionItem.auction.name}`,
          link: `/cms/pannel/bids`,
          auctionItemId,
          bidId,
        }
      });

      // Send Email
      try {
        const emailHtml = generateNewBidEmailHTML(
          userName,
          newBidder.email,
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
    }));

    const previousHighestBid = await prisma.bid.findFirst({
      where: { 
        auctionItemId,
        id: { not: bidId }
      },
      orderBy: { amount: 'desc' },
      include: { user: true }
    });

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
          bidId,
        }
      });

      // Trigger Private Pusher Event
      await pusherServer.trigger(`user-${outbidUser.id}`, "outbid", {
        auctionItemName: auctionItem.auction.name,
        newAmount: amount,
        timestamp: new Date().toISOString(),
        link: `/auctions/${auctionItem.auction.id}/items/${auctionItem.id}`
      });

      // Send Email
      try {
        const outbidEmailHtml = generateOutbidEmailHTML(
            outbidUser.firstName || 'User',
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Queue processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = verifySignatureAppRouter(handler);
