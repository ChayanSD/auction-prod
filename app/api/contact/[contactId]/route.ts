import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { ContactStatus } from "@/app/generated/prisma/enums";


const ContactUpdateSchema = z.object({
  status: z.enum(["New", "InProgress", "Resolved", "Archived"]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
): Promise<NextResponse> {
  try {
    const { contactId } = await params;

    if (!contactId) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = ContactUpdateSchema.safeParse(body.body || body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: {
      status?: ContactStatus;
      notes?: string;
      respondedAt?: Date;
    } = {};

    if (data.status) {
      updateData.status = data.status as ContactStatus;
      if (data.status === 'Resolved' || data.status === 'Archived') {
        updateData.respondedAt = new Date();
      }
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
): Promise<NextResponse> {
  try {
    const { contactId } = await params;

    if (!contactId) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

