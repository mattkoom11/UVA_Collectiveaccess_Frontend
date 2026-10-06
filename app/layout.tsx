import type { Metadata } from "next";
import { Bodoni_Moda, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ReactNode, Suspense } from "react";
import { headers } from "next/headers";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import KeyboardShortcutsProvider from "@/components/layout/KeyboardShortcutsProvider";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PWAInstallPrompt from "@/components/layout/PWAInstallPrompt";
import AccessibilityControls from "@/components/layout/AccessibilityControls";
import PWAScript from "@/components/layout/PWAScript";
import AnalyticsProvider from "@/components/layout/AnalyticsProvider";
import ErrorBoundary from "@/components/garments/ErrorBoundary";
import FadeIn from "@/components/layout/FadeIn";
import { hydrateGarmentsFromCA } from "@/lib/garments";

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});


const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://uvafashionarchive.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "UVA Fashion Archive",
  description: "A digital glimpse into the University of Virginia's historic garments.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  hydrateGarmentsFromCA().catch((err) => {
    console.error('[CA] Background hydration failed:', err);
  });
  // Reading headers() opts this layout into dynamic rendering, which is what
  // lets Next.js stamp the per-request x-nonce from proxy.ts onto every inline
  // <script> it emits — the nonce-based CSP depends on it.
  //
  // Do NOT remove this to enable static rendering: prerendered pages bake in
  // 7-8 inline scripts with no nonce, and `strict-dynamic` makes the browser
  // ignore `'self'` for those, so they would all be blocked. Making these
  // routes static requires injecting the nonce into static HTML in proxy.ts
  // (an HTML rewrite on every request) or moving off nonce-based CSP.
  const _nonce = (await headers()).get('x-nonce');
  return (
    <html lang="en" className={`${bodoniModa.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="alternate" type="application/rss+xml" title="UVA Fashion Archive - New Garments" href="/feed/garments" />
        <link rel="alternate" type="application/rss+xml" title="UVA Fashion Archive - Exhibitions" href="/feed/exhibitions" />
        <link rel="alternate" type="application/rss+xml" title="UVA Fashion Archive - Learn" href="/feed/learn" />
        <meta name="theme-color" content="#0b0b0c" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-background text-foreground">
        <a
          href="#main-content"
          className="absolute -left-[9999px] top-4 z-[100] px-4 py-2 font-mono text-xs uppercase tracking-widest outline-none focus:left-4 focus:top-4 bg-archive-surface text-archive-fg border border-archive-border"
        >
          Skip to main content
        </a>
        <PWAScript />
        <ErrorBoundary>
          <AnalyticsProvider>
            <KeyboardShortcutsProvider>
              <div className="min-h-screen flex flex-col">
                <SiteHeader />
                <Suspense fallback={null}>
                  <Breadcrumbs />
                </Suspense>
                <main id="main-content" className="flex-1">
                  <FadeIn>{children}</FadeIn>
                </main>
                <SiteFooter />
                <PWAInstallPrompt />
                <AccessibilityControls />
              </div>
            </KeyboardShortcutsProvider>
          </AnalyticsProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
