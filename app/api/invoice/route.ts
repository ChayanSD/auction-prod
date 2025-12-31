import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { getSession } from "@/lib/session";
import { sendEmail, generateInvoiceEmailHTML } from "@/lib/email";
import { z } from "zod";

const CreateInvoiceSchema = z.object({
  auctionItemId: z.string().min(1, "Auction item ID is required"),
  userId: z.string().min(1, "User ID is required"),
  winningBidId: z.string().optional(),
  notes: z.string().optional(),
});


export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Admin can see all invoices, users see only their own
    const invoices = await prisma.invoice.findMany({
      where: session.accountType === 'Admin' ? {} : { userId: session.id },
      include: {
        auctionItem: {
          include: {
            productImages: true,
            auction: {
              select: {
                id: true,
                name: true,
                endDate: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication and admin access
    const session = await getSession();
    if (!session || session.accountType !== 'Admin') {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = CreateInvoiceSchema.parse(body);

    const { auctionItemId, userId, winningBidId, notes } = validatedData;

    // Get auction item with bids
    const auctionItem = await prisma.auctionItem.findUnique({
      where: { id: auctionItemId },
      include: {
        bids: {
          where: { userId },
          orderBy: { amount: 'desc' },
          take: 1,
        },
        auction: {
          select: {
            name: true,
            endDate: true,
          },
        },
      },
    });

    if (!auctionItem) {
      return NextResponse.json(
        { error: "Auction item not found" },
        { status: 404 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get winning bid
    const winningBid = winningBidId
      ? await prisma.bid.findUnique({ where: { id: winningBidId } })
      : auctionItem.bids[0];

    if (!winningBid) {
      return NextResponse.json(
        { error: "No winning bid found" },
        { status: 400 }
      );
    }

    // Calculate amounts
    const bidAmount = winningBid.amount;
    const additionalFee = auctionItem.additionalFee || 0;
    const totalAmount = bidAmount + additionalFee;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Create invoice in database first (so we have the invoiceId)
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        auctionItemId,
        userId,
        winningBidId: winningBid.id,
        bidAmount,
        additionalFee,
        totalAmount,
        sentBy: session.id,
        sentAt: new Date(),
        notes,
        status: 'Unpaid',
      },
    });

    // Create Stripe invoice
    let stripePaymentLink: string | null = null;
    let stripeInvoiceId: string | null = null;

    try {
      // Create Stripe customer if doesn't exist
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user.id,
          },
        });
        stripeCustomerId = customer.id;
        
        // Update user with Stripe customer ID
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customer.id },
        });
      }

      // Create Stripe invoice
      const stripeInvoice = await stripe.invoices.create({
        customer: stripeCustomerId,
        metadata: {
          invoiceId: invoice.id, 
          invoiceNumber,
          auctionItemId,
          userId,
          winningBidId: winningBid.id,
        },
        auto_advance: false,
      });

      // Add line item to the invoice
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        invoice: stripeInvoice.id,
        amount: Math.round(totalAmount * 100),
        currency: 'gbp',
        description: `Invoice ${invoiceNumber} - ${auctionItem.name} (${auctionItem.auction.name})`,
        quantity: auctionItem.lotCount || 1,
      });

      // Finalize the invoice
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(stripeInvoice.id);

      stripeInvoiceId = finalizedInvoice.id;
      stripePaymentLink = finalizedInvoice.hosted_invoice_url || null;

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          stripePaymentLink,
          stripeInvoiceId,
        },
      });
    } catch (stripeError) {
      console.error("Stripe error:", stripeError);
    }

    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
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
          },
        },
      },
    });

    if (!completeInvoice) {
      return NextResponse.json(
        { error: "Failed to fetch created invoice" },
        { status: 500 }
      );
    }

    if (stripePaymentLink) {
      try {
        const emailHTML = generateInvoiceEmailHTML(
          `${user.firstName} ${user.lastName}`,
          invoiceNumber,
          auctionItem.name,
          bidAmount,
          additionalFee,
          totalAmount,
          auctionItem.lotCount || 1,
          stripePaymentLink
        );

        await sendEmail({
          to: user.email,
          subject: `Invoice ${invoiceNumber} - Payment Required for ${auctionItem.name}`,
          html: emailHTML,
        });
      } catch (emailError) {
        console.error('Error sending invoice email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      invoice: completeInvoice,
      message: "Invoice created and sent successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}

