"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const mobileOpen = menuOpenOn !== null && menuOpenOn === pathname;
  const headerRef = useRef<HTMLElement>(null);

  // Publish the header's height (it differs between phone and desktop) so
  // full-screen views like the museum hall can fill exactly the space below.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const publish = () => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
    <header ref={headerRef} className="border-b border-archive-border sticky top-0 z-50 bg-[color-mix(in_oklch,var(--background)_92%,transparent)] backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* Top row: Logo, Desktop Nav, and Mobile Toggle */}
        <div className="flex items-center justify-between mb-0 md:mb-4">
          <Link
            href="/"
            className="font-serif text-base md:text-lg uppercase tracking-[0.14em] text-archive-fg hover:opacity-90 transition-opacity"
          >
            UVA Fashion Archive
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-6 lg:gap-8 text-xs uppercase tracking-[0.16em]">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`pb-1 border-b transition-colors ${
                  isActive(href)
                    ? "text-archive-fg border-archive-signal"
                    : "text-archive-muted border-transparent hover:text-archive-fg"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpenOn(mobileOpen ? null : pathname)}
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
        // The header's backdrop-blur makes it the containing block for fixed
        // children, so the drawer is anchored to the header instead of the viewport.
        <div className="md:hidden absolute top-full inset-x-0 h-[calc(100dvh-100%)] z-50 bg-archive-bg overflow-y-auto">
          <nav className="flex flex-col px-6 py-6 gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`py-3 pl-3 text-sm uppercase tracking-[0.16em] border-b border-archive-border/60 border-l-2 transition-colors ${
                  isActive(href)
                    ? "text-archive-fg border-l-archive-signal"
                    : "text-archive-muted border-l-transparent hover:text-archive-fg"
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
