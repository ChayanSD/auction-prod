import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "../../../lib/prisma";
import { categorySchema } from "../../../validation/validator";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validated = categorySchema.parse(body);
    const category = await prisma.category.create({
      data: { name: validated.body.name },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const categories = await prisma.category.findMany({
      include: {
        auctions: {
          include: {
            items: {
              include: {
                productImages: {
                  take: 1,
                  orderBy: {
                    createdAt: 'asc'
                  }
                }
              },
              take: 1,
              orderBy: {
                createdAt: 'desc'
              }
            },
            take: 1,
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      }
    });

    // Map categories to include image URL from first auction item
    const categoriesWithImages = categories.map(category => {
      const imageUrl = category.auctions?.[0]?.items?.[0]?.productImages?.[0]?.url || null;
      return {
        id: category.id,
        name: category.name,
        imageUrl: imageUrl,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      };
    });

    return NextResponse.json(categoriesWithImages);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
