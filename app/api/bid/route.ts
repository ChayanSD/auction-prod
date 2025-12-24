import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BidCreateSchema } from "@/validation/validator";
import { z } from "zod";

export async function GET(): Promise<NextResponse> {
  try {
    const bids = await prisma.bid.findMany({
      include: {
        user: true,
        auctionItem: true,
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
    const body = await request.json();
    const validatedData = BidCreateSchema.parse(body);

    const { auctionItemId, userId, amount } = validatedData;

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

    // Check if auction is active
    if (auctionItem.auction.status !== "Active") {
      return NextResponse.json(
        { error: "Auction is not active" },
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
