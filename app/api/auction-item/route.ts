import prisma from "@/lib/prisma";
import { AuctionItemCreateSchema } from "@/validation/validator";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const auctionId = searchParams.get('auctionId');

    const whereClause: {
      auctionId?: string;
    } = {};

    if (auctionId) {
      whereClause.auctionId = auctionId;
    }

    const { getSession } = await import("@/lib/session");
    const session = await getSession();
    const isAdmin = session?.accountType === 'Admin';

    const auctionItems = await prisma.auctionItem.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        productImages: true,
        tags: {
          include: {
            tag: true,
          },
        },
        bids: {
          select: {
            id: true,
            amount: true,
            createdAt: true,
          },
        },
        auction: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Strip sensitive data for non-admins
    if (!isAdmin) {
      const sanitizedItems = auctionItems.map(item => {
        const { reservePrice, ...rest } = item;
        // Also recalculate isReserveMet if needed, but for list view usually specific logic applies.
        // For now, simply removing reservePrice is key.
        return rest;
      });
      return NextResponse.json(sanitizedItems);
    }

    return NextResponse.json(auctionItems);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to fetch auction items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validatedData = AuctionItemCreateSchema.parse(body);

    const {
      name,
      description,
      auctionId,
      lotNumber,
      shipping,
      terms,
      baseBidPrice,
      reservePrice, // Added reservePrice
      buyersPremium,
      taxPercentage,
      currentBid,
      estimateMin,
      estimateMax,
      productImages,
      tags,
      sellerId, // Added sellerId for consignment
    } = validatedData;

    // Auto-generate lot number if not provided
    let finalLotNumber: string | null = lotNumber?.trim() || null;
    
    if (!finalLotNumber) {
      // Find all items in the same auction to determine next lot number
      const existingItems = await prisma.auctionItem.findMany({
        where: { auctionId },
        select: { lotNumber: true },
        orderBy: { createdAt: 'asc' }, // Order by creation to ensure consistent numbering
      });

      // Extract numeric values from lot numbers and find the maximum
      let maxLotNumber = 0;
      existingItems.forEach(item => {
        if (item.lotNumber) {
          // Try to extract numeric value from lot number
          // Handles formats like "1", "2", "Lot 3", "Lap 12A", etc.
          const match = item.lotNumber.toString().match(/\d+/);
          if (match) {
            const num = parseInt(match[0], 10);
            if (num > maxLotNumber) {
              maxLotNumber = num;
            }
          }
        }
      });

      // Generate next lot number (starting from 1 if no items exist)
      finalLotNumber = (maxLotNumber + 1).toString();
    }

    const auctionItem = await prisma.auctionItem.create({
      data: {
        name,
        description,
        auctionId,
        lotNumber: finalLotNumber,
        shipping,
        terms,
        baseBidPrice,
        reservePrice, // Added reservePrice
        buyersPremium,
        taxPercentage,
        currentBid,
        estimateMin,
        estimateMax,
        sellerId: sellerId || null, // Consignment tracking
        productImages: productImages
          ? {
              create: productImages.map((image) => ({
                url: image.url,
                altText: image.altText,
              })),
            }
          : undefined,
        tags: tags ? {
          create: tags.map((tag) => ({
            tag: {
              connectOrCreate: {
                where: { name: tag.name },
                create: { name: tag.name }
              }
            }
          }))
        } : undefined,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json(auctionItem, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
