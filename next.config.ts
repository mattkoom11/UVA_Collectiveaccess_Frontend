import type { NextConfig } from "next";

/**
 * Hosts allowed for `next/image`, derived from the configured CollectiveAccess
 * base URL instead of a blanket "**" wildcard — adding an image host becomes an
 * explicit, reviewable change. next.config is evaluated at build time *and*
 * again by `next start`, so a runtime-only CA_BASE_URL is still picked up.
 */
function caHostnames(): string[] {
  const hosts = new Set<string>();
  for (const raw of [process.env.NEXT_PUBLIC_CA_BASE_URL, process.env.CA_BASE_URL]) {
    if (!raw) continue;
    try {
      hosts.add(new URL(raw).hostname);
    } catch {
      // An unparsable URL is not a usable image host — ignore it rather than
      // widening the allowlist.
    }
  }
  return [...hosts];
}

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = caHostnames().flatMap(
  (hostname) => [
    { protocol: "https" as const, hostname },
    { protocol: "http" as const, hostname },
  ],
);

const nextConfig: NextConfig = {
  images: {
    // CA media can require the authenticated session cookie that the built-in
    // optimizer cannot carry, so optimization stays off and CA's own thumbnail
    // derivatives are used. remotePatterns is pinned anyway so enabling
    // optimization later is safe by default rather than wide-open.
    unoptimized: true,
    remotePatterns,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Security headers (CSP, X-Frame-Options, etc.) are set per-request in
  // proxy.ts so they can carry a unique nonce for strict-dynamic CSP.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // The runway and the hall preview were folded into the homepage, which is
  // now the museum's entrance.
  async redirects() {
    return [
      { source: "/runway", destination: "/", permanent: false },
      { source: "/hall", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
