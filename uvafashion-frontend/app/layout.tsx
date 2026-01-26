import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import KeyboardShortcutsProvider from "@/components/layout/KeyboardShortcutsProvider";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PWAInstallPrompt from "@/components/layout/PWAInstallPrompt";
import AccessibilityControls from "@/components/layout/AccessibilityControls";
import PWAScript from "@/components/layout/PWAScript";
import AnalyticsProvider from "@/components/layout/AnalyticsProvider";
import ErrorBoundary from "@/components/garments/ErrorBoundary";


export const metadata: Metadata = {
  title: "UVA Fashion Archive",
  description: "A digital glimpse into the University of Virginia's historic garments.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="alternate" type="application/rss+xml" title="UVA Fashion Archive - New Garments" href="/feed/garments" />
        <link rel="alternate" type="application/rss+xml" title="UVA Fashion Archive - Exhibitions" href="/feed/exhibitions" />
        <meta name="theme-color" content="#09090b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-zinc-950 text-zinc-100">
        <PWAScript />
        <ErrorBoundary>
          <AnalyticsProvider>
            <KeyboardShortcutsProvider>
              <div className="min-h-screen flex flex-col">
                <SiteHeader />
                <Breadcrumbs />
                <main className="flex-1">
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
