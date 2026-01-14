import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BidCreateSchema } from "@/validation/validator";
import { getSession } from "@/lib/session";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import qstashClient from "@/lib/qustash";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    const auctionItemId = searchParams.get('auctionItemId');

    const where: Prisma.BidWhereInput = {};
    
    // If userId is 'current', use session user
    if (userIdParam === 'current') {
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      where.userId = session.id;
    } else if (userIdParam) {
      // Admin can view any user's bids, regular users can only view their own
      if (session && (session.accountType === 'Admin' || session.id === userIdParam)) {
        where.userId = userIdParam;
      } else if (session) {
        where.userId = session.id; // Regular users only see their own
      } else {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } else if (session && session.accountType !== 'Admin') {
      // If no userId param and not admin, only show own bids
      where.userId = session.id;
    }
    
    if (auctionItemId) {
      where.auctionItemId = auctionItemId;
    }

    const bids = await prisma.bid.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        auctionItem: {
          include: {
            productImages: true,
            auction: {
              select: {
                id: true,
                name: true,
                endDate: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(bids);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to fetch bids" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = BidCreateSchema.parse(body);

    const { auctionItemId, amount } = validatedData;
    const userId = session.id;

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch Auction Item with locking (optional, but good practice. using fresh fetch)
      const auctionItem = await tx.auctionItem.findUnique({
        where: { id: auctionItemId },
        include: { auction: true },
      });

      if (!auctionItem) {
        throw new Error("AUCTION_ITEM_NOT_FOUND");
      }

      // 2. Validate Time Window
      const now = new Date();
      const auctionStartDate = auctionItem.auction.startDate ? new Date(auctionItem.auction.startDate) : null;
      const auctionEndDate = auctionItem.auction.endDate ? new Date(auctionItem.auction.endDate) : null;
      
      const isTimeWindowPassed = auctionEndDate && auctionEndDate < now;
      const isClosed = isTimeWindowPassed || auctionItem.auction.status === 'Closed';
      
      if (isClosed) {
        throw new Error("AUCTION_CLOSED");
      }

      const isLive = auctionItem.auction.status === 'Live' || 
        (auctionStartDate && auctionEndDate && auctionStartDate <= now && now < auctionEndDate);

      if (!isLive) {
        throw new Error("AUCTION_NOT_LIVE");
      }

      // 3. Import logic helpers utilizing dynamic import or require if needed, 
      // but here we just need to ensure we can use the logic. 
      // Since it's a server environment, we can rely on our utility.
      // We will perform the logic checks here inside the transaction.

       // Calculate Minimum Valid Bid for THIS user
       // Standard rule: New Max Bid must be >= Current Display Price + Increment
       // UNLESS it's the first bid.
       
       // Let's refetch all bids to determine state accurately
       const allBids = await tx.bid.findMany({
         where: { auctionItemId },
         orderBy: { amount: 'desc' }, // Highest first
         include: { user: true }
       });
       
       const currentDisplayPrice = auctionItem.currentBid || auctionItem.baseBidPrice;
       const { getBidIncrement, getNextMinimumBid, calculateNewCurrentBid } = await import("@/utils/auctionLogic");
       
       // Check if this user is ALREADY the highest bidder
       const highestBidder = allBids[0];
       const isEvaluatedUserHighestBidder = highestBidder && highestBidder.userId === userId;

       // Verify amount meets minimum requirements
       // If I am NOT the highest bidder, my new max bid must be > currentDisplayPrice + valid increment?
       // Actually, standard rule is: You must bid at least the "Asking Price".
       // Asking Price = Current Display Price + Increment.
       
       // One edge case: If the current price is 100, and I am the high bidder at 200.
       // The display is 100 (if no second bidder).
       // If I want to update my max to 250, I should be allowed to.
       // So if I am the high bidder, the minimum I can bid is... actually anything > current display?
       // No, typically you can only increase your max.
       
       let minRequiredBid = getNextMinimumBid(currentDisplayPrice);
       
       // Implementation detail: The user provided example says:
       // "Item starts at £100. Buyer places max bid £200. First bid shows £100."
       // This implies if no prior bids, the bid stands at the base price.
       
       if (allBids.length === 0) {
           minRequiredBid = auctionItem.baseBidPrice;
       } else if (isEvaluatedUserHighestBidder) {
           // If I am already winning, I can raise my max bid.
           // Setting it lower than my current max is usually not allowed or useless.
           // Setting it higher than my current max is allowed.
           // The "next minimum bid" shown to me might be just > my current max? 
           // Or just > current display?
           // Let's stick to standard: input must be >= current display + increment
           // UNLESS I am the high bidder, where I just want to increase my ceiling.
           // But to simplify, let's enforce global rules: New Max Bid must be > Current Display Price.
           // Actually, if I am winning at £100 (Max £200), and I bid £150. That is valid? No, I'm lowering my max.
           // If I bid £300, that is valid.
           if (amount <= highestBidder.amount) {
               throw new Error(`BID_TOO_LOW_OWN_MAX: You are already the highest bidder with a max bid of ${highestBidder.amount}.`);
           }
       } else {
           // I am not the high bidder.
           // Valid bid must be >= currentDisplay + increment.
           // What if High Bidder is at 200 (Display 100).
           // I bid 120. Logic will auto-inc high bidder to 130.
           // My 120 is VALID as long as it is > Display(100) + Increment.
           // So `minRequiredBid` calculation above (current + inc) is correct.
           
           if (amount < minRequiredBid) {
               throw new Error(`BID_TOO_LOW: Bid must be at least ${minRequiredBid}`);
           }
       }
       
      // 4. Create the new Max Bid
      const newBid = await tx.bid.create({
        data: {
          auctionItemId,
          userId,
          amount,
        },
      });
      
      // 5. Re-evaluate the "Current Display Price"
      // Fetch fresh list including the one we just added
      const updatedBids = await tx.bid.findMany({
          where: { auctionItemId },
          orderBy: [
              { amount: 'desc' },
              { createdAt: 'asc' } // Earliest bid wins ties
          ]
      });
      
      const newHighestBid = updatedBids[0];
      const newSecondHighestBid = updatedBids[1];
      
      let newDisplayPrice = auctionItem.baseBidPrice;
      
      if (updatedBids.length === 1) {
          // Only one bidder. Price is Base Price.
          // Check Reserve Logic: If Max >= Reserve, Price jumps to Reserve.
          // Unless Base Price is already higher?
          const { calculateNewCurrentBid } = await import("@/utils/auctionLogic");
          newDisplayPrice = calculateNewCurrentBid(
              newHighestBid.amount,
              0, // No second bidder
              auctionItem.baseBidPrice,
              auctionItem.reservePrice
          );
          
      } else if (updatedBids.length > 1) {
          // Two or more bidders.
          const { calculateNewCurrentBid } = await import("@/utils/auctionLogic");
          
          newDisplayPrice = calculateNewCurrentBid(
              newHighestBid.amount,
              newSecondHighestBid.amount,
              auctionItem.baseBidPrice,
              auctionItem.reservePrice
          );
      }
      
      // 6. Update Auction Item
      await tx.auctionItem.update({
          where: { id: auctionItemId },
          data: { 
              currentBid: newDisplayPrice 
          }
      });
      
      return { 
          bid: newBid, 
          newDisplayPrice, 
          isNewHighBidder: newHighestBid.id === newBid.id,
          previousHighBidderUserId: (allBids.length > 0 && allBids[0].userId !== userId) ? allBids[0].userId : null,
          isReserveMet: !!(auctionItem.reservePrice && newDisplayPrice >= auctionItem.reservePrice)
      };
    });

    // 7. Post-Transaction Notification (Outside TX to keep it fast)
    
    // Notify via Pusher (Realtime)
    const { pusherServer } = await import("@/lib/pusher-server");
    await pusherServer.trigger(`auction-item-${auctionItemId}`, "bid-placed", {
        currentBid: result.newDisplayPrice,
        bidCount: await prisma.bid.count({ where: { auctionItemId } }), 
        latestBidderId: userId,
        isReserveMet: result.isReserveMet // Pass this flag to frontend
        // Note: We do NOT pass reservePrice itself.
    });
    
    // Notify via Email (Queue)
    if (result.previousHighBidderUserId && result.isNewHighBidder) {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            await qstashClient.publishJSON({
                url: `${baseUrl}/api/queue/notify`,
                body: {
                    type: "OUTBID",
                    previousHighBidderId: result.previousHighBidderUserId,
                    auctionItemId,
                    newAmount: result.newDisplayPrice
                },
            });
        } catch (e) {
            console.error("Queue error", e);
        }
    }

    return NextResponse.json({ 
        ...result.bid, 
        currentDisplayPrice: result.newDisplayPrice,
        isReserveMet: result.isReserveMet
    }, { status: 201 });

  } catch (error) {
    console.error("Bid Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    
    const msg = error instanceof Error ? error.message : "Internal server error";
    // Map known errors
    if (msg === "AUCTION_ITEM_NOT_FOUND") return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (msg === "AUCTION_CLOSED") return NextResponse.json({ error: "Auction is closed" }, { status: 409 });
    if (msg === "AUCTION_NOT_LIVE") return NextResponse.json({ error: "Auction not live" }, { status: 409 });
    if (msg.startsWith("BID_TOO_LOW")) return NextResponse.json({ error: msg }, { status: 409 });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
