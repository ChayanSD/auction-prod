import prisma from '@/lib/prisma';

export interface Winner {
  userId: string;
  auctionItemId: string;
  winningBidId: string;
  bidAmount: number;
  item: {
    id: string;
    name: string;
    buyersPremium: number | null;
    taxPercentage: number | null;
  };
}

export interface WinnerGroup {
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  items: Winner[];
  totalAmount: number;
}

/**
 * Determine winners for all items in an auction
 * Returns winners grouped by user
 */
export async function determineAuctionWinners(auctionId: string): Promise<WinnerGroup[]> {
  // Get all items in the auction with their bids
  const items = await prisma.auctionItem.findMany({
    where: { auctionId },
    include: {
      bids: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [
          { amount: 'desc' }, // Highest bid first
          { createdAt: 'asc' }, // If tied, earliest bid wins
        ],
      },
    },
  });

  // Group winners by user
  const winnersByUser = new Map<string, WinnerGroup>();

  for (const item of items) {
    // Find highest bid (first in sorted array)
    const highestBid = item.bids[0];

    if (!highestBid) {
      // No bids on this item, skip it
      continue;
    }

    const userId = highestBid.userId;

    // Get or create winner group for this user
    if (!winnersByUser.has(userId)) {
      winnersByUser.set(userId, {
        userId,
        user: highestBid.user,
        items: [],
        totalAmount: 0,
      });
    }

    const winnerGroup = winnersByUser.get(userId)!;

    // Add this item to the user's wins
    winnerGroup.items.push({
      userId,
      auctionItemId: item.id,
      winningBidId: highestBid.id,
      bidAmount: highestBid.amount,
      item: {
        id: item.id,
        name: item.name,
        buyersPremium: item.buyersPremium,
        taxPercentage: item.taxPercentage,
      },
    });
  }

  // Calculate totals for each winner group
  const winnerGroups = Array.from(winnersByUser.values());

  for (const group of winnerGroups) {
    let total = 0;

    for (const winner of group.items) {
      // Calculate fees for this item
      const buyersPremium = winner.item.buyersPremium
        ? (winner.bidAmount * winner.item.buyersPremium) / 100
        : 0;

      const taxAmount = winner.item.taxPercentage
        ? ((winner.bidAmount + buyersPremium) * winner.item.taxPercentage) / 100
        : 0;

      const lineTotal = winner.bidAmount + buyersPremium + taxAmount;
      total += lineTotal;
    }

    group.totalAmount = total;
  }

  return winnerGroups;
}

/**
 * Calculate fees for a single item
 */
export function calculateItemFees(
  bidAmount: number,
  buyersPremiumPercent: number | null,
  taxPercent: number | null
): {
  buyersPremium: number;
  taxAmount: number;
  lineTotal: number;
} {
  const buyersPremium = buyersPremiumPercent
    ? (bidAmount * buyersPremiumPercent) / 100
    : 0;

  const taxAmount = taxPercent
    ? ((bidAmount + buyersPremium) * taxPercent) / 100
    : 0;

  const lineTotal = bidAmount + buyersPremium + taxAmount;

  return {
    buyersPremium,
    taxAmount,
    lineTotal,
  };
}

