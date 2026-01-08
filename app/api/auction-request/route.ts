import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";

const AuctionRequestSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  auctionId: z.string().min(1, "Auction is required"),
  baseBidPrice: z.number().min(0, "Base bid price must be positive"),
  additionalFee: z.number().min(0).optional(),
  estimatedPrice: z.number().min(0).optional(),
  shipping: z.object({
    address: z.string(),
    cost: z.number().min(0),
    deliveryTime: z.string().optional(),
  }).optional(),
  terms: z.string().optional(),
  productImages: z.array(z.object({
    url: z.string().url(),
    altText: z.string().optional(),
  })).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = AuctionRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify auction exists
    const auction = await prisma.auction.findUnique({
      where: { id: data.auctionId },
      select: { id: true },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found" },
        { status: 404 }
      );
    }

    // Create auction request
    console.log('Creating auction request with data:', {
      userId: session.id,
      auctionId: data.auctionId,
      name: data.name,
      baseBidPrice: data.baseBidPrice,
    });

    const auctionRequest = await prisma.auctionRequest.create({
      data: {
        userId: session.id,
        auctionId: data.auctionId,
        name: data.name,
        description: data.description,
        baseBidPrice: data.baseBidPrice,
        additionalFee: data.additionalFee || undefined,
        estimatedPrice: data.estimatedPrice || undefined,
        shipping: data.shipping || undefined,
        terms: data.terms || undefined,
        productImages: data.productImages || undefined,
        status: "Pending",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        auction: true,
      },
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Auction request submitted successfully. An admin will review it shortly.",
        data: auctionRequest 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating auction request:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });
    
    // Check for Prisma foreign key constraint errors
    if (errorMessage.includes('Foreign key constraint') || errorMessage.includes('P2003')) {
      return NextResponse.json(
        { 
          error: "Invalid user or auction reference", 
          details: "The user or auction you're trying to reference doesn't exist. Please try logging in again." 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    // Validate status if provided
    const validStatuses = ["Pending", "Approved", "Rejected"] as const;
    const status = statusParam && validStatuses.includes(statusParam as typeof validStatuses[number])
      ? (statusParam as typeof validStatuses[number])
      : undefined;

    const whereClause: { userId?: string; status?: typeof validStatuses[number] } = {};

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { accountType: true },
    });

    if (user?.accountType === "Admin") {
      // Admin can see all requests
      if (status) {
        whereClause.status = status;
      }
    } else {
      // Regular users can only see their own requests
      whereClause.userId = session.id;
      if (status) {
        whereClause.status = status;
      }
    }

    const auctionRequests = await prisma.auctionRequest.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        auction: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(auctionRequests);
  } catch (error) {
    console.error("Error fetching auction requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

