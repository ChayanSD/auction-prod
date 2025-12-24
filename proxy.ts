import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path starts with /cms
  if (pathname.startsWith('/cms')) {
    try {
      const session = await getSession();

      if (!session || session.accountType !== 'Admin') {
        // Redirect to home page if not admin
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      console.error('Middleware auth error:', error);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/cms/:path*',
};