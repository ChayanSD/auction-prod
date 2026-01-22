import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "Seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settlements = await prisma.sellerSettlement.findMany({
      where: {
        sellerId: session.id,
        status: {
          in: ["PendingPayment", "Paid"]
        }
      },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            bankName: true,
            bankAccount: true,
            bankSortCode: true,
          }
        },
        items: {
          select: {
            id: true,
            name: true,
            lotNumber: true,
            soldPrice: true,
            isSold: true,
            baseBidPrice: true,
            reservePrice: true,
            currentBid: true,
          }
        },
      },
      orderBy: {
        generatedAt: "desc",
      },
    });

    // Post-process items to add status for individual items within the settlement
    const enrichedSettlements = settlements.map(s => ({
      ...s,
      soldItems: s.items.filter(item => item.isSold && item.soldPrice !== null),
      unsoldItems: s.items.filter(item => !item.isSold).map(item => ({
        ...item,
        status: (item.reservePrice && item.currentBid && item.currentBid < item.reservePrice) 
          ? 'below_reserve' 
          : 'no_bids'
      }))
    }));

    return NextResponse.json(enrichedSettlements);
  } catch (error) {
    console.error("Seller settlements fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
