import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Run on all routes except static assets and Next.js internals
  matcher: '/((?!_next/static|_next/image|favicon\\.ico).*)',
};
