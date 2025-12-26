import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

/**
 * POST /api/stripe/create-payment-intent
 * Create a payment intent for invoice payment
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { invoiceId, amount } = body;

    if (!invoiceId || !amount) {
      return NextResponse.json(
        { error: "Invoice ID and amount are required" },
        { status: 400 }
      );
    }

    // Get invoice to verify
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Verify user owns the invoice (unless admin)
    if (session.accountType !== 'Admin' && invoice.userId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Check if already paid
    if (invoice.status === 'Paid') {
      return NextResponse.json(
        { error: "Invoice already paid" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId = invoice.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: invoice.user.email,
        name: `${invoice.user.firstName} ${invoice.user.lastName}`,
        metadata: {
          userId: invoice.user.id,
        },
      });
      customerId = customer.id;
      
      await prisma.user.update({
        where: { id: invoice.user.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to pence
      currency: 'gbp',
      customer: customerId,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        userId: invoice.user.id,
      },
      description: `Payment for Invoice ${invoice.invoiceNumber}`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

