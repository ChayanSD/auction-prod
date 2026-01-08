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
        // Legacy: single item invoice
        auctionItem: {
          include: {
            productImages: true,
            auction: true,
          },
        },
        // New: multiple items per invoice
        lineItems: {
          include: {
            auctionItem: {
              include: {
                productImages: {
                  take: 1,
                },
                auction: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        auction: {
          select: {
            id: true,
            name: true,
            endDate: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            shippingAddress: {
              select: {
                address1: true,
                address2: true,
                city: true,
                postcode: true,
                country: true,
              },
            },
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

    // Fetch winning bid separately (for legacy invoices)
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
    // Handle both legacy single-item and new multi-item invoices
    const isMultiItem = invoice.lineItems && invoice.lineItems.length > 0;
    
    const pdfBuffer = await generateInvoicePDF({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        // Legacy fields (for single-item invoices)
        bidAmount: invoice.bidAmount !== null ? invoice.bidAmount : undefined,
        buyersPremium: invoice.buyersPremium !== null ? invoice.buyersPremium : undefined,
        taxAmount: invoice.taxAmount !== null ? invoice.taxAmount : undefined,
        totalAmount: (invoice.totalAmount !== null ? invoice.totalAmount : invoice.subtotal) ?? 0,
        subtotal: (invoice.subtotal !== null ? invoice.subtotal : invoice.totalAmount) ?? 0,
        status: invoice.status,
        createdAt: invoice.createdAt,
        paidAt: invoice.paidAt,
        notes: invoice.notes,
        // Legacy: single item (if exists)
        auctionItem: invoice.auctionItem ? {
          id: invoice.auctionItem.id,
          name: invoice.auctionItem.name,
          lotCount: null,
          startDate: new Date(),
          endDate: new Date(),
          auction: {
            id: invoice.auctionItem.auction.id,
            name: invoice.auctionItem.auction.name,
            endDate: null,
          },
        } : undefined,
        // New: auction info (for combined invoices)
        auction: invoice.auction ? {
          id: invoice.auction.id,
          name: invoice.auction.name,
          endDate: invoice.auction.endDate,
        } : undefined,
        user: {
          id: invoice.user.id,
          firstName: invoice.user.firstName,
          lastName: invoice.user.lastName,
          email: invoice.user.email,
          phone: invoice.user.phone ?? undefined,
        },
        shippingAddress: invoice.user.shippingAddress ? {
          address1: invoice.user.shippingAddress.address1,
          address2: invoice.user.shippingAddress.address2,
          city: invoice.user.shippingAddress.city,
          postcode: invoice.user.shippingAddress.postcode,
          country: invoice.user.shippingAddress.country,
        } : null,
      },
      // New: line items (for combined invoices)
      lineItems: invoice.lineItems && invoice.lineItems.length > 0 ? invoice.lineItems.map((li) => ({
        id: li.id,
        auctionItemId: li.auctionItemId,
        itemName: li.auctionItem.name,
        bidAmount: li.bidAmount,
        buyersPremium: li.buyersPremium,
        taxAmount: li.taxAmount,
        lineTotal: li.lineTotal,
      })) : undefined,
      // Legacy: winning bid (for single-item invoices)
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
