import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "Seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = session.id;

    // 1. Total Sales (Hammer prices of sold items)
    const totalSalesAgg = await prisma.auctionItem.aggregate({
      where: {
        sellerId,
        isSold: true,
      },
      _sum: {
        soldPrice: true,
      }
    });

    // 2. Active Items count
    const activeItemsCount = await prisma.auctionItem.count({
      where: {
        sellerId,
        isSold: false,
        auction: {
            status: { in: ['Upcoming', 'Live'] }
        }
      }
    });

    // 3. Pending Payout (Sum of netPayout for PendingPayment settlements)
    const pendingPayoutAgg = await prisma.sellerSettlement.aggregate({
      where: {
        sellerId,
        status: "PendingPayment",
      },
      _sum: {
        netPayout: true,
      }
    });

    return NextResponse.json({
      totalSales: totalSalesAgg._sum.soldPrice || 0,
      activeItems: activeItemsCount,
      pendingPayout: pendingPayoutAgg._sum.netPayout || 0,
    });
  } catch (error) {
    console.error("Seller stats fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
