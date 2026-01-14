import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/tag
 * Fetch all tags from database (for autocomplete/suggestions)
 * Query params: q (optional search query), limit (optional, default 50)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const whereClause: any = {};
    
    // If query provided, filter tags by name (case-insensitive)
    if (query && query.length > 0) {
      whereClause.name = {
        contains: query,
        mode: 'insensitive',
      };
    }

    const tags = await prisma.tag.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
