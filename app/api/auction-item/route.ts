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

    const auctionItems = await prisma.auctionItem.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        productImages: true,
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
    } = validatedData;

    const auctionItem = await prisma.auctionItem.create({
      data: {
        name,
        description,
        auctionId,
        shipping,
        terms,
        baseBidPrice,
        reservePrice, // Added reservePrice
        buyersPremium,
        taxPercentage,
        currentBid,
        estimateMin,
        estimateMax,
        productImages: productImages
          ? {
              create: productImages.map((image) => ({
                url: image.url,
                altText: image.altText,
              })),
            }
          : undefined,
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
