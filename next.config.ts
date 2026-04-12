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
  async headers() {
    const csp = [
      "default-src 'self'",
      // Three.js / @react-three/fiber needs eval for shader compilation
      "script-src 'self' 'unsafe-eval'",
      // Tailwind v4 emits inline styles at runtime
      "style-src 'self' 'unsafe-inline'",
      // Images come from CollectiveAccess (any host) and data URIs / blobs
      "img-src 'self' data: blob: https: http:",
      // 3D model files loaded as blobs; audio/video placeholders
      "media-src 'self' blob: data:",
      // Geist font is self-hosted by Next.js; data URIs for icon fonts
      "font-src 'self' data:",
      // Client-side fetch only hits own API routes (/api/*)
      "connect-src 'self'",
      // Three.js spawns Web Workers from blob URLs
      "worker-src blob:",
      // No plugins
      "object-src 'none'",
      // Belt-and-suspenders alongside X-Frame-Options
      "frame-ancestors 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
