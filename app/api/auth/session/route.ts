import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.id) {
        return NextResponse.json(null);
    }

    // Always fetch fresh data from the database to reflect Admin updates (like sellerStatus)
    const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: {
            id: true,
            email: true,
            firstName: true,
            middleName: true,
            lastName: true,
            phone: true,
            accountType: true,
            sellerStatus: true,
            companyName: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            stripeCustomerId: true,
            termsAccepted: true,
            newsletter: true,
        }
    });

    if (!user) {
        return NextResponse.json(null);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
  }
}