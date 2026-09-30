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
