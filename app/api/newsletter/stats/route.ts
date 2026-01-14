import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

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
