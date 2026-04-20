import type { Metadata } from "next";
import { DM_Serif_Display, Crimson_Pro } from "next/font/google";
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

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});


const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://uvafashionarchive.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "UVA Fashion Archive",
  description: "A digital glimpse into the University of Virginia's historic garments.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  void hydrateGarmentsFromCA();
  // Reading headers() here opts this layout into dynamic rendering, which
  // causes Next.js to propagate the x-nonce set by middleware to all inline
  // <script> tags it generates — enabling the strict nonce-based CSP.
  const _nonce = (await headers()).get('x-nonce');
  return (
    <html lang="en" className={`${dmSerifDisplay.variable} ${crimsonPro.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="alternate" type="application/rss+xml" title="UVA Fashion Archive - New Garments" href="/feed/garments" />
        <link rel="alternate" type="application/rss+xml" title="UVA Fashion Archive - Exhibitions" href="/feed/exhibitions" />
        <link rel="alternate" type="application/rss+xml" title="UVA Fashion Archive - Learn" href="/feed/learn" />
        <meta name="theme-color" content="#0f0e0c" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-background text-foreground" style={{ fontFamily: "var(--font-body), Georgia, serif" }}>
        <a
          href="#main-content"
          className="absolute -left-[9999px] top-4 z-[100] px-4 py-2 text-xs uppercase tracking-widest outline-none focus:left-4 focus:top-4 bg-archive-surface text-archive-fg border border-archive-border"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
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
