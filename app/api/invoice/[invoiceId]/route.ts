import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
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
          },
        },
      },
    });

    // Fetch winning bid separately if winningBidId exists (legacy invoices)
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
 * Update invoice status (e.g., mark as paid, request shipping quote)
 */
export async function PATCH(
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

    const body = await request.json();
    const { 
      status, 
      notes, 
      shippingStatus, 
      actualShippingCost, 
      quotedShippingPrice, 
      carrierName, 
      trackingNumber 
    } = body;

    const currentInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { user: true }
    });

    if (!currentInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const updateData: any = {};
    const isAdmin = session.accountType === 'Admin';

    // Role-based logic
    if (isAdmin) {
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (status === 'Paid') updateData.paidAt = new Date();
      
      if (shippingStatus) updateData.shippingStatus = shippingStatus;
      if (actualShippingCost !== undefined) updateData.actualShippingCost = actualShippingCost;
      if (quotedShippingPrice !== undefined) updateData.quotedShippingPrice = quotedShippingPrice;
      if (carrierName !== undefined) updateData.carrierName = carrierName;
      if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    } else {
      // User can only request quote or mark as self-arranged
      if (currentInvoice.userId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (shippingStatus && ['Requested', 'SelfArranged', 'NotRequested'].includes(shippingStatus)) {
        updateData.shippingStatus = shippingStatus;
        // If they choose self-arranged, clear any quoted price
        if (shippingStatus === 'SelfArranged' || shippingStatus === 'NotRequested') {
          updateData.quotedShippingPrice = 0;
        }
      } else if (shippingStatus) {
        return NextResponse.json({ error: "Invalid shipping status update" }, { status: 400 });
      }
    }

    // Recalculate total if quotedShippingPrice changed
    let priceChanged = false;
    if (updateData.quotedShippingPrice !== undefined) {
      const baseAmount = currentInvoice.subtotal || 
                         (Number(currentInvoice.bidAmount || 0) + 
                          Number(currentInvoice.buyersPremium || 0) + 
                          Number(currentInvoice.taxAmount || 0));
      updateData.totalAmount = baseAmount + Number(updateData.quotedShippingPrice);
      priceChanged = true;
    }

    const updatedInvoice = await prisma.invoice.update({
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
            stripeCustomerId: true,
          },
        },
      },
    });

    // If price changed, regenerate Stripe Payment Link
    if (priceChanged && updatedInvoice.status === 'Unpaid') {
      try {
        const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        // Create a new Price
        const price = await stripe.prices.create({
          unit_amount: Math.round(updatedInvoice.totalAmount! * 100),
          currency: 'gbp',
          product_data: {
            name: `Invoice ${updatedInvoice.invoiceNumber} (Updated)`,
          },
        });

        const paymentLink = await stripe.paymentLinks.create({
          line_items: [{ price: price.id, quantity: 1 }],
          metadata: { invoiceId: updatedInvoice.id },
          after_completion: {
            type: 'redirect',
            redirect: {
              url: `${frontendUrl}/payment/${updatedInvoice.id}?success=true`,
            },
          },
        });

        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            stripePaymentLinkId: paymentLink.id,
            stripePaymentLink: paymentLink.url,
          },
        });

        // Update local object for response
        updatedInvoice.stripePaymentLink = paymentLink.url;
      } catch (stripeError) {
        console.error("Stripe update error:", stripeError);
      }
    }

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

