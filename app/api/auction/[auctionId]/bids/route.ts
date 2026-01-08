import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET /api/auction/[auctionId]/bids
 * Get all bids for all items in a specific auction
 * Admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> | { auctionId: string } }
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
    const { auctionId } = resolvedParams;

    // Get auction with all items and their bids
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        items: {
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
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found" },
        { status: 404 }
      );
    }

    // Format the response to show all bids grouped by item
    const itemsWithBids = auction.items.map(item => ({
      itemId: item.id,
      itemName: item.name,
      baseBidPrice: item.baseBidPrice,
      currentBid: item.currentBid,
      totalBids: item.bids.length,
      highestBid: item.bids.length > 0 ? {
        id: item.bids[0].id,
        amount: item.bids[0].amount,
        createdAt: item.bids[0].createdAt,
        user: item.bids[0].user,
      } : null,
      bids: item.bids.map(bid => ({
        id: bid.id,
        amount: bid.amount,
        createdAt: bid.createdAt,
        user: bid.user,
      })),
    }));

    return NextResponse.json({
      auction: {
        id: auction.id,
        name: auction.name,
        location: auction.location,
        status: auction.status,
      },
      items: itemsWithBids,
      totalBids: itemsWithBids.reduce((sum, item) => sum + item.totalBids, 0),
      totalItems: auction.items.length,
    });
  } catch (error) {
    console.error("Error fetching auction bids:", error);
    return NextResponse.json(
      { error: "Failed to fetch bids" },
      { status: 500 }
    );
  }
}

