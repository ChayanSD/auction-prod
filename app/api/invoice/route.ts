import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { getSession } from "@/lib/session";
import { sendEmail, generateInvoiceEmailHTML, generatePaymentSuccessEmailHTML } from "@/lib/email";
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

    // Get user with payments
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        payments: true,
      },
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

    // Attempt automatic payment if user has saved payment methods
    let automaticPaymentSuccess = false;
    let stripePaymentIntentId: string | null = null;

    if (user.payments.length > 0) {
      try {
        // Use the first saved payment method (could be improved to use default)
        const paymentMethod = user.payments[0];

        // Ensure user has Stripe customer ID
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

        // Create and confirm PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalAmount * 100), // Convert to pence
          currency: 'gbp',
          customer: stripeCustomerId,
          payment_method: paymentMethod.stripeId,
          off_session: true,
          confirm: true,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber,
            auctionItemId,
            userId,
            winningBidId: winningBid.id,
          },
        });

        if (paymentIntent.status === 'succeeded') {
          // Payment successful
          automaticPaymentSuccess = true;
          stripePaymentIntentId = paymentIntent.id;

          // Update invoice to Paid
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'Paid',
              paidAt: new Date(),
              stripePaymentIntentId,
            },
          });
        }
      } catch (paymentError: unknown) {
        console.error("Automatic payment failed:", paymentError);
        // Log the failure but continue with manual payment flow
      }
    }

    // Create Stripe Payment Link for manual payment if automatic payment failed or no saved methods
    let stripePaymentLink: string | null = null;
    let stripePaymentLinkId: string | null = null;
    let stripeInvoiceId: string | null = null;

    if (!automaticPaymentSuccess) {
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

        // Create a Stripe Price for this one-time payment
        const price = await stripe.prices.create({
          unit_amount: Math.round(totalAmount * 100), // Convert to pence
          currency: 'gbp',
          product_data: {
            name: `${auctionItem.name} - Invoice ${invoiceNumber}`,
          },
        });

        // Create Stripe Payment Link
        const paymentLink = await stripe.paymentLinks.create({
          line_items: [
            {
              price: price.id,
              quantity: 1,
            },
          ],
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber,
            auctionItemId,
            userId,
            winningBidId: winningBid.id,
          },
          after_completion: {
            type: 'redirect',
            redirect: {
              url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/${invoice.id}?success=true`,
            },
          },
        });

        stripePaymentLinkId = paymentLink.id;
        stripePaymentLink = paymentLink.url;

        // Update invoice with Stripe payment link information
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            stripePaymentLinkId,
            stripePaymentLink,
            stripeInvoiceId: null, // Not using invoices anymore
          },
        });
      } catch (stripeError) {
        console.error("Stripe error creating payment link:", stripeError);
        // Log the error but don't fail the invoice creation
        // The invoice will still be created but without a payment link
      }
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

    // Send appropriate email based on payment method
    if (automaticPaymentSuccess) {
      // Send confirmation email for successful automatic payment
      try {
        const emailHTML = generatePaymentSuccessEmailHTML(
          `${user.firstName} ${user.lastName}`,
          invoiceNumber,
          auctionItem.name,
          bidAmount,
          additionalFee,
          totalAmount,
          1
        );

        await sendEmail({
          to: user.email,
          subject: `Payment Successful - Invoice ${invoiceNumber} for ${auctionItem.name}`,
          html: emailHTML,
        });
      } catch (emailError) {
        console.error('Error sending payment success email:', emailError);
      }
    } else if (stripePaymentLink) {
      // Send invoice email for manual payment
      try {
        const emailHTML = generateInvoiceEmailHTML(
          `${user.firstName} ${user.lastName}`,
          invoiceNumber,
          auctionItem.name,
          bidAmount,
          additionalFee,
          totalAmount,
          1,
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

