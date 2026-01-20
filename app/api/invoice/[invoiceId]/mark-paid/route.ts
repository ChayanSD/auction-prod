import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * POST /api/invoice/[invoiceId]/mark-paid
 * Allow users to mark their own invoice as paid after successful payment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { invoiceId } = await params;

    // Verify invoice exists and belongs to user
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Check if user owns this invoice or is admin
    if (session.accountType !== 'Admin' && invoice.userId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'Paid',
        paidAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (error) {
    console.error("Error marking invoice as paid:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to mark invoice as paid";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

