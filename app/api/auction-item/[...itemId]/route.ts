import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { AuctionItemCreateSchema } from "../../../../validation/validator";
import { z } from "zod";
import { Prisma } from "../../../../app/generated/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string | string[] }> | { itemId: string | string[] } }
): Promise<NextResponse> {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const itemIdArray = resolvedParams.itemId;
    const itemId = Array.isArray(itemIdArray) 
      ? itemIdArray[0]
      : itemIdArray;
    
    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const auctionItem = await prisma.auctionItem.findUnique({
      where: { id: itemId },
      include: {
        productImages: true,
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
          orderBy: {
            createdAt: 'desc',
          },
        },
        auction: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });

    if (!auctionItem) {
      return NextResponse.json(
        { error: "Auction item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(auctionItem);
  } catch (error) {
    console.error("Error fetching auction item:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to fetch auction item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string | string[] }> | { itemId: string | string[] } }
): Promise<NextResponse> {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const itemIdArray = resolvedParams.itemId;
    const itemId = Array.isArray(itemIdArray) ? itemIdArray[0] : itemIdArray;
    
    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    await prisma.auctionItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ message: "Auction item deleted successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to delete auction item" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string | string[] }> | { itemId: string | string[] } }
): Promise<NextResponse> {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const itemIdArray = resolvedParams.itemId;
    const itemId = Array.isArray(itemIdArray) ? itemIdArray[0] : itemIdArray;
    
    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateSchema = AuctionItemCreateSchema.omit({
      bids: true,
    }).partial();
    const validatedData = updateSchema.parse(body);

    const updateData: Prisma.AuctionItemUpdateInput = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.description) updateData.description = validatedData.description;
    if (validatedData.auctionId) updateData.auction = { connect: { id: validatedData.auctionId } };
    if (validatedData.shipping !== undefined) updateData.shipping = validatedData.shipping;
    if (validatedData.terms !== undefined) updateData.terms = validatedData.terms;
    if (validatedData.baseBidPrice) updateData.baseBidPrice = validatedData.baseBidPrice;
    if (validatedData.buyersPremium !== undefined) updateData.buyersPremium = validatedData.buyersPremium;
    if (validatedData.taxPercentage !== undefined) updateData.taxPercentage = validatedData.taxPercentage;
    if (validatedData.currentBid !== undefined) updateData.currentBid = validatedData.currentBid;
    if (validatedData.estimateMin !== undefined) updateData.estimateMin = validatedData.estimateMin;
    if (validatedData.estimateMax !== undefined) updateData.estimateMax = validatedData.estimateMax;
    if (validatedData.productImages) {
      // Delete existing product images
      await prisma.productImage.deleteMany({
        where: { auctionItemId: itemId },
      });
      // Add new product images
      updateData.productImages = {
        create: validatedData.productImages.map((image) => ({
          url: image.url,
          altText: image.altText,
        })),
      };
    }

    const auctionItem = await prisma.auctionItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return NextResponse.json(auctionItem);
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
