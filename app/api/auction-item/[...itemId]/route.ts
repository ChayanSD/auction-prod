import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { AuctionItemCreateSchema } from "../../../../validation/validator";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string | string[] }> | { itemId: string | string[] } }
): Promise<NextResponse> {
  try {
    // Handle async params (Next.js 15+) and sync params
    const resolvedParams = params instanceof Promise ? await params : params;
    const itemIdArray = resolvedParams.itemId;
    
    // Handle both array (catch-all) and string params
    // For single item ID, take first element; for multiple, join them
    const itemId = Array.isArray(itemIdArray) 
      ? itemIdArray[0] // For single item IDs, use first element
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
            category: true,
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
      auctionId: true,
      bids: true,
      productImages: true,
    }).partial();
    const validatedData = updateSchema.parse(body);

    const auctionItem = await prisma.auctionItem.update({
      where: { id: itemId },
      data: validatedData,
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
