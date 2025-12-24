import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ZodError } from "zod";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const bidId = url.pathname.split("/").pop();
    if (!bidId) {
      return NextResponse.json(
        { error: "Bid ID is required" },
        { status: 400 }
      );
    }

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        user: true,
        auctionItem: true,
      },
    });

    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    return NextResponse.json(bid);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to fetch bid" }, { status: 500 });
  }
}

export async function PATCH(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
