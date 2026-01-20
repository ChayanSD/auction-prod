import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { auctionId, commissionRate = 10 } = body;

    if (!auctionId) {
      return NextResponse.json({ error: "auctionId is required" }, { status: 400 });
    }

    // 1. Find all sellers who have items in this auction that aren't settled yet
    const unsettledItems = await prisma.auctionItem.findMany({
      where: {
        auctionId,
        sellerId: { not: null },
        settlementId: null,
      },
      select: { sellerId: true },
      distinct: ['sellerId'],
    });

    const sellerIds = unsettledItems
      .map(item => item.sellerId)
      .filter((id): id is string => id !== null);

    if (sellerIds.length === 0) {
      return NextResponse.json({ message: "No unsettled items found for this auction" });
    }

    const settlements = [];

    // 2. For each seller, generate a settlement
    for (const sellerId of sellerIds) {
      const items = await prisma.auctionItem.findMany({
        where: {
          auctionId,
          sellerId,
          settlementId: null,
        },
      });

      const soldItems = items.filter(item => item.isSold && item.soldPrice !== null);
      const totalSales = soldItems.reduce((sum, item) => sum + (item.soldPrice || 0), 0);
      const commission = (totalSales * commissionRate) / 100;
      const netPayout = totalSales - commission;

      const count = await prisma.sellerSettlement.count();
      const reference = `SET-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

      const settlement = await prisma.sellerSettlement.create({
        data: {
          reference,
          sellerId,
          totalSales,
          commission,
          expenses: 0,
          netPayout,
          status: "Draft",
        },
      });

      await prisma.auctionItem.updateMany({
        where: { id: { in: items.map(i => i.id) } },
        data: { settlementId: settlement.id },
      });

      settlements.push(settlement);
    }

    return NextResponse.json({ 
      message: `Successfully generated ${settlements.length} settlements`,
      count: settlements.length 
    });
  } catch (error) {
    console.error("Bulk settlement error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
