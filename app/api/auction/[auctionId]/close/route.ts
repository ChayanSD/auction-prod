import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { determineAuctionWinners, calculateItemFees } from '@/lib/auction-winners';

/**
 * POST /api/auction/[auctionId]/close
 * Close an auction and generate invoices for winners
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

    // Check if auction exists
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        items: {
          include: {
            bids: true,
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Check if auction is already closed
    if (auction.status === 'Closed') {
      // Check if invoices already exist
      const existingInvoices = await prisma.invoice.findMany({
        where: { auctionId },
      });

      if (existingInvoices.length > 0) {
        return NextResponse.json(
          {
            error: 'Auction is already closed and invoices have been generated',
            invoicesAlreadyExist: true,
          },
          { status: 409 }
        );
      }
    }

    // Update auction status to Closed
    await prisma.auction.update({
      where: { id: auctionId },
      data: { status: 'Closed' },
    });

    // Determine winners
    const winnerGroups = await determineAuctionWinners(auctionId);

    if (winnerGroups.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Auction closed, but no winners found (no bids on any items)',
        winners: [],
        invoicesCreated: 0,
      });
    }

    // Generate invoices for each winner group
    const createdInvoices = [];

    for (const group of winnerGroups) {
      // Check if invoice already exists for this user and auction
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          auctionId,
          userId: group.userId,
        },
      });

      if (existingInvoice) {
        // Invoice already exists, skip
        continue;
      }

      // Generate invoice number
      const invoiceNumber = `INV-${auctionId.slice(-6)}-${group.userId.slice(-6)}-${Date.now().toString().slice(-6)}`;

      // Create invoice
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          auctionId,
          userId: group.userId,
          subtotal: group.totalAmount,
          totalAmount: group.totalAmount,
          status: 'Unpaid',
          // Don't set sentBy/sentAt yet - admin will send later
        },
      });

      // Create line items for each won item
      for (const winner of group.items) {
        const fees = calculateItemFees(
          winner.bidAmount,
          winner.item.buyersPremium,
          winner.item.taxPercentage
        );

        await prisma.invoiceLineItem.create({
          data: {
            invoiceId: invoice.id,
            auctionItemId: winner.auctionItemId,
            winningBidId: winner.winningBidId,
            bidAmount: winner.bidAmount,
            buyersPremium: fees.buyersPremium,
            taxAmount: fees.taxAmount,
            lineTotal: fees.lineTotal,
          },
        });
      }

      createdInvoices.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        userId: group.userId,
        userEmail: group.user.email,
        itemsCount: group.items.length,
        totalAmount: group.totalAmount,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Auction closed. Generated ${createdInvoices.length} invoice(s) for ${winnerGroups.length} winner(s)`,
      winners: winnerGroups.map((g) => ({
        userId: g.userId,
        userName: `${g.user.firstName} ${g.user.lastName}`,
        userEmail: g.user.email,
        itemsWon: g.items.length,
        totalAmount: g.totalAmount,
      })),
      invoicesCreated: createdInvoices.length,
      invoices: createdInvoices,
    });
  } catch (error) {
    console.error('Error closing auction:', error);
    return NextResponse.json(
      { error: 'Failed to close auction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

