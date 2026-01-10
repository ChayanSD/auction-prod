import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSlug } from "@/utils/slug";
import {  AuctionCreateSchema } from "@/validation/validator";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    // If name query param exists, fetch auction by name
    if (name) {
      const auction = await prisma.auction.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive', // Case-insensitive search
          },
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      });
      
      if (!auction) {
        return NextResponse.json(
          { error: "Auction not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(auction);
    }
    
    // Otherwise, fetch all auctions
    const auctions = await prisma.auction.findMany({
      include: {
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
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
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
  let body: any = null;
  try {
    body = await request.json();
    console.log("Received request body:", JSON.stringify(body, null, 2));
    
    const validation = AuctionCreateSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation failed:", validation.error.issues);
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    console.log("Validated data:", JSON.stringify(data, null, 2));
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
        startDate: data.startDate, // Already a Date object from z.coerce.date()
        endDate: data.endDate, // Already a Date object from z.coerce.date()
        status: data.status || 'Upcoming',
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { 
      errorMessage, 
      errorStack, 
      requestBody: body,
      errorName: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}