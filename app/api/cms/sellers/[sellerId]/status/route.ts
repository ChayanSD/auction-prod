import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sellerId } = await params;
    const body = await request.json();
    const { status, remarks } = body;

    if (!["Approved", "Rejected", "Suspended", "Pending"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update User status
    const updatedUser = await prisma.user.update({
      where: { id: sellerId },
      data: {
        sellerStatus: status,
      },
    });

    // Also update documents if needed? 
    // Usually approving the seller approves the docs implicitly or we should approve docs individually.
    // For MVP, we approve the seller based on docs review.

    // If approved, maybe send an email? (Skipping email for now as not configured)

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update seller" }, { status: 500 });
  }
}
