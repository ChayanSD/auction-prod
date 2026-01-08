import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET /api/cms/counts
 * Get counts for CMS sidebar (listing requests and active bids)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session || session.accountType !== 'Admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();

    // Count listing requests (all statuses)
    const listingRequestsCount = await prisma.auctionRequest.count();

    // Count active bids
    // Active bids are bids on auctions that are:
    // - Status is 'Live' (not 'Closed')
    // - End date hasn't passed (if endDate exists), or no endDate
    const activeBidsCount = await prisma.bid.count({
      where: {
        auctionItem: {
          auction: {
            status: 'Live',
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        },
      },
    });

    return NextResponse.json({
      listingRequests: listingRequestsCount,
      activeBids: activeBidsCount,
    });
  } catch (error) {
    console.error("Error fetching CMS counts:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch counts";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

