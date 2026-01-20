import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, paidAt, adjustments } = body;

    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (status === "Paid" && !paidAt) {
      updateData.paidAt = new Date();
    }

    if (adjustments && Array.isArray(adjustments)) {
      // Fetch current settlement financials
      const currentSettlement = await prisma.sellerSettlement.findUnique({
        where: { id },
        select: { totalSales: true, commission: true }
      });

      if (currentSettlement) {
         const expenses = adjustments.reduce((sum: number, adj: any) => {
            return sum + (Number(adj.amount) || 0);
         }, 0);

         updateData.adjustments = adjustments;
         updateData.expenses = expenses;
         updateData.netPayout = currentSettlement.totalSales - currentSettlement.commission - (currentSettlement as any).vatAmount - expenses;
      }
    }

    const settlement = await prisma.sellerSettlement.update({
      where: { id },
      data: updateData,
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
        items: true,
      },
    });

    // Trigger Email if status is "Sent" (PendingPayment)
    if (status === "PendingPayment") {
      const { sendEmail } = await import("@/lib/mail");
      await sendEmail({
        to: settlement.seller.email,
        subject: `Your Settlement Statement is Ready: ${settlement.reference}`,
        template: "settlement_generated",
        data: {
          reference: settlement.reference,
          sellerName: settlement.seller.companyName || `${settlement.seller.firstName} ${settlement.seller.lastName}`,
          netPayout: settlement.netPayout,
          itemCount: settlement.items.length,
        }
      });
    }

    // Trigger Email if status is "Paid"
    if (status === "Paid") {
      const { sendEmail } = await import("@/lib/mail");
      await sendEmail({
        to: settlement.seller.email,
        subject: `Payment Confirmed: ${settlement.reference}`,
        template: "payment_confirmed",
        data: {
          reference: settlement.reference,
          sellerName: settlement.seller.companyName || `${settlement.seller.firstName} ${settlement.seller.lastName}`,
          netPayout: settlement.netPayout,
        }
      });
    }

    return NextResponse.json(settlement);
  } catch (error) {
    console.error("Settlement update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const settlement = await prisma.sellerSettlement.findUnique({
      where: { id },
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
            billingAddress: true,
          },
        },
        items: {
          include: {
            auction: {
              select: {
                name: true,
                endDate: true,
              },
            },
          },
        },
      },
    });

    if (!settlement) {
      return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
    }

    // Separate sold and unsold items with status
    const soldItems = settlement.items
      .filter(item => item.isSold === true && item.soldPrice !== null)
      .map(item => ({
        ...item,
        status: 'sold' as const,
        isSold: true,
      }));

    const unsoldItems = settlement.items
      .filter(item => item.isSold !== true)
      .map(item => {
        // Determine why item didn't sell
        let status: 'unsold' | 'no_bids' | 'below_reserve' = 'no_bids';
        if (item.reservePrice && item.currentBid && item.currentBid < item.reservePrice) {
          status = 'below_reserve';
        } else if (!item.currentBid || item.currentBid === 0) {
          status = 'no_bids';
        } else {
          status = 'unsold';
        }
        
        return {
          ...item,
          status,
          isSold: false,
        };
      });

    const response = {
      ...settlement,
      soldItems,
      unsoldItems,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Settlement fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
