import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/search
 * Search auction items by name
 * Query params: q (search query), limit (optional, default 10)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!query || query.length === 0) {
      return NextResponse.json([]);
    }

    // Search auction items by name (case-insensitive)
    const auctionItems = await prisma.auctionItem.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        productImages: {
          take: 1, // Only get first image for search results
        },
        auction: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format results for frontend
    const results = auctionItems.map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.productImages[0]?.url || null,
      currentBid: item.currentBid || item.baseBidPrice,
      bidCount: item._count.bids,
      auctionName: item.auction.name,
      auctionStatus: item.auction.status,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching auction items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

