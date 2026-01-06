import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSlug } from "@/utils/slug";
import {  AuctionCreateSchema } from "@/validation/validator";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const categoryName = searchParams.get('categoryName');

    const whereClause: {
      categoryId?: string;
      category?: { name: string };
    } = {};

    if (categoryId) {
      whereClause.categoryId = categoryId;
    } else if (categoryName) {
      whereClause.category = { name: categoryName };
    }

    const auctions = await prisma.auction.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        items: {
          select: {
            id: true,
          },
        },
      },
    });
    return NextResponse.json(auctions);
  } catch (error) {
    console.error("Error fetching auctions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = AuctionCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const slug = generateSlug(data.name);
    const existingAuction = await prisma.auction.findUnique({
      where: { slug },
    });
    if (existingAuction) {
      return NextResponse.json(
        { error: "Auction with this slug already exists" },
        { status: 409 }
      );
    }

    const auction = await prisma.auction.create({
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        slug,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl,
        tags: data.tags ? {
          create: data.tags.map((tag) => ({
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
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json(auction, { status: 201 });
  } catch (error) {
    console.error("Error creating auction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}