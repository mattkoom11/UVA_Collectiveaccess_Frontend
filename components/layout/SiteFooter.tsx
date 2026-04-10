"use client";

import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-archive-border mt-8 bg-archive-footer"
    >
      <div className="max-w-6xl mx-auto px-4">

        {/* Desktop 3-column grid — hidden on mobile */}
        <div
          className="hidden md:grid py-10 gap-10 border-b border-archive-border"
          style={{ gridTemplateColumns: "2fr 1fr 1fr" }}
        >
          {/* Brand column */}
          <div>
            <div
              className="mb-2 uppercase tracking-widest text-base text-archive-fg"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                letterSpacing: "0.15em",
              }}
            >
              The Archive
            </div>
            <p
              className="text-sm italic leading-[1.7] text-archive-muted"
              style={{ fontFamily: "var(--font-body), Georgia, serif" }}
            >
              A curated collection of historic garments from the University of Virginia.
            </p>
          </div>

          {/* Explore column */}
          <nav aria-label="Explore">
            <h4
              className="mb-2.5 uppercase text-archive-muted"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "11px",
                letterSpacing: "0.2em",
              }}
            >
              Explore
            </h4>
            {[
              { href: "/collection", label: "Collection" },
              { href: "/timeline", label: "Timeline" },
              { href: "/exhibitions", label: "Exhibitions" },
              { href: "/statistics", label: "Statistics" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block text-xs leading-loose text-archive-muted/80 hover:text-archive-muted transition-colors duration-200"
                style={{ fontFamily: "var(--font-body), Georgia, serif" }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* About column */}
          <nav aria-label="About">
            <h4
              className="mb-2.5 uppercase text-archive-muted"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "11px",
                letterSpacing: "0.2em",
              }}
            >
              About
            </h4>
            {[
              { href: "/learn", label: "About" },
              { href: "/learn#contact", label: "Contact" },
              { href: "/learn#credits", label: "Credits" },
              { href: "#", label: "Accessibility" },
            ].map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className="block text-xs leading-loose text-archive-muted/80 hover:text-archive-muted transition-colors duration-200"
                style={{ fontFamily: "var(--font-body), Georgia, serif" }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom bar — visible on all breakpoints */}
        <div className="py-6 flex justify-between gap-4 text-xs text-archive-muted/80">
          <span style={{ fontFamily: "var(--font-body), Georgia, serif" }}>
            UVA Historic Clothing Collection
          </span>
          <span style={{ fontFamily: "var(--font-body), Georgia, serif" }}>
            © {year} University of Virginia
          </span>
        </div>

      </div>
    </footer>
  );
}
