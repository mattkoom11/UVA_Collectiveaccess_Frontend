import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Generate a fresh cryptographic nonce for every request.
  // Next.js App Router reads `x-nonce` from the request headers and
  // automatically applies it to all inline <script> tags it emits, enabling
  // a strict nonce-based CSP without `'unsafe-inline'` for scripts.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = [
    "default-src 'self'",
    // 'nonce-...' allows only scripts that carry this nonce (Next.js framework
    // scripts, any <Script nonce={nonce}> you add).
    // 'strict-dynamic' lets those trusted scripts load further scripts
    // dynamically (React lazy, Three.js workers, etc.) without widening the
    // allowlist.
    // 'unsafe-eval' is required by Three.js for GPU shader compilation.
    // 'self' acts as a fallback for browsers that do not understand
    // 'strict-dynamic'.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`,
    // Tailwind v4 injects <style> blocks at runtime and many components use
    // inline style={} attributes, so 'unsafe-inline' is required here.
    // Nonces on <style> tags are left for a future refactor that removes
    // runtime CSS injection.
    "style-src 'self' 'unsafe-inline'",
    // Images come from CollectiveAccess (any host), data URIs, and blobs.
    "img-src 'self' data: blob: https: http:",
    // 3-D model blobs; audio/video placeholders.
    "media-src 'self' blob: data:",
    // Geist / display fonts are self-hosted by Next.js; data URIs for icons.
    "font-src 'self' data:",
    // All API calls go through /api/* server-side routes, so only 'self' is
    // needed for client-side fetch/XHR.
    "connect-src 'self'",
    // Three.js spawns Web Workers from blob: URLs.
    "worker-src blob:",
    // No plugin content (Flash, etc.).
    "object-src 'none'",
    // Prevent the site from being framed elsewhere.
    "frame-ancestors 'none'",
    // Restrict <form action> to same origin.
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  // Forward the nonce to server components so they can pass it to any
  // explicit <Script nonce={nonce}> tags if needed.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Security headers — set on the response so every page and API route gets
  // them, regardless of static caching.
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  // Run on all routes except Next.js static assets and images.
  matcher: '/((?!_next/static|_next/image|favicon\\.ico).*)',
};
