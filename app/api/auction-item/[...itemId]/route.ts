import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { AuctionItemCreateSchema } from "../../../../validation/validator";
import { z } from "zod";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const itemId = url.pathname.split("/").pop();
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
        bids: true,
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

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const itemId = url.pathname.split("/").pop();
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

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const itemId = url.pathname.split("/").pop();
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
