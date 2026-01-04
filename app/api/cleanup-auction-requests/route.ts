import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * Temporary endpoint to clean up old auction_requests data
 * Call this once: DELETE /api/cleanup-auction-requests
 * Then delete this file after migration is complete
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
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

    // Delete all old auction requests
    const result = await prisma.$executeRaw`
      DELETE FROM auction_requests;
    `;

    return NextResponse.json({
      success: true,
      message: `Deleted old auction request records. You can now run: npx prisma db push`,
      deleted: result,
    });
  } catch (error) {
    console.error("Error cleaning up auction requests:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to clean up", details: errorMessage },
      { status: 500 }
    );
  }
}

