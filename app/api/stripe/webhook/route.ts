import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: `Webhook Error: ${err}` },
      { status: 400 }
    );
  }

  try {
    // Handle invoice payment succeeded
    if (event.type === "invoice.payment_succeeded") {
      const stripeInvoice = event.data.object as Stripe.Invoice;
      const invoiceId = stripeInvoice.metadata?.invoiceId;
      const invoiceNumber = stripeInvoice.metadata?.invoiceNumber;

      if (invoiceId) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: "Paid",
            paidAt: new Date(),
            stripeInvoiceId: stripeInvoice.id,
          },
        });
        console.log(`Invoice ${invoiceId} marked as paid via Stripe invoice`);
      } else if (invoiceNumber) {
        // Fallback: find by invoice number
        const invoice = await prisma.invoice.findUnique({
          where: { invoiceNumber },
        });
        if (invoice) {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: "Paid",
              paidAt: new Date(),
              stripeInvoiceId: stripeInvoice.id,
            },
          });
          console.log(`Invoice ${invoiceNumber} marked as paid via Stripe invoice`);
        }
      }
    }

    // Handle PaymentIntent succeeded (for automatic payments)
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const invoiceId = paymentIntent.metadata?.invoiceId;
      const invoiceNumber = paymentIntent.metadata?.invoiceNumber;

      if (invoiceId) {
        // Check if already marked as paid (from the creation flow)
        const existingInvoice = await prisma.invoice.findUnique({
          where: { id: invoiceId },
        });

        if (existingInvoice && existingInvoice.status !== "Paid") {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: "Paid",
              paidAt: new Date(),
              stripePaymentIntentId: paymentIntent.id,
            },
          });
          console.log(`Invoice ${invoiceId} marked as paid via PaymentIntent`);
        }
      } else if (invoiceNumber) {
        // Fallback: find by invoice number
        const invoice = await prisma.invoice.findUnique({
          where: { invoiceNumber },
        });
        if (invoice && invoice.status !== "Paid") {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: "Paid",
              paidAt: new Date(),
              stripePaymentIntentId: paymentIntent.id,
            },
          });
          console.log(`Invoice ${invoiceNumber} marked as paid via PaymentIntent`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

