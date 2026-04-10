"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import SearchBar from "./SearchBar";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/collection", label: "Collection" },
  { href: "/timeline", label: "Timeline" },
  { href: "/favorites", label: "Favorites" },
  { href: "/exhibitions", label: "Exhibitions" },
  { href: "/learn", label: "Learn" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll while menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Focus search bar when "/" is pressed (and no input is focused)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'header input[type="text"]'
        );
        searchInput?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname?.startsWith(path);
  };

  return (
    <header className="border-b border-archive-border sticky top-0 z-50 bg-[color-mix(in_oklch,var(--background)_92%,transparent)] backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Top row: Logo, Desktop Nav, and Mobile Toggle */}
        <div className="flex items-center justify-between mb-0 md:mb-4">
          <Link
            href="/"
            className="text-sm md:text-base tracking-[0.25em] uppercase font-light text-archive-fg hover:opacity-90 transition-opacity"
          >
            UVA Fashion Archive
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-6 lg:gap-8 text-xs md:text-sm uppercase tracking-[0.2em] font-light">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`transition-colors ${
                  isActive(href)
                    ? "text-archive-fg border-b border-archive-fg pb-1"
                    : "text-archive-fg/85 hover:text-archive-fg"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 -mr-2 text-archive-muted hover:text-archive-fg transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Desktop search bar */}
        <div className="hidden md:block max-w-2xl">
          <SearchBar variant="header" placeholder="Search garments… (press / to focus)" />
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-50 bg-[color-mix(in_oklch,var(--background)_96%,transparent)] backdrop-blur-md overflow-y-auto">
          <nav className="flex flex-col px-6 py-6 gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`py-3 text-base uppercase tracking-[0.2em] font-light border-b border-archive-border/60 transition-colors ${
                  isActive(href) ? "text-archive-fg" : "text-archive-muted hover:text-archive-fg/90"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile search bar */}
          <div className="px-6 pt-2 pb-8">
            <SearchBar variant="header" placeholder="Search garments… (press / to focus)" />
          </div>
        </div>
      )}
    </header>
  );
}
