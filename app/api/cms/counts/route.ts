import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET /api/cms/counts
 * Get counts for CMS sidebar (listing requests and active bids)
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session || session.accountType !== 'Admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }


    // Count listing requests (all statuses)
    const listingRequestsCount = await prisma.auctionRequest.count();

    const now = new Date();

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

    // Count pending shipping quotes
    const pendingLogisticsCount = await prisma.invoice.count({
      where: {
        shippingStatus: 'Requested',
        status: 'Unpaid'
      }
    });

    // Count total users
    const usersCount = await prisma.user.count();

    // Count live auctions
    const auctionsCount = await prisma.auction.count({
      where: { status: 'Live' }
    });

    // Count new contacts/messages
    const contactsCount = await prisma.contact.count({
      where: { status: 'New' }
    });

    // Count unpaid payments
    const unpaidPaymentsCount = await prisma.invoice.count({
      where: { status: 'Unpaid' }
    });

    // Count pending sellers
    const pendingSellersCount = await prisma.user.count({
      where: { 
        accountType: 'Seller',
        sellerStatus: 'Pending'
      }
    });

    console.log('CMS Counts Debug:', {
      listingRequests: listingRequestsCount,
      activeBids: activeBidsCount,
      pendingLogistics: pendingLogisticsCount,
      unpaidPayments: unpaidPaymentsCount,
      pendingSellers: pendingSellersCount
    });

    return NextResponse.json({
      listingRequests: listingRequestsCount,
      activeBids: activeBidsCount,
      pendingLogistics: pendingLogisticsCount,
      users: usersCount,
      auctions: auctionsCount,
      contacts: contactsCount,
      unpaidPayments: unpaidPaymentsCount,
      pendingSellers: pendingSellersCount,
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

