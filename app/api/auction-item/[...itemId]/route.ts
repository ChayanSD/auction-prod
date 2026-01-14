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

    // Check if reserve is met
    const currentBid = auctionItem.currentBid || auctionItem.baseBidPrice;

    // Check for admin session to decide whether to show detailed sensitive info like reservePrice
    const { getSession } = await import("@/lib/session");
    const session = await getSession();
    const isAdmin = session?.accountType === 'Admin'; 
    let safeItem: any = { ...auctionItem };
    
    if (!isAdmin) {
        const { reservePrice, ...rest } = auctionItem;
        safeItem = rest;
    }
    
    const isReserveMet = !!(auctionItem.reservePrice && currentBid >= auctionItem.reservePrice);

    return NextResponse.json({
        ...safeItem,
        isReserveMet
    });
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

    // Get current item to know the auctionId for lot number generation
    const currentItem = await prisma.auctionItem.findUnique({
      where: { id: itemId },
      select: { auctionId: true },
    });

    if (!currentItem) {
      return NextResponse.json(
        { error: "Auction item not found" },
        { status: 404 }
      );
    }

    const updateData: Prisma.AuctionItemUpdateInput = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.description) updateData.description = validatedData.description;
    if (validatedData.auctionId) updateData.auction = { connect: { id: validatedData.auctionId } };
    
    // Handle lot number - auto-generate if empty/null, otherwise use provided value
    if (validatedData.lotNumber !== undefined) {
      const targetAuctionId = validatedData.auctionId || currentItem.auctionId;
      let finalLotNumber: string | null = validatedData.lotNumber?.trim() || null;
      
      if (!finalLotNumber) {
        // Auto-generate lot number if not provided
        // Exclude current item to avoid counting it when updating
        const existingItems = await prisma.auctionItem.findMany({
          where: { 
            auctionId: targetAuctionId,
            id: { not: itemId }, // Exclude current item
          },
          select: { lotNumber: true },
        });

        // Extract numeric values from lot numbers and find the maximum
        let maxLotNumber = 0;
        existingItems.forEach(item => {
          if (item.lotNumber) {
            // Try to extract numeric value from lot number
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
      
      updateData.lotNumber = finalLotNumber;
    }
    if (validatedData.shipping !== undefined) updateData.shipping = validatedData.shipping;
    if (validatedData.terms !== undefined) updateData.terms = validatedData.terms;
    if (validatedData.baseBidPrice) updateData.baseBidPrice = validatedData.baseBidPrice;
    
    // Explicitly handle reservePrice. 
    // Note: Zod .optional() means undefined if missing. 
    // If incoming json has "reservePrice": 100, validatedData has 100.
    // If incoming json has "reservePrice": null, schema might fail if not nullable?
    // But since it is simple number optional, we rely on number.
    if (validatedData.reservePrice !== undefined) {
        updateData.reservePrice = validatedData.reservePrice;
    }
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

    const { getSession } = await import("@/lib/session");
    const session = await getSession();
    const isAdmin = session?.accountType === 'Admin';

    if (!isAdmin) {
        const { reservePrice, ...safeItem } = auctionItem;
        return NextResponse.json(safeItem);
    }
    
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
