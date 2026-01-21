import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { pusherServer } from "@/lib/pusher-server";
import { sendEmail, generatePaymentSuccessEmailHTML, generateAdminPaymentReceivedEmailHTML } from "@/lib/email";
import { generateInvoicePDF } from "@/lib/pdf-invoice";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Helper function to handle payment success: update invoice, send email, and create notifications
 */
async function handlePaymentSuccess(invoiceId: string | null, invoiceNumber: string | null) {
  if (!invoiceId && !invoiceNumber) {
    console.error('No invoice ID or number provided for payment success');
    return;
  }

  // Find the invoice
  const invoice = await prisma.invoice.findUnique({
    where: invoiceId ? { id: invoiceId } : { invoiceNumber: invoiceNumber! },
    include: {
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
      auction: {
        select: {
          id: true,
          name: true,
          endDate: true,
        },
      },
      auctionItem: {
        include: {
          productImages: {
            take: 1,
          },
          auction: {
            select: {
              id: true,
              name: true,
              endDate: true,
            },
          },
        },
      },
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
    },
  });

  if (!invoice) {
    console.error(`Invoice not found: ${invoiceId || invoiceNumber}`);
    return;
  }

  // Skip if already paid (avoid duplicate notifications)
  if (invoice.status === 'Paid') {
    console.log(`Invoice ${invoice.id} already marked as paid, skipping notifications`);
    return;
  }

  // Update invoice status
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: 'Paid',
      paidAt: new Date(),
    },
  });

  // CRITICAL: Update soldPrice on items so settlements work!
  // Handle new multi-item invoices
  if (invoice.lineItems && invoice.lineItems.length > 0) {
    for (const item of invoice.lineItems) {
      if (item.auctionItemId) {
         await prisma.auctionItem.update({
            where: { id: item.auctionItemId },
            data: {
               isSold: true,
               soldPrice: item.bidAmount, // Hammer price
            }
         });
      }
    }
  } 
  // Handle legacy single-item invoices
  else if (invoice.auctionItemId) {
     await prisma.auctionItem.update({
        where: { id: invoice.auctionItemId },
        data: {
           isSold: true,
           soldPrice: invoice.bidAmount, // Hammer price
        }
     });
  }

  // Prepare invoice data for PDF and email
  const invoiceViewUrl = `${frontendUrl}/invoice/${invoice.id}`;
  const isCombinedInvoice = invoice.lineItems && invoice.lineItems.length > 0;
  const auctionName = invoice.auction?.name || invoice.auctionItem?.auction?.name || 'Auction';
  const itemsCount = isCombinedInvoice ? invoice.lineItems.length : 1;
  const totalAmount = invoice.totalAmount || invoice.subtotal || 0;

  // Generate paid invoice PDF
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateInvoicePDF({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        bidAmount: invoice.bidAmount ?? undefined,
        buyersPremium: invoice.buyersPremium ?? undefined,
        taxAmount: invoice.taxAmount ?? undefined,
        totalAmount: totalAmount,
        subtotal: invoice.subtotal ?? totalAmount,
        status: 'Paid',
        createdAt: invoice.createdAt,
        paidAt: new Date(),
        notes: invoice.notes,
        auction: invoice.auction ? {
          id: invoice.auction.id,
          name: invoice.auction.name,
          endDate: invoice.auction.endDate ?? null,
        } : undefined,
        auctionItem: invoice.auctionItem ? {
          id: invoice.auctionItem.id,
          name: invoice.auctionItem.name,
          startDate: invoice.auctionItem.auction?.endDate || new Date(),
          endDate: invoice.auctionItem.auction?.endDate || new Date(),
          auction: {
            id: invoice.auctionItem.auction?.id || '',
            name: invoice.auctionItem.auction?.name || '',
            endDate: invoice.auctionItem.auction?.endDate ?? null,
          },
        } : undefined,
        user: {
          id: invoice.user.id,
          firstName: invoice.user.firstName,
          lastName: invoice.user.lastName,
          email: invoice.user.email,
          phone: invoice.user.phone || '',
        },
        shippingAddress: invoice.user.shippingAddress ? {
          address1: invoice.user.shippingAddress.address1,
          address2: invoice.user.shippingAddress.address2,
          city: invoice.user.shippingAddress.city,
          postcode: invoice.user.shippingAddress.postcode,
          country: invoice.user.shippingAddress.country,
        } : null,
      },
      lineItems: invoice.lineItems?.map(item => ({
        id: item.id,
        auctionItemId: item.auctionItemId,
        itemName: item.auctionItem.name,
        lotNumber: item.auctionItem.lotNumber,
        bidAmount: item.bidAmount,
        buyersPremium: item.buyersPremium,
        taxAmount: item.taxAmount,
        lineTotal: item.lineTotal,
      })),
    });
  } catch (pdfError) {
    console.error('Error generating paid invoice PDF:', pdfError);
  }

  // Send payment success email
  try {
    const userName = `${invoice.user.firstName} ${invoice.user.lastName}`.trim() || invoice.user.email;
    const itemName = isCombinedInvoice 
      ? `${itemsCount} item(s) from ${auctionName}`
      : invoice.auctionItem?.name || 'Auction Item';
    
    const emailHTML = generatePaymentSuccessEmailHTML(
      userName,
      invoice.invoiceNumber,
      itemName,
      invoice.bidAmount || (invoice.lineItems?.[0]?.bidAmount ?? 0),
      invoice.buyersPremium || (invoice.lineItems?.reduce((sum, item) => sum + item.buyersPremium, 0) ?? 0),
      invoice.taxAmount || (invoice.lineItems?.reduce((sum, item) => sum + item.taxAmount, 0) ?? 0),
      totalAmount,
      itemsCount,
      invoiceViewUrl
    );

    await sendEmail({
      to: invoice.user.email,
      subject: `Payment Successful - Invoice ${invoice.invoiceNumber}`,
      html: emailHTML,
      attachments: pdfBuffer ? [
        {
          filename: `invoice-${invoice.invoiceNumber}-paid.pdf`,
          content: pdfBuffer,
        },
      ] : undefined,
    });
    console.log(`✅ Payment success email sent to: ${invoice.user.email}`);
  } catch (emailError) {
    console.error('Error sending payment success email:', emailError);
  }

  // Create notification for user
  try {
    await prisma.notification.create({
      data: {
        userId: invoice.user.id,
        type: 'Invoice',
        title: 'Payment Successful',
        message: `Your payment of £${totalAmount.toFixed(2)} for invoice ${invoice.invoiceNumber} has been processed successfully.`,
        link: invoiceViewUrl,
        invoiceId: invoice.id,
      },
    });

    // Real-time notification for user via Pusher
    await pusherServer.trigger(`user-${invoice.user.id}`, 'payment-success', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: totalAmount,
      auctionName: auctionName,
      itemsCount: itemsCount,
      paidAt: new Date().toISOString(),
    });
  } catch (notifError) {
    console.error('Error creating user notification:', notifError);
  }

  // Create notifications and send emails for admins
  try {
    const admins = await prisma.user.findMany({
      where: { accountType: 'Admin' },
      select: { id: true, email: true },
    });

    // Generate admin email HTML
    const adminEmailHTML = generateAdminPaymentReceivedEmailHTML(
      `${invoice.user.firstName} ${invoice.user.lastName}`,
      invoice.user.email,
      invoice.invoiceNumber,
      auctionName,
      itemsCount,
      totalAmount,
      `${frontendUrl}/cms/pannel/payments`
    );

    await Promise.all(
      admins.map(async (admin) => {
        // Create notification for admin
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'Invoice',
            title: 'Payment Received',
            message: `${invoice.user.firstName} ${invoice.user.lastName} paid invoice ${invoice.invoiceNumber} - £${totalAmount.toFixed(2)}`,
            link: `/cms/pannel/payments`,
            invoiceId: invoice.id,
          },
        });

        // Send email to admin
        try {
          await sendEmail({
            to: admin.email,
            subject: `Payment Received - Invoice ${invoice.invoiceNumber}`,
            html: adminEmailHTML,
            attachments: pdfBuffer ? [
              {
                filename: `invoice-${invoice.invoiceNumber}-paid.pdf`,
                content: pdfBuffer,
              },
            ] : undefined,
          });
          console.log(`✅ Payment received email sent to admin: ${admin.email}`);
        } catch (adminEmailError) {
          console.error(`Error sending email to admin ${admin.email}:`, adminEmailError);
          // Don't fail the whole process if one admin email fails
        }
      })
    );

    // Real-time notification for admins via Pusher
    await pusherServer.trigger('admin-notifications', 'payment-success', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      userName: `${invoice.user.firstName} ${invoice.user.lastName}`,
      userEmail: invoice.user.email,
      totalAmount: totalAmount,
      auctionName: auctionName,
      itemsCount: itemsCount,
      paidAt: new Date().toISOString(),
    });
  } catch (adminNotifError) {
    console.error('Error creating admin notifications:', adminNotifError);
  }
}

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
      const userId = session.metadata?.userId;

      if (invoiceId || invoiceNumber) {
        // Update invoice with payment link ID
        if (invoiceId) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              stripePaymentLinkId: session.payment_link as string,
            },
          });
        }

        // Save payment method if payment was successful
        if (session.payment_intent && userId) {
          try {
            // Retrieve the payment intent to get the payment method
            const paymentIntent = await stripe.paymentIntents.retrieve(
              typeof session.payment_intent === 'string' 
                ? session.payment_intent 
                : session.payment_intent.id
            );

            if (paymentIntent.payment_method) {
              const paymentMethodId = typeof paymentIntent.payment_method === 'string'
                ? paymentIntent.payment_method
                : paymentIntent.payment_method.id;

              // Get user to find their customer ID
              const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, stripeCustomerId: true },
              });

              if (user && user.stripeCustomerId) {
                // Check if payment method already exists in our database
                const existingPayment = await prisma.payment.findFirst({
                  where: { stripeId: paymentMethodId },
                });

                if (!existingPayment) {
                  // Retrieve payment method details from Stripe
                  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

                  if (paymentMethod.card) {
                    // Save payment method to database
                    await prisma.payment.create({
                      data: {
                        userId: user.id,
                        stripeId: paymentMethodId,
                        cardHolder: paymentMethod.billing_details.name || 'Unknown',
                        last4: paymentMethod.card.last4,
                        expiryMonth: paymentMethod.card.exp_month,
                        expiryYear: paymentMethod.card.exp_year,
                      },
                    });
                    console.log(`✅ Payment method ${paymentMethodId} saved for user ${userId}`);
                  }
                }
              }
            }
          } catch (saveError) {
            console.error('Error saving payment method:', saveError);
            // Don't fail the webhook if saving payment method fails
          }
        }
        
        // Handle payment success (updates status, sends email, creates notifications)
        await handlePaymentSuccess(invoiceId || null, invoiceNumber || null);
        console.log(`Invoice ${invoiceId || invoiceNumber} processed via checkout session`);
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

        if (invoiceId || invoiceNumber) {
          // Update invoice with payment intent ID
          if (invoiceId) {
            await prisma.invoice.update({
              where: { id: invoiceId },
              data: {
                stripePaymentIntentId: paymentIntentId,
              },
            });
          }
          
          // Handle payment success
          await handlePaymentSuccess(invoiceId || null, invoiceNumber || null);
          console.log(`Invoice ${invoiceId || invoiceNumber} processed via charge succeeded`);
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

          if (invoiceId || invoiceNumber) {
            // Update invoice with payment intent ID
            if (invoiceId) {
              await prisma.invoice.update({
                where: { id: invoiceId },
                data: {
                  stripePaymentIntentId: paymentIntentId,
                },
              });
            }
            
            // Handle payment success (will check if already paid internally)
            await handlePaymentSuccess(invoiceId || null, invoiceNumber || null);
            console.log(`Invoice ${invoiceId || invoiceNumber} processed via charge updated`);
          }
        }
      }
    }

    // Handle invoice payment succeeded
    if (event.type === "invoice.payment_succeeded") {
      const stripeInvoice = event.data.object as Stripe.Invoice;
      const invoiceId = stripeInvoice.metadata?.invoiceId;
      const invoiceNumber = stripeInvoice.metadata?.invoiceNumber;

      if (invoiceId || invoiceNumber) {
        // Update invoice with Stripe invoice ID
        if (invoiceId) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              stripeInvoiceId: stripeInvoice.id,
            },
          });
        }
        
        // Handle payment success
        await handlePaymentSuccess(invoiceId || null, invoiceNumber || null);
        console.log(`Invoice ${invoiceId || invoiceNumber} processed via Stripe invoice`);
      }
    }

    // Handle PaymentIntent succeeded (for automatic payments)
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const invoiceId = paymentIntent.metadata?.invoiceId;
      const invoiceNumber = paymentIntent.metadata?.invoiceNumber;

      if (invoiceId || invoiceNumber) {
        // Update invoice with payment intent ID
        if (invoiceId) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              stripePaymentIntentId: paymentIntent.id,
            },
          });
        }
        
        // Handle payment success (will check if already paid internally)
        await handlePaymentSuccess(invoiceId || null, invoiceNumber || null);
        console.log(`Invoice ${invoiceId || invoiceNumber} processed via PaymentIntent`);
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

