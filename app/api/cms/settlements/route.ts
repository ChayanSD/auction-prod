import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settlements = await prisma.sellerSettlement.findMany({
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            lotNumber: true,
            soldPrice: true,
            baseBidPrice: true,
            reservePrice: true,
          },
        },
      },
      orderBy: {
        generatedAt: "desc",
      },
    });

    return NextResponse.json(settlements);
  } catch (error) {
    console.error("Settlements fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sellerId, auctionId, commissionRate = 10, adjustments = [] } = body;

    if (!sellerId || !auctionId) {
      return NextResponse.json(
        { error: "sellerId and auctionId are required" },
        { status: 400 }
      );
    }

    // Get ALL items for this seller in this auction (sold and unsold)
    const allItems = await prisma.auctionItem.findMany({
      where: {
        sellerId,
        auctionId,
        settlementId: null, // Not already settled
      },
      include: {
        auction: {
          select: {
            name: true,
            endDate: true,
          },
        },
      },
    });

    if (allItems.length === 0) {
      return NextResponse.json(
        { error: "No items found for this seller in this auction" },
        { status: 404 }
      );
    }

    // Separate sold and unsold items
    const soldItems = allItems.filter(item => item.isSold === true && item.soldPrice !== null);
    const unsoldItems = allItems.filter(item => item.isSold !== true);

    // Only calculate commission on SOLD items
    const totalSales = soldItems.reduce((sum, item) => sum + (item.soldPrice || 0), 0);
    const commission = (totalSales * commissionRate) / 100;
    
    // Calculate expenses from adjustments
    const expenses = adjustments.reduce((sum: number, adj: any) => {
      return adj.type === "expense" ? sum + adj.amount : sum;
    }, 0);

    // Calculate deductions from adjustments
    const deductions = adjustments.reduce((sum: number, adj: any) => {
      return adj.type === "deduction" ? sum + adj.amount : sum;
    }, 0);

    const netPayout = totalSales - commission - expenses - deductions;

    // Generate unique reference
    const count = await prisma.sellerSettlement.count();
    const reference = `SET-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // Create settlement
    const settlement = await prisma.sellerSettlement.create({
      data: {
        reference,
        sellerId,
        totalSales,
        commission,
        expenses: expenses + deductions,
        adjustments: adjustments, // Save detail
        netPayout,
        status: "Draft",
      },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          },
        },
      },
    });

    // Link ALL items (sold and unsold) to settlement
    await prisma.auctionItem.updateMany({
      where: {
        id: { in: allItems.map((item) => item.id) },
      },
      data: {
        settlementId: settlement.id,
      },
    });

    return NextResponse.json(settlement, { status: 201 });
  } catch (error) {
    console.error("Settlement creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
