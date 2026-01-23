import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import KeyboardShortcutsProvider from "@/components/layout/KeyboardShortcutsProvider";
import Breadcrumbs from "@/components/layout/Breadcrumbs";


export const metadata: Metadata = {
  title: "UVA Fashion Archive",
  description: "A digital glimpse into the University of Virginia's historic garments.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100">
        <KeyboardShortcutsProvider>
          <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <Breadcrumbs />
            <main className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </KeyboardShortcutsProvider>
      </body>
    </html>
  );
}
