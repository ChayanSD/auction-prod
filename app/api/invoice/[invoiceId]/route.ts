import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET /api/invoice/[invoiceId]
 * Get a specific invoice
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> | { invoiceId: string } }
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { invoiceId } = resolvedParams;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        auctionItem: {
          include: {
            productImages: true,
            auction: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Fetch winning bid separately if winningBidId exists
    let winningBid = null;
    if (invoice?.winningBidId) {
      winningBid = await prisma.bid.findUnique({
        where: { id: invoice.winningBidId },
        select: {
          id: true,
          amount: true,
          createdAt: true,
        },
      });
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Check if user has access (owner or admin)
    if (session.accountType !== 'Admin' && invoice.userId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Add winningBid to the response
    const invoiceWithBid = {
      ...invoice,
      winningBid,
    };

    return NextResponse.json(invoiceWithBid);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch invoice";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/invoice/[invoiceId]
 * Update invoice status (e.g., mark as paid)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> | { invoiceId: string } }
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session || session.accountType !== 'Admin') {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { invoiceId } = resolvedParams;

    const body = await request.json();
    const { status, notes } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (status === 'Paid') {
      updateData.paidAt = new Date();
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        auctionItem: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

