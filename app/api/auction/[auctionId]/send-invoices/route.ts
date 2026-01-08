import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import stripe from '@/lib/stripe';
import { sendEmail, generateInvoiceEmailHTML } from '@/lib/email';
import { generateInvoicePDF } from '@/lib/pdf-invoice';
import { pusherServer } from '@/lib/pusher-server';

/**
 * POST /api/auction/[auctionId]/send-invoices
 * Send all invoices for an auction (create Stripe links, send emails)
 * Admin only
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> | { auctionId: string } }
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session || session.accountType !== 'Admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { auctionId } = resolvedParams;

    // Get auction
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Get all unpaid invoices for this auction
    const invoices = await prisma.invoice.findMany({
      where: {
        auctionId,
        status: 'Unpaid',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            stripeCustomerId: true,
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
        },
        auction: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (invoices.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unpaid invoices found for this auction',
        invoicesSent: 0,
      });
    }

    // Load admins once for notifications
    const admins = await prisma.user.findMany({
      where: { accountType: 'Admin' },
    });

    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const sentInvoices = [];

    // Process each invoice
    for (const invoice of invoices) {
      try {
        // Skip if already sent
        if (invoice.sentAt) {
          continue;
        }

        // Create or get Stripe customer
        let stripeCustomerId = invoice.user.stripeCustomerId;

        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: invoice.user.email,
            name: `${invoice.user.firstName} ${invoice.user.lastName}`,
            metadata: {
              userId: invoice.user.id,
            },
          });
          stripeCustomerId = customer.id;

          // Update user with Stripe customer ID
          await prisma.user.update({
            where: { id: invoice.user.id },
            data: { stripeCustomerId: customer.id },
          });
        }

        // Create Stripe payment link
        const paymentLink = await stripe.paymentLinks.create({
          line_items: [
            {
              price_data: {
                currency: 'gbp',
                product_data: {
                  name: `Invoice ${invoice.invoiceNumber} - ${auction.name}`,
                  description: `Payment for ${invoice.lineItems.length} item(s) won in auction "${auction.name}"`,
                },
                unit_amount: Math.round((invoice.totalAmount || invoice.subtotal || 0) * 100), // Convert to pence
              },
              quantity: 1,
            },
          ],
          after_completion: {
            type: 'redirect',
            redirect: {
              url: `${frontendUrl}/invoice/${invoice.id}?payment=success`,
            },
          },
          metadata: {
            invoiceId: invoice.id,
            auctionId: auction.id,
            userId: invoice.user.id,
            customerId: stripeCustomerId, // Store customer ID in metadata
          },
        });

        // Update invoice with Stripe payment link
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            stripePaymentLinkId: paymentLink.id,
            stripePaymentLink: paymentLink.url,
            sentBy: session.id,
            sentAt: new Date(),
          },
        });

        // Generate PDF invoice with line items
        const pdfBuffer = await generateInvoicePDF({
          invoice: {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: invoice.totalAmount || invoice.subtotal || 0,
            subtotal: invoice.subtotal || invoice.totalAmount || 0,
            status: invoice.status,
            createdAt: invoice.createdAt,
            paidAt: invoice.paidAt,
            notes: invoice.notes,
            auction: {
              id: auction.id,
              name: auction.name,
              endDate: null,
            },
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
          lineItems: invoice.lineItems.map((li) => ({
            id: li.id,
            auctionItemId: li.auctionItemId,
            itemName: li.auctionItem.name,
            bidAmount: li.bidAmount,
            buyersPremium: li.buyersPremium,
            taxAmount: li.taxAmount,
            lineTotal: li.lineTotal,
          })),
        });

        // Send email with PDF attachment
        const emailHtml = generateInvoiceEmailHTML({
          invoiceNumber: invoice.invoiceNumber,
          userName: `${invoice.user.firstName} ${invoice.user.lastName}`,
          auctionName: auction.name,
          itemsCount: invoice.lineItems.length,
          totalAmount: invoice.totalAmount || invoice.subtotal || 0,
          paymentLink: paymentLink.url,
          invoiceLink: `${frontendUrl}/invoice/${invoice.id}`,
        });

        await sendEmail({
          to: invoice.user.email,
          subject: `Invoice ${invoice.invoiceNumber} - ${auction.name}`,
          html: emailHtml,
          attachments: [
            {
              filename: `invoice-${invoice.invoiceNumber}.pdf`,
              content: pdfBuffer,
            },
          ],
        });

        const totalForUser = invoice.totalAmount || invoice.subtotal || 0;

        // Create notification for user (DB)
        await prisma.notification.create({
          data: {
            userId: invoice.user.id,
            type: 'Invoice',
            title: `Invoice Generated for ${auction.name}`,
            message: `You won ${invoice.lineItems.length} item(s). Total: £${totalForUser.toFixed(
              2
            )}`,
            link: `/invoice/${invoice.id}`,
            invoiceId: invoice.id,
          },
        });

        // Real-time notification for user via Pusher
        await pusherServer.trigger(`user-${invoice.user.id}`, 'invoice-created', {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          auctionId: auction.id,
          auctionName: auction.name,
          totalAmount: totalForUser,
          sentAt: new Date().toISOString(),
        });

        // Create notifications for admins (summary) and push via Pusher
        await Promise.all(
          admins.map(async (admin) => {
            await prisma.notification.create({
              data: {
                userId: admin.id,
                type: 'Invoice',
                title: 'Invoices Generated',
                message: `Invoice ${invoice.invoiceNumber} for ${invoice.user.email} (auction "${auction.name}") – Total £${totalForUser.toFixed(
                  2
                )}`,
                link: `/cms/pannel/payments`,
                invoiceId: invoice.id,
              },
            });
          })
        );

        await pusherServer.trigger('admin-notifications', 'invoice-created', {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          auctionId: auction.id,
          auctionName: auction.name,
          userEmail: invoice.user.email,
          totalAmount: totalForUser,
          sentAt: new Date().toISOString(),
        });

        sentInvoices.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          userEmail: invoice.user.email,
          totalAmount: invoice.totalAmount || invoice.subtotal || 0,
        });
      } catch (invoiceError) {
        console.error(`Error processing invoice ${invoice.id}:`, invoiceError);
        // Continue with other invoices even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentInvoices.length} invoice(s) successfully`,
      invoicesSent: sentInvoices.length,
      invoices: sentInvoices,
    });
  } catch (error) {
    console.error('Error sending invoices:', error);
    return NextResponse.json(
      { error: 'Failed to send invoices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

