import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";

const ApproveRequestSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string[] }> | { requestId: string[] } }
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { accountType: true },
    });

    if (user?.accountType !== "Admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const requestId = resolvedParams.requestId[0];
    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = ApproveRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { action, notes } = validation.data;

    // Find the auction request
    const auctionRequest = await prisma.auctionRequest.findUnique({
      where: { id: requestId },
      include: {
        auction: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!auctionRequest) {
      return NextResponse.json(
        { error: "Auction request not found" },
        { status: 404 }
      );
    }

    if (auctionRequest.status !== "Pending") {
      return NextResponse.json(
        { error: `Request has already been ${auctionRequest.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Create the auction item
      const productImages = auctionRequest.productImages as Array<{ url: string; altText?: string }> | null;
      
      const auctionItem = await prisma.auctionItem.create({
        data: {
          name: auctionRequest.name,
          description: auctionRequest.description,
          auctionId: auctionRequest.auctionId,
          startDate: auctionRequest.startDate,
          endDate: auctionRequest.endDate,
          status: "Live",
          baseBidPrice: auctionRequest.baseBidPrice,
          additionalFee: auctionRequest.additionalFee || undefined,
          estimatedPrice: auctionRequest.estimatedPrice || undefined,
          shipping: auctionRequest.shipping || undefined,
          terms: auctionRequest.terms || undefined,
          productImages: productImages && productImages.length > 0 ? {
            create: productImages.map((image) => ({
              url: image.url,
              altText: image.altText || null,
            }))
          } : undefined,
        },
        include: {
          auction: {
            include: {
              category: true,
            },
          },
          productImages: true,
        },
      });

      // Update the request status
      await prisma.auctionRequest.update({
        where: { id: requestId },
        data: {
          status: "Approved",
          reviewedBy: session.id,
          reviewedAt: new Date(),
          notes: notes || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Auction request approved and auction item created successfully",
        data: {
          auctionItem,
          request: {
            id: auctionRequest.id,
            status: "Approved",
          },
        },
      });
    } else if (action === "reject") {
      // Update the request status to rejected
      await prisma.auctionRequest.update({
        where: { id: requestId },
        data: {
          status: "Rejected",
          reviewedBy: session.id,
          reviewedAt: new Date(),
          notes: notes || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Auction request rejected",
        data: {
          request: {
            id: auctionRequest.id,
            status: "Rejected",
          },
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing auction request:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string[] }> | { requestId: string[] } }
): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const requestId = resolvedParams.requestId[0];
    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Check if user is admin or the owner of the request
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { accountType: true },
    });

    const auctionRequest = await prisma.auctionRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        auction: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!auctionRequest) {
      return NextResponse.json(
        { error: "Auction request not found" },
        { status: 404 }
      );
    }

    // Only admin or the owner can view the request
    if (user?.accountType !== "Admin" && auctionRequest.userId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json(auctionRequest);
  } catch (error) {
    console.error("Error fetching auction request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

