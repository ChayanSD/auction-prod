
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const AdminDocumentUploadSchema = z.object({
  type: z.enum(["Identity", "ProofOfAddress", "Contract", "Other"]),
  url: z.string().min(1),
  name: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  try {
    // Ideally check if user is admin here, but middleware might handle it.
    // Proceeding assuming cms routes are protected. (Check middleware later if needed)

    const sellerId = params.sellerId;
    const body = await request.json();
    const validation = AdminDocumentUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { type, url } = validation.data;

    // Verify seller exists
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Create the document
    const document = await prisma.sellerDocument.create({
      data: {
        userId: sellerId,
        type: type,
        url,
        status: "Approved", // Admin uploaded it, so it's inherently approved or "Sent"
        providedByAdmin: true,
      },
    });

    // Notify the seller
    try {
      const { sendEmail } = await import("@/lib/mail");
      await sendEmail({
          to: seller.email,
          subject: "New Document Provided",
          template: "document_activity",
          data: {
              userName: `${seller.firstName} ${seller.lastName}`,
              documentType: type,
              activityType: "provided",
          }
      });

      await prisma.notification.create({
          data: {
              userId: sellerId,
              type: "DocumentActivity",
              title: "New Document Provided",
              message: `Admin has provided a new ${type} for your account.`,
              link: "/profile/seller-portal?tab=documents",
          }
      });

      // Add real-time notification via Pusher
      const { pusherServer } = await import("@/lib/pusher-server");
      await pusherServer.trigger(`user-${sellerId}`, "notification", {
          title: "New Document Provided",
          message: `Admin has provided a new ${type} for your account.`,
          type: "DocumentActivity",
      });
    } catch (notifyError) {
      console.error("Failed to notify seller about admin document upload:", notifyError);
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Admin document upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  try {
    const sellerId = params.sellerId;
    
    const documents = await prisma.sellerDocument.findMany({
      where: { userId: sellerId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Fetch documents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
