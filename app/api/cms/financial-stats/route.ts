import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all invoices (buyer payments)
    const invoices = await prisma.invoice.findMany({
      where: { status: "Paid" },
      select: {
        totalAmount: true,
        lineItems: {
          select: {
            bidAmount: true,
            buyersPremium: true,
            taxAmount: true,
          },
        },
      },
    });

    // Get all settlements (seller payouts)
    const settlements = await prisma.sellerSettlement.findMany({
      select: {
        totalSales: true,
        commission: true,
        expenses: true,
        netPayout: true,
        status: true,
      },
    });

    // Get auction counts
    const activeAuctions = await prisma.auction.count({
      where: { status: { in: ["Live", "Upcoming"] } },
    });

    const closedAuctions = await prisma.auction.count({
      where: { status: "Closed" },
    });

    // Get seller count
    const totalSellers = await prisma.user.count({
      where: { accountType: "Seller", sellerStatus: "Approved" },
    });

    // Calculate financial metrics
    let totalHammerSales = 0;
    let totalPremiums = 0;
    let totalTax = 0;

    invoices.forEach((invoice) => {
      invoice.lineItems.forEach((item) => {
        totalHammerSales += item.bidAmount;
        totalPremiums += item.buyersPremium;
        totalTax += item.taxAmount;
      });
    });

    const totalCommissions = settlements.reduce(
      (sum, s) => sum + s.commission,
      0
    );
    const totalExpenses = settlements.reduce((sum, s) => sum + s.expenses, 0);
    const totalOwedToSellers = settlements
      .filter((s) => s.status === "PendingPayment")
      .reduce((sum, s) => sum + s.netPayout, 0);
    const pendingPayments = settlements
      .filter((s) => s.status === "PendingPayment")
      .reduce((sum, s) => sum + s.netPayout, 0);
    const paidSettlements = settlements.filter((s) => s.status === "Paid").length;

    // Total Revenue = Commissions + Premiums
    const totalRevenue = totalCommissions + totalPremiums;

    // Gross Profit = Revenue (we don't include tax as it's pass-through)
    const grossProfit = totalRevenue;

    // Net Profit = Gross Profit - Expenses
    const netProfit = grossProfit - totalExpenses;

    // Total Liabilities = Money we owe to sellers
    const totalLiabilities = totalOwedToSellers;

    const stats = {
      totalRevenue,
      totalLiabilities,
      grossProfit,
      netProfit,
      totalHammerSales,
      totalCommissions,
      totalPremiums,
      totalTax,
      totalOwedToSellers,
      pendingPayments,
      paidSettlements,
      activeAuctions,
      closedAuctions,
      totalSellers,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Financial stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
