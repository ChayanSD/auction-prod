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
    // Handle checkout session completed (for payment links)
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
            stripePaymentLinkId: session.payment_link as string,
          },
        });
        console.log(`Invoice ${invoiceId} marked as paid via checkout session`);
      } else if (invoiceNumber) {
        // Fallback: find by invoice number
        const invoice = await prisma.invoice.findUnique({
          where: { invoiceNumber },
        });
        if (invoice && invoice.status !== 'Paid') {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: "Paid",
              paidAt: new Date(),
              stripePaymentLinkId: session.payment_link as string,
            },
          });
          console.log(`Invoice ${invoiceNumber} marked as paid via checkout session`);
        }
      }
    }

    // Handle charge succeeded (for payment links that use charges)
    if (event.type === "charge.succeeded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      if (paymentIntentId) {
        // Fetch the payment intent to get metadata
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const invoiceId = paymentIntent.metadata?.invoiceId;
        const invoiceNumber = paymentIntent.metadata?.invoiceNumber;

        if (invoiceId) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: "Paid",
              paidAt: new Date(),
              stripePaymentIntentId: paymentIntentId,
            },
          });
          console.log(`Invoice ${invoiceId} marked as paid via charge succeeded`);
        } else if (invoiceNumber) {
          const invoice = await prisma.invoice.findUnique({
            where: { invoiceNumber },
          });
          if (invoice && invoice.status !== 'Paid') {
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                status: "Paid",
                paidAt: new Date(),
                stripePaymentIntentId: paymentIntentId,
              },
            });
            console.log(`Invoice ${invoiceNumber} marked as paid via charge succeeded`);
          }
        }
      }
    }

    // Handle charge updated (fallback for status changes)
    if (event.type === "charge.updated") {
      const charge = event.data.object as Stripe.Charge;

      if (charge.status === 'succeeded') {
        const paymentIntentId = charge.payment_intent as string;

        if (paymentIntentId) {
          // Fetch the payment intent to get metadata
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          const invoiceId = paymentIntent.metadata?.invoiceId;
          const invoiceNumber = paymentIntent.metadata?.invoiceNumber;

          if (invoiceId) {
            // Check if not already paid
            const existingInvoice = await prisma.invoice.findUnique({
              where: { id: invoiceId },
            });
            if (existingInvoice && existingInvoice.status !== 'Paid') {
              await prisma.invoice.update({
                where: { id: invoiceId },
                data: {
                  status: "Paid",
                  paidAt: new Date(),
                  stripePaymentIntentId: paymentIntentId,
                },
              });
              console.log(`Invoice ${invoiceId} marked as paid via charge updated`);
            }
          } else if (invoiceNumber) {
            const invoice = await prisma.invoice.findUnique({
              where: { invoiceNumber },
            });
            if (invoice && invoice.status !== 'Paid') {
              await prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                  status: "Paid",
                  paidAt: new Date(),
                  stripePaymentIntentId: paymentIntentId,
                },
              });
              console.log(`Invoice ${invoiceNumber} marked as paid via charge updated`);
            }
          }
        }
      }
    }

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
        if (invoice && invoice.status !== 'Paid') {
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

