import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Security headers (CSP, X-Frame-Options, etc.) are set per-request in
  // middleware.ts so they can carry a unique nonce for strict-dynamic CSP.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
