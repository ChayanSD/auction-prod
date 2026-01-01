import prisma from "@/lib/prisma";
import { AuctionItemCreateSchema } from "@/validation/validator";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(): Promise<NextResponse> {
  try {
    const auctionItems = await prisma.auctionItem.findMany({
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
          include: {
            category: true,
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
      startDate,
      endDate,
      shipping,
      terms,
      baseBidPrice,
      additionalFee,
      currentBid,
      estimatedPrice,
      productImages,
    } = validatedData;

    const auctionItem = await prisma.auctionItem.create({
      data: {
        name,
        description,
        auctionId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        shipping,
        terms,
        baseBidPrice,
        additionalFee,
        currentBid,
        estimatedPrice,
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
