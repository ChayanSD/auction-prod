import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AuctionUpdateSchema } from "@/validation/validator";
import { Prisma } from "@/app/generated/prisma/client";

async function findAuction(auctionId: string) {
  let auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
  if (!auction) {
    auction = await prisma.auction.findUnique({
      where: { slug: auctionId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }
  return auction;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const auctionId = url.pathname.split("/").pop();
    if (!auctionId) {
      return NextResponse.json(
        { error: "Auction ID or slug required" },
        { status: 400 }
      );
    }

    const auction = await findAuction(auctionId);
    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(auction);
  } catch (error) {
    console.error("Error fetching auction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const auctionId = url.pathname.split("/").pop();
    if (!auctionId) {
      return NextResponse.json(
        { error: "Auction ID or slug required" },
        { status: 400 }
      );
    }

    const auction = await findAuction(auctionId);
    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = AuctionUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: Prisma.AuctionUpdateInput = {};
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.location) updateData.location = data.location;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.status) updateData.status = data.status;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.termsAndConditions !== undefined) updateData.termsAndConditions = data.termsAndConditions || null;
    if (data.tags) {
      // Delete existing tags
      await prisma.tagOnAuction.deleteMany({
        where: { auctionId: auction.id },
      });
      // Add new tags
      updateData.tags = {
        create: data.tags.map((tag) => ({
          tag: {
            connectOrCreate: {
              where: { name: tag.name },
              create: { name: tag.name },
            },
          },
        })),
      };
    }

    const updatedAuction = await prisma.auction.update({
      where: { id: auction.id },
      data: updateData,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json(updatedAuction);
  } catch (error) {
    console.error("Error updating auction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const auctionId = url.pathname.split("/").pop();
    if (!auctionId) {
      return NextResponse.json(
        { error: "Auction ID or slug required" },
        { status: 400 }
      );
    }

    const auction = await findAuction(auctionId);
    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found" },
        { status: 404 }
      );
    }

    await prisma.auction.delete({
      where: { id: auction.id },
    });

    return NextResponse.json({ message: "Auction deleted successfully" });
  } catch (error) {
    console.error("Error deleting auction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}