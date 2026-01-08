import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BidCreateSchema } from "@/validation/validator";
import { getSession } from "@/lib/session";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import qstashClient from "@/lib/qustash";

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
                endDate: true,
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

    // Check auction time window & status
    const now = new Date();
    const auctionStartDate = auctionItem.auction.startDate ? new Date(auctionItem.auction.startDate) : null;
    const auctionEndDate = auctionItem.auction.endDate ? new Date(auctionItem.auction.endDate) : null;

    const isTimeWindowPassed = auctionEndDate && auctionEndDate < now;
    const isWithinTimeWindow =
      auctionStartDate && auctionEndDate && auctionStartDate <= now && now < auctionEndDate;

    // Closed if end date passed or status explicitly Closed
    const isClosed = isTimeWindowPassed || auctionItem.auction.status === 'Closed';

    if (isClosed) {
      return NextResponse.json(
        { error: "Auction is closed. Bidding is no longer available." },
        { status: 409 }
      );
    }

    // Treat auction as live if:
    // - status is Live (manual override), OR
    // - current time is between startDate and endDate
    const isLive = auctionItem.auction.status === 'Live' || !!isWithinTimeWindow;

    if (!isLive) {
      return NextResponse.json(
        { error: "Auction is not live yet. Bidding will open when the auction starts." },
        { status: 409 }
      );
    }

    // Check if bid amount is higher than current bid or base bid
    const currentBid = auctionItem.currentBid || auctionItem.baseBidPrice;
    
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

    // Offload notifications to QStash Queue
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      await qstashClient.publishJSON({
        url: `${baseUrl}/api/queue/notify`,
        body: {
          bidId: bid.id,
          auctionItemId,
          amount,
          userId,
        },
      });

    } catch (queueError) {
      console.error("Failed to queue notification:", queueError);
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
