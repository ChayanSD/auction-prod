import { NextRequest, NextResponse } from 'next/server';

/**
 * Category API routes - Deprecated
 * Categories have been removed from the system
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Categories have been removed. Please use /api/auction instead.' },
    { status: 410 } // 410 Gone - resource no longer available
  );
}

export async function PATCH(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Categories have been removed. Please use /api/auction instead.' },
    { status: 410 }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Categories have been removed. Please use /api/auction instead.' },
    { status: 410 }
  );
}
