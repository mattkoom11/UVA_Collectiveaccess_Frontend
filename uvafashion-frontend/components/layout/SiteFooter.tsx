import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t mt-8"
      style={{ borderColor: "var(--border)", backgroundColor: "#080807" }}
    >
      <div className="max-w-6xl mx-auto px-4">

        {/* Desktop 3-column grid — hidden on mobile */}
        <div
          className="hidden md:grid py-10 gap-10"
          style={{
            gridTemplateColumns: "2fr 1fr 1fr",
            borderBottom: "1px solid #151515",
          }}
        >
          {/* Brand column */}
          <div>
            <div
              className="mb-2 uppercase tracking-widest text-base"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                letterSpacing: "0.15em",
                color: "#f0ede8",
              }}
            >
              The Archive
            </div>
            <p
              className="text-sm italic leading-relaxed"
              style={{
                fontFamily: "var(--font-body), Georgia, serif",
                color: "var(--muted)",
              }}
            >
              A curated collection of historic garments from the University of Virginia.
            </p>
          </div>

          {/* Explore column */}
          <div>
            <h4
              className="mb-2.5 uppercase"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "11px",
                letterSpacing: "0.2em",
                color: "var(--muted)",
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
                className="block text-xs leading-loose transition-colors duration-150"
                style={{ fontFamily: "var(--font-body), Georgia, serif", color: "#444" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#888")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#444")}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* About column */}
          <div>
            <h4
              className="mb-2.5 uppercase"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                fontSize: "11px",
                letterSpacing: "0.2em",
                color: "var(--muted)",
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
                className="block text-xs leading-loose transition-colors duration-150"
                style={{ fontFamily: "var(--font-body), Georgia, serif", color: "#444" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#888")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#444")}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar — visible on all breakpoints */}
        <div className="py-6 flex justify-between gap-4 text-xs" style={{ color: "#444" }}>
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
