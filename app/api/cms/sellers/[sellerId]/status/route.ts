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

    // If approved, send an email and notification
    if (status === "Approved") {
      try {
        const { sendEmail } = await import("@/lib/mail");
        await sendEmail({
          to: updatedUser.email,
          subject: "Your Seller Account has been Approved!",
          template: "seller_approved",
          data: {
            sellerName: `${updatedUser.firstName} ${updatedUser.lastName}`,
          },
        });

        // Add notification for the seller
        await prisma.notification.create({
          data: {
            userId: updatedUser.id,
            type: "SellerUpdate",
            title: "Account Approved",
            message: "Your seller account has been approved. You can now start listing items.",
            link: "/profile/seller-portal",
          },
        });
        // Add real-time notification via Pusher
        try {
          const { pusherServer } = await import("@/lib/pusher-server");
          await pusherServer.trigger(`user-${updatedUser.id}`, "notification", {
            title: "Account Approved",
            message: "Your seller account has been approved.",
            type: "SellerUpdate",
          });
        } catch (pusherError) {
          console.error("Failed to trigger Pusher notification:", pusherError);
        }
      } catch (error) {
        console.error("Failed to send approval notification:", error);
      }
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update seller" }, { status: 500 });
  }
}
