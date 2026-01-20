import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "Admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sellerId = searchParams.get("sellerId");

    const where: any = {};
    if (status && status !== "all") where.status = status;
    if (sellerId) where.sellerId = sellerId;

    const settlements = await prisma.sellerSettlement.findMany({
      where,
      include: {
        seller: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
          }
        },
        items: {
          select: {
            name: true,
            lotNumber: true,
            soldPrice: true,
          }
        }
      },
      orderBy: {
        generatedAt: "desc"
      }
    });

    // Transform data for Excel
    const data = settlements.map(s => ({
      "Reference": s.reference,
      "Seller Name": s.seller.companyName || `${s.seller.firstName} ${s.seller.lastName}`,
      "Seller Email": s.seller.email,
      "Status": s.status,
      "Total Sales": s.totalSales,
      "Commission": s.commission,
      "Expenses": s.expenses,
      "Net Payout": s.netPayout,
      "Currency": s.currency,
      "Generated At": s.generatedAt.toISOString().split('T')[0],
      "Paid At": s.paidAt ? s.paidAt.toISOString().split('T')[0] : "N/A",
      "Item Count": s.items.length,
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Settlements");

    // Generate buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="settlements_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Settlement export error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
