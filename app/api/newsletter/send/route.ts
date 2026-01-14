import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { sendEmail, generateUpcomingAuctionNewsletterHTML, generateGeneralNewsletterHTML } from '@/lib/email';
import { z } from 'zod';

const SendNewsletterSchema = z.object({
  type: z.enum(['upcoming_auction', 'general_news']),
  auctionId: z.string().optional(), // Required for upcoming_auction type
  subject: z.string().min(1, 'Subject is required'), // Required for general_news
  content: z.string().min(1, 'Content is required'), // Required for general_news
  imageUrl: z.string().optional(),
  readMoreUrl: z.string().optional(), // For general_news
});

/**
 * POST /api/newsletter/send
 * Send newsletter to all subscribed users
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

    // For upcoming_auction type, fetch auction details
    let auction = null;
    if (data.type === 'upcoming_auction' && data.auctionId) {
      auction = await prisma.auction.findUnique({
        where: { id: data.auctionId },
        include: {
          items: {
            select: { id: true },
          },
        },
      });

      if (!auction) {
        return NextResponse.json(
          { error: 'Auction not found' },
          { status: 404 }
        );
      }
    }

    // Get all users who have subscribed to newsletter
    const subscribedUsers = await prisma.user.findMany({
      where: {
        newsletter: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (subscribedUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscribed users found',
        emailsSent: 0,
      });
    }

    // Check if email is configured
    const emailConfigured = !!(process.env.APP_EMAIL || process.env.SMTP_USER) && 
                            !!(process.env.APP_PASSWORD || process.env.SMTP_PASSWORD);
    
    if (!emailConfigured) {
      return NextResponse.json(
        { 
          error: 'Email not configured. Please set APP_EMAIL and APP_PASSWORD (or SMTP_USER and SMTP_PASSWORD) environment variables.',
          emailsSent: 0,
          emailsFailed: subscribedUsers.length,
        },
        { status: 500 }
      );
    }

    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let emailsSent = 0;
    let emailsFailed = 0;
    const errors: string[] = [];

    // Send emails in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < subscribedUsers.length; i += batchSize) {
      const batch = subscribedUsers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (user) => {
          try {
            const userName = `${user.firstName} ${user.lastName}`.trim() || user.email;
            const unsubscribeUrl = `${frontendUrl}/profile?unsubscribe=true`;

            let emailHtml: string;
            let subject: string;

            if (data.type === 'upcoming_auction' && auction) {
              const auctionUrl = `${frontendUrl}/auction?auction=${auction.slug || auction.id}`;
              
              emailHtml = generateUpcomingAuctionNewsletterHTML({
                userName,
                auctionName: auction.name,
                auctionDescription: auction.description,
                auctionImageUrl: auction.imageUrl || data.imageUrl || undefined,
                startDate: auction.startDate?.toISOString(),
                endDate: auction.endDate?.toISOString(),
                location: auction.location,
                itemCount: auction.items.length,
                auctionUrl,
                unsubscribeUrl,
              });

              subject = `Upcoming Auction: ${auction.name}`;
            } else {
              // General news
              emailHtml = generateGeneralNewsletterHTML({
                userName,
                subject: data.subject,
                content: data.content,
                imageUrl: data.imageUrl,
                readMoreUrl: data.readMoreUrl,
                unsubscribeUrl,
              });

              subject = data.subject;
            }

            await sendEmail({
              to: user.email,
              subject,
              html: emailHtml,
            });

            emailsSent++;
          } catch (error) {
            emailsFailed++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push(`Failed to send to ${user.email}: ${errorMessage}`);
            console.error(`Failed to send newsletter email to ${user.email}:`, error);
          }
        })
      );

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < subscribedUsers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter sent successfully`,
      emailsSent,
      emailsFailed,
      totalSubscribers: subscribedUsers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/newsletter/stats
 * Get newsletter subscription statistics
 * Admin only
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session || session.accountType !== 'Admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const [totalSubscribers, totalUsers] = await Promise.all([
      prisma.user.count({
        where: { newsletter: true },
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      totalSubscribers,
      totalUsers,
      subscriptionRate: totalUsers > 0 ? ((totalSubscribers / totalUsers) * 100).toFixed(2) + '%' : '0%',
    });
  } catch (error) {
    console.error('Error fetching newsletter stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter statistics' },
      { status: 500 }
    );
  }
}