import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import qstashClient from '@/lib/qustash';
import { z } from 'zod';

const SendNewsletterSchema = z.object({
  type: z.enum(['upcoming_auction', 'general_news']),
  auctionId: z.string().optional(), // Required for upcoming_auction type
  subject: z.string().min(1, 'Subject is required').optional(), // Required for general_news
  content: z.string().min(1, 'Content is required').optional(), // Required for general_news
  imageUrl: z.string().optional(),
  readMoreUrl: z.string().optional(), // For general_news
});

/**
 * POST /api/newsletter/send
 * Trigger newsletter distribution via queue
 * Admin only
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session || session.accountType !== 'Admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = SendNewsletterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // For upcoming_auction type, fetch auction details to verify it exists
    if (data.type === 'upcoming_auction' && data.auctionId) {
      const auction = await prisma.auction.findUnique({
        where: { id: data.auctionId },
        select: { id: true },
      });

      if (!auction) {
        return NextResponse.json(
          { error: 'Auction not found' },
          { status: 404 }
        );
      }
    }

    // Publish to QStash queue
    const queueUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/queue/newsletter`;
    
    await qstashClient.publishJSON({
      url: queueUrl,
      body: data,
    });

    return NextResponse.json({
      success: true,
      message: 'Newsletter distribution has been queued successfully',
    });
  } catch (error) {
    console.error('Error queuing newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to queue newsletter', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
