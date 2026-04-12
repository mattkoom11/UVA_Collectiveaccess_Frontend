import { NextRequest, NextResponse } from 'next/server';

/**
 * Workaround for Next.js 16.2.x bug (error E623):
 * When any Next-Router-State-Tree header value is present during an RSC
 * navigation request, the server throws "The router state header was sent
 * but could not be parsed."
 *
 * Fix: return a 302 redirect to the same URL.  Next.js's client router
 * detects the redirect response from an RSC fetch and automatically falls
 * back to a full hard-navigation (no RSC headers), which the server handles
 * correctly.  The user gets a clean full-page load instead of a broken
 * loading skeleton.
 */
export function middleware(request: NextRequest) {
  const isRSC = request.headers.get('RSC') === '1';
  const hasStateTree = request.headers.has('Next-Router-State-Tree');

  if (isRSC && hasStateTree) {
    // Redirect to the same URL — the client will follow without RSC headers
    return NextResponse.redirect(request.nextUrl, { status: 302 });
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static assets and Next.js internals
  matcher: '/((?!_next/static|_next/image|favicon\\.ico).*)',
};
