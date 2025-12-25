import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "../../../../lib/prisma";
import { categorySchema } from "../../../../validation/validator";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const categoryId = url.pathname.split("/").pop();
  if (!categoryId) {
    return NextResponse.json(
      { error: "Category ID required" },
      { status: 400 }
    );
  }
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(category);
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

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const categoryId = url.pathname.split("/").pop();
  if (!categoryId) {
    return NextResponse.json(
      { error: "Category ID required" },
      { status: 400 }
    );
  }
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    await prisma.category.delete({
      where: { id: categoryId },
    });
    return NextResponse.json({ message: "Category deleted" });
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

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const categoryId = url.pathname.split("/").pop();
  if (!categoryId) {
    return NextResponse.json(
      { error: "Category ID required" },
      { status: 400 }
    );
  }
  try {
    const body = await request.json();
    const validated = categorySchema.parse(body);
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { name: validated.body.name , imageUrl : validated.body.imageUrl  },
    });
    return NextResponse.json(updatedCategory , {status: 200 });
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
