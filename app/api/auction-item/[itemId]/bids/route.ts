import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET /api/auction-item/[itemId]/bids
 * Get all bids for a specific auction item
 * Admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> | { itemId: string } }
): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getSession();
    if (!session || session.accountType !== 'Admin') {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { itemId } = resolvedParams;

    // Get auction item with all bids and user information
    const auctionItem = await prisma.auctionItem.findUnique({
      where: { id: itemId },
      include: {
        bids: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: {
            amount: 'desc', // Highest bid first
          },
        },
        auction: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!auctionItem) {
      return NextResponse.json(
        { error: "Auction item not found" },
        { status: 404 }
      );
    }

    // Find the highest bid (winner)
    const highestBid = auctionItem.bids.length > 0 ? auctionItem.bids[0] : null;

    return NextResponse.json({
      auctionItem: {
        id: auctionItem.id,
        name: auctionItem.name,
        startDate: auctionItem.startDate,
        endDate: auctionItem.endDate,
        currentBid: auctionItem.currentBid,
        baseBidPrice: auctionItem.baseBidPrice,
        additionalFee: auctionItem.additionalFee,
      },
      auction: auctionItem.auction,
      bids: auctionItem.bids.map(bid => ({
        id: bid.id,
        amount: bid.amount,
        createdAt: bid.createdAt,
        user: bid.user,
      })),
      highestBid: highestBid ? {
        id: highestBid.id,
        amount: highestBid.amount,
        createdAt: highestBid.createdAt,
        user: highestBid.user,
      } : null,
      totalBids: auctionItem.bids.length,
    });
  } catch (error) {
    console.error("Error fetching bids:", error);
    return NextResponse.json(
      { error: "Failed to fetch bids" },
      { status: 500 }
    );
  }
}

