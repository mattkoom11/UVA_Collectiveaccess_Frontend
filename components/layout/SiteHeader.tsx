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

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname?.startsWith(path);
  };

  return (
    <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Top row: Logo, Desktop Nav, and Mobile Toggle */}
        <div className="flex items-center justify-between mb-0 md:mb-4">
          <Link
            href="/"
            className="text-sm md:text-base tracking-[0.25em] uppercase font-light text-zinc-100 hover:text-zinc-50 transition-colors"
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
                    ? "text-zinc-50 border-b border-zinc-50 pb-1"
                    : "text-zinc-200 hover:text-zinc-50"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 -mr-2 text-zinc-300 hover:text-zinc-100 transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Desktop search bar */}
        <div className="hidden md:block max-w-2xl">
          <SearchBar variant="header" placeholder="Search by name, material, color, decade..." />
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-50 bg-zinc-950/98 backdrop-blur-md overflow-y-auto">
          <nav className="flex flex-col px-6 py-6 gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`py-3 text-base uppercase tracking-[0.2em] font-light border-b border-zinc-800/60 transition-colors ${
                  isActive(href) ? "text-zinc-50" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile search bar */}
          <div className="px-6 pt-2 pb-8">
            <SearchBar variant="header" placeholder="Search by name, material, color, decade..." />
          </div>
        </div>
      )}
    </header>
  );
}
