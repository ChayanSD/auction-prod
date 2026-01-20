import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * GET: Fetch seller profile info
 * PATCH: Update seller profile (bank details, company name, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "Seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyName: true,
        taxId: true,
        bankName: true,
        bankAccount: true,
        bankSortCode: true,
        sellerStatus: true,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Seller profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "Seller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      companyName, 
      taxId, 
      bankName, 
      bankAccount, 
      bankSortCode,
      phone
    } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        companyName,
        taxId,
        bankName,
        bankAccount,
        bankSortCode,
        phone
      },
      select: {
        id: true,
        companyName: true,
        taxId: true,
        bankName: true,
        bankAccount: true,
        bankSortCode: true,
      }
    });

    return NextResponse.json({ 
      message: "Profile updated successfully",
      user: updatedUser 
    });
  } catch (error) {
    console.error("Seller profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
