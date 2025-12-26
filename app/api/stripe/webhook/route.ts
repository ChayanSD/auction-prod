import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

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
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    // Handle payment intent succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const invoiceId = paymentIntent.metadata?.invoiceId;
      const invoiceNumber = paymentIntent.metadata?.invoiceNumber;

      if (invoiceId) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: "Paid",
            paidAt: new Date(),
          },
        });
        console.log(`Invoice ${invoiceId} marked as paid`);
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
            },
          });
          console.log(`Invoice ${invoiceNumber} marked as paid`);
        }
      }
    }

    // Handle checkout session completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;
      const invoiceNumber = session.metadata?.invoiceNumber;

      if (invoiceId) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: "Paid",
            paidAt: new Date(),
          },
        });
        console.log(`Invoice ${invoiceId} marked as paid via checkout session`);
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
            },
          });
          console.log(`Invoice ${invoiceNumber} marked as paid via checkout session`);
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

