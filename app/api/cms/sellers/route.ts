import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.accountType !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {
      accountType: "Seller",
    };

    if (status) {
      where.sellerStatus = status;
    }

    const sellers = await prisma.user.findMany({
      where,
      include: {
        infoDocuments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sellers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch sellers" }, { status: 500 });
  }
}
