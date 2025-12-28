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

/**
 * GET /api/invoice
 * Get invoices for the current user (or all invoices for admin)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
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

/**
 * POST /api/invoice
 * Create and send invoice to winner
 * Admin only
 */
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

    // Create Stripe checkout session with invoiceId in metadata
    let stripePaymentLink: string | null = null;
    let stripePaymentLinkId: string | null = null;

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

      // Create Stripe checkout session with invoiceId in metadata
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: auctionItem.name,
                description: `Invoice ${invoiceNumber} - ${auctionItem.auction.name}`,
              },
              unit_amount: Math.round(totalAmount * 100), // Convert to pence
            },
            quantity: auctionItem.lotCount || 1,
          },
        ],
        mode: 'payment',
        // success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/${invoice.id}/success`,
        // cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile/my-invoices`,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/invoices/${invoice.id}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile/my-invoices`,
        metadata: {
          invoiceId: invoice.id, // Add invoiceId to metadata for webhook
          invoiceNumber,
          auctionItemId,
          userId,
          winningBidId: winningBid.id,
        },
      });

      stripePaymentLink = checkoutSession.url || null;
      stripePaymentLinkId = checkoutSession.id;

      // Update invoice with Stripe payment link
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          stripePaymentLink,
          stripePaymentLinkId,
        },
      });
    } catch (stripeError) {
      console.error("Stripe error:", stripeError);
      // Invoice is already created, but without Stripe link
    }

    // Fetch the complete invoice with relations
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

    // Send email notification to user with invoice and payment link
    if (stripePaymentLink) {
      try {
        const emailHTML = generateInvoiceEmailHTML(
          `${user.firstName} ${user.lastName}`,
          invoiceNumber,
          auctionItem.name,
          bidAmount,
          additionalFee,
          totalAmount,
          (auctionItem as any).lotCount || 1,
          stripePaymentLink
        );

        await sendEmail({
          to: user.email,
          subject: `Invoice ${invoiceNumber} - Payment Required for ${auctionItem.name}`,
          html: emailHTML,
        });
      } catch (emailError) {
        console.error('Error sending invoice email:', emailError);
        // Don't fail the request if email fails
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

