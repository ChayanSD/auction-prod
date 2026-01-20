import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { determineAuctionWinners } from '@/lib/auction-winners';

/**
 * GET /api/auction/[auctionId]/winners
 * Get winners for an auction (before or after closing)
 * Admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session || session.accountType !== 'Admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { auctionId } = await params;

    // Get auction info
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        name: true,
        endDate: true,
        status: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Determine winners
    const winnerGroups = await determineAuctionWinners(auctionId);

    // Get existing invoices for this auction
    const existingInvoices = await prisma.invoice.findMany({
      where: { auctionId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lineItems: {
          include: {
            auctionItem: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Map invoices by userId for quick lookup
    const invoicesByUserId = new Map(
      existingInvoices.map((inv) => [inv.userId, inv])
    );

    // Format winners with invoice info
    const winnersWithInvoices = winnerGroups.map((group) => {
      const invoice = invoicesByUserId.get(group.userId);

      return {
        userId: group.userId,
        user: group.user,
        items: group.items.map((item) => ({
          itemId: item.auctionItemId,
          itemName: item.item.name,
          bidAmount: item.bidAmount,
          buyersPremium: item.item.buyersPremium
            ? (item.bidAmount * item.item.buyersPremium) / 100
            : 0,
          taxAmount: item.item.taxPercentage
            ? ((item.bidAmount +
                (item.item.buyersPremium
                  ? (item.bidAmount * item.item.buyersPremium) / 100
                  : 0)) *
                item.item.taxPercentage) /
              100
            : 0,
        })),
        totalAmount: group.totalAmount,
        invoiceId: invoice?.id || null,
        invoiceNumber: invoice?.invoiceNumber || null,
        invoiceStatus: invoice?.status || null,
        invoiceSent: !!invoice?.sentAt,
      };
    });

    return NextResponse.json({
      auction: {
        id: auction.id,
        name: auction.name,
        endDate: auction.endDate,
        status: auction.status,
      },
      winners: winnersWithInvoices,
      totalWinners: winnersWithInvoices.length,
      invoicesGenerated: existingInvoices.length,
    });
  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch winners', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

