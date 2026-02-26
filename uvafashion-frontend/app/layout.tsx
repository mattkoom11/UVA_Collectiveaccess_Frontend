import type { Metadata } from "next";
import "./globals.css";
import { ReactNode, Suspense } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import KeyboardShortcutsProvider from "@/components/layout/KeyboardShortcutsProvider";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PWAInstallPrompt from "@/components/layout/PWAInstallPrompt";
import AccessibilityControls from "@/components/layout/AccessibilityControls";
import PWAScript from "@/components/layout/PWAScript";
import AnalyticsProvider from "@/components/layout/AnalyticsProvider";
import ErrorBoundary from "@/components/garments/ErrorBoundary";
import { hydrateGarmentsFromCA } from "@/lib/garments";


const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://uvafashionarchive.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "UVA Fashion Archive",
  description: "A digital glimpse into the University of Virginia's historic garments.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  await hydrateGarmentsFromCA();
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="alternate" type="application/rss+xml" title="UVA Fashion Archive - New Garments" href="/feed/garments" />
        <link rel="alternate" type="application/rss+xml" title="UVA Fashion Archive - Exhibitions" href="/feed/exhibitions" />
        <link rel="alternate" type="application/rss+xml" title="UVA Fashion Archive - Learn" href="/feed/learn" />
        <meta name="theme-color" content="#09090b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-zinc-950 text-zinc-100">
        <a href="#main-content" className="absolute -left-[9999px] top-4 z-[100] px-4 py-2 bg-zinc-800 text-zinc-100 rounded outline-none ring-2 ring-transparent focus:left-4 focus:top-4 focus:ring-zinc-500 focus:ring-2">
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
                  {children}
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
