import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const validStatuses = ["Draft", "PendingPayment", "Paid", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: any = { status };
    if (status === "Paid") {
      updateData.paidAt = new Date();
    }

    const updated = await prisma.sellerSettlement.updateMany({
      where: {
        id: { in: ids },
      },
      data: updateData,
    });

    // If marked as PendingPayment (Sent), trigger emails
    if (status === "PendingPayment") {
      const settlements = await prisma.sellerSettlement.findMany({
        where: { id: { in: ids } },
        include: { 
          seller: { 
            select: { 
              email: true, 
              firstName: true, 
              lastName: true, 
              companyName: true 
            } 
          },
          items: true
        }
      });

      const { sendEmail } = await import("@/lib/mail");
      for (const s of settlements) {
        await sendEmail({
          to: s.seller.email,
          subject: `Your Settlement Statement is Ready: ${s.reference}`,
          template: "settlement_generated",
          data: {
            reference: s.reference,
            sellerName: s.seller.companyName || `${s.seller.firstName} ${s.seller.lastName}`,
            netPayout: s.netPayout,
            itemCount: s.items.length,
          }
        });
      }
    }

    return NextResponse.json({ 
      message: `Successfully updated ${updated.count} settlements to ${status}`,
      count: updated.count 
    });
  } catch (error) {
    console.error("Batch settlement update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
