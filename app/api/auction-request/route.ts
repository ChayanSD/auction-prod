import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";

const AuctionRequestSchema = z.object({
  itemName: z.string().min(1, "Item name is required").optional(),
  itemDescription: z.string().min(10, "Description must be at least 10 characters").optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
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

    const body = await request.json();
    const validation = AuctionRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Create auction request with new schema
    console.log('Creating auction request with data:', {
      itemName: data.itemName,
      name: data.name,
      email: data.email,
      phone: data.phone,
    });

    const auctionRequest = await prisma.auctionRequest.create({
      data: {
        itemName: data.itemName || null,
        itemDescription: data.itemDescription || null,
        name: data.name,
        email: data.email,
        phone: data.phone,
        productImages: data.productImages ? data.productImages : undefined,
        status: "Pending",
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

    const whereClause: { status?: typeof validStatuses[number]; email?: string } = {};

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { accountType: true, email: true },
    });

    if (user?.accountType === "Admin") {
      // Admin can see all requests
      if (status) {
        whereClause.status = status;
      }
    } else {
      // Regular users can only see their own requests (by email)
      if (user?.email) {
        whereClause.email = user.email;
      }
      if (status) {
        whereClause.status = status;
      }
    }

    const auctionRequests = await prisma.auctionRequest.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
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

