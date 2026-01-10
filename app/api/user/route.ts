import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        phone: true,
        accountType: true,
        isVerified: true,
        stripeCustomerId: true,
        termsAccepted: true,
        newsletter: true,
        createdAt: true,
        updatedAt: true,
        billingAddress: true,
        shippingAddress: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

