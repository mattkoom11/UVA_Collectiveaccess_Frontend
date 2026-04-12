import { NextRequest, NextResponse } from 'next/server';

/**
 * Workaround for Next.js 16.2.x bug (error E623):
 * When any Next-Router-State-Tree header value is present during an RSC
 * navigation request, the server throws "The router state header was sent
 * but could not be parsed."  This affects ALL values including valid JSON.
 *
 * Stripping the header causes Next.js to treat the request as a fresh
 * (non-incremental) RSC render, which works correctly.  The trade-off is
 * that each client-side navigation re-renders the full RSC tree instead of
 * just the changed segments — functionally identical, marginally less optimal.
 */
export function middleware(request: NextRequest) {
  const isRSC = request.headers.get('RSC') === '1';
  const hasStateTree = request.headers.has('Next-Router-State-Tree');

  if (isRSC && hasStateTree) {
    const headers = new Headers(request.headers);
    headers.delete('Next-Router-State-Tree');
    // Also remove the prefetch header variant to be safe
    headers.delete('Next-Router-Prefetch');
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static assets and Next.js internals
  matcher: '/((?!_next/static|_next/image|favicon\\.ico).*)',
};
