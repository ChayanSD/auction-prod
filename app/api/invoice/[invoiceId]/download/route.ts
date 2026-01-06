import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateInvoicePDF } from "@/lib/pdf-invoice";

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

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

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

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Fetch winning bid separately
    let winningBid = null;
    if (invoice.winningBidId) {
      winningBid = await prisma.bid.findUnique({
        where: { id: invoice.winningBidId },
        select: {
          id: true,
          amount: true,
          createdAt: true,
        },
      });
    }

    // Check if user has access (owner or admin)
    if (session.accountType !== 'Admin' && invoice.userId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Generate PDF using the shared function
    const pdfBuffer = await generateInvoicePDF({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        bidAmount: invoice.bidAmount,
        buyersPremium: invoice.buyersPremium ?? 0,
        taxAmount: invoice.taxAmount ?? 0,
        totalAmount: invoice.totalAmount,
        status: invoice.status,
        createdAt: invoice.createdAt,
        paidAt: invoice.paidAt,
        notes: invoice.notes,
        auctionItem: {
          id: invoice.auctionItem.id,
          name: invoice.auctionItem.name,

          startDate: invoice.auctionItem.startDate,
          endDate: invoice.auctionItem.endDate,
          auction: {
            id: invoice.auctionItem.auction.id,
            name: invoice.auctionItem.auction.name,
            endDate: null, // Auction doesn't have endDate, will use auctionItem.endDate as fallback
          },
        },
        user: {
          id: invoice.user.id,
          firstName: invoice.user.firstName,
          lastName: invoice.user.lastName,
          email: invoice.user.email,
          phone: invoice.user.phone || 'N/A',
        },
      },
      winningBid: winningBid ? {
        id: winningBid.id,
        amount: winningBid.amount,
        createdAt: winningBid.createdAt,
      } : null,
    });

    // Return PDF as response
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const pdfArray = new Uint8Array(pdfBuffer);
    return new NextResponse(pdfArray, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF invoice:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate PDF invoice";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

