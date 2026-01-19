import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { z } from "zod";

const DocumentUploadSchema = z.object({
  type: z.enum(["Identity", "ProofOfAddress", "Contract", "Other"]),
  url: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = DocumentUploadSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { type, url } = validation.data;

    // Find the user ID based on email (session might not have ID if old token, but usually does. 
    // Best to query user by email to be safe if session.id isn't guaranteed)
    const user = await prisma.user.findUnique({
        where: { email: session.email },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create the document
    const document = await prisma.sellerDocument.create({
      data: {
        userId: user.id,
        type,
        url,
        status: "Pending",
      },
    });

    // Determine if we should update user status?
    // Maybe keep it as 'Pending' until admin reviews.

    return NextResponse.json(document);
  } catch (error) {
    console.error("Document link error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.email) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    
        const user = await prisma.user.findUnique({
            where: { email: session.email },
            include: {
                infoDocuments: true
            }
        });
    
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
    
        return NextResponse.json(user.infoDocuments);
      } catch (error) {
        console.error("Document fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
}
