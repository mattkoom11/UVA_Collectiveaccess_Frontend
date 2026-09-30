"use client";

import Link from "next/link";

const EXPLORE_LINKS = [
  { href: "/collection", label: "Collection" },
  { href: "/timeline", label: "Timeline" },
  { href: "/exhibitions", label: "Exhibitions" },
  { href: "/statistics", label: "Statistics" },
];

const ABOUT_LINKS = [
  { href: "/learn", label: "About" },
  { href: "/learn#contact", label: "Contact" },
  { href: "/learn#credits", label: "Credits" },
  { href: "#", label: "Accessibility" },
];

function FooterLinks({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <h4 className="eyebrow mb-3">{title}</h4>
      {links.map(({ href, label }) => (
        <Link
          key={label}
          href={href}
          className="block text-sm leading-loose text-archive-muted hover:text-archive-fg transition-colors duration-200"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-archive-border mt-8 bg-archive-footer">
      <div className="max-w-6xl mx-auto px-4">

        {/* Desktop 3-column grid — hidden on mobile */}
        <div
          className="hidden md:grid py-10 gap-10 border-b border-archive-border"
          style={{ gridTemplateColumns: "2fr 1fr 1fr" }}
        >
          <div>
            <div className="font-serif mb-2 uppercase text-lg tracking-[0.14em] text-archive-fg">
              The Archive
            </div>
            <p className="text-sm leading-[1.7] text-archive-muted max-w-sm">
              A curated collection of historic garments from the University of Virginia.
            </p>
          </div>

          <FooterLinks title="Explore" links={EXPLORE_LINKS} />
          <FooterLinks title="About" links={ABOUT_LINKS} />
        </div>

        {/* Bottom bar — visible on all breakpoints */}
        <div className="py-6 flex justify-between gap-4 font-mono text-[11px] tracking-[0.08em] text-archive-muted">
          <span>UVA Historic Clothing Collection</span>
          <span>© {year} University of Virginia</span>
        </div>

      </div>
    </footer>
  );
}
