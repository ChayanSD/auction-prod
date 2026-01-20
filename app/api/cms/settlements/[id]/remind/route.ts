import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendEmail } from "@/lib/mail";

export async function POST(
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
          },
        },
      },
    });

    if (!settlement) {
      return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
    }

    await sendEmail({
      to: settlement.seller.email,
      subject: `Reminder: Settlement Statement ${settlement.reference}`,
      template: "settlement_reminder",
      data: {
        reference: settlement.reference,
        sellerName:
          settlement.seller.companyName ||
          `${settlement.seller.firstName} ${settlement.seller.lastName}`,
        netPayout: settlement.netPayout,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settlement reminder error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
