import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const UpdateNewsletterSchema = z.object({
  newsletter: z.boolean(),
});

/**
 * PATCH /api/user/newsletter
 * Update user's newsletter subscription preference
 * Requires authentication
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = UpdateNewsletterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { newsletter } = validation.data;

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: { newsletter },
      select: {
        id: true,
        email: true,
        newsletter: true,
      },
    });

    // Update session in Redis with new newsletter value
    const updatedSession = {
      ...session,
      newsletter: newsletter,
    };
    await updateSession(updatedSession);

    return NextResponse.json({
      success: true,
      message: newsletter 
        ? 'Successfully subscribed to newsletter' 
        : 'Successfully unsubscribed from newsletter',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating newsletter preference:', error);
    return NextResponse.json(
      { error: 'Failed to update newsletter preference' },
      { status: 500 }
    );
  }
}