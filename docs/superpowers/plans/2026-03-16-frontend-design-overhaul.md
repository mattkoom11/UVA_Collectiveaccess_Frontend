# Frontend Design Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the UVA Fashion Archive UI from generic zinc/Geist to a distinctive Dark Monochrome Museum aesthetic using DM Serif Display + Crimson Pro fonts, redesigned garment cards, an expanded footer, a Button component hierarchy, active filter chips, and shimmer skeleton loaders.

**Architecture:** Each component is modified in isolation — no shared state changes, no new pages. A new `components/ui/Button.tsx` is the only new file other than the plan/spec. Changes flow from global CSS → fonts → components.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, `next/font/google`, TypeScript 5

**Spec:** `docs/superpowers/specs/2026-03-16-frontend-design-overhaul-design.md`

---

## Chunk 1: Typography & Global CSS

### Task 1: Add Google Fonts to layout.tsx

**Files:**
- Modify: `uvafashion-frontend/app/layout.tsx`

- [ ] **Step 1: Add font imports at the top of layout.tsx**

  Open `uvafashion-frontend/app/layout.tsx`. Add these imports immediately after the existing `import type { Metadata }` line, before `import "./globals.css"`:

  ```tsx
  import { DM_Serif_Display, Crimson_Pro } from "next/font/google";

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
  ```

- [ ] **Step 2: Apply font variables to the html element**

  In the `RootLayout` return, change the `<html>` opening tag from:
  ```tsx
  <html lang="en">
  ```
  to:
  ```tsx
  <html lang="en" className={`${dmSerifDisplay.variable} ${crimsonPro.variable}`}>
  ```

- [ ] **Step 3: Update body className and skip-link**

  Change the `<body>` opening tag from:
  ```tsx
  <body className="bg-zinc-950 text-zinc-100">
  ```
  to:
  ```tsx
  <body className="bg-background text-foreground" style={{ fontFamily: "var(--font-body), Georgia, serif" }}>
  ```

  Then update the skip-link `<a>` tag immediately inside `<body>` — change its classes from `bg-zinc-800 text-zinc-100` to use the new palette:
  ```tsx
  <a href="#main-content" className="absolute -left-[9999px] top-4 z-[100] px-4 py-2 text-xs uppercase tracking-widest outline-none focus:left-4 focus:top-4 focus:ring-2" style={{ background: "#1e1e1e", color: "#f0ede8", fontFamily: "var(--font-display), Georgia, serif" }}>
    Skip to main content
  </a>
  ```

- [ ] **Step 4: Verify no TypeScript errors**

  Run: `cd uvafashion-frontend && npx tsc --noEmit 2>&1 | head -20`

  Expected: No errors (or only pre-existing unrelated errors)

- [ ] **Step 5: Commit**

  ```bash
  git add uvafashion-frontend/app/layout.tsx
  git commit -m "feat: add DM Serif Display and Crimson Pro fonts via next/font"
  ```

---

### Task 2: Update globals.css — CSS variables, theme mapping, shimmer, remove dark override

**Files:**
- Modify: `uvafashion-frontend/app/globals.css`

- [ ] **Step 1: Replace the :root block**

  Find and replace the existing `:root { ... }` block (lines 3–6, which currently sets `--background: #ffffff` and `--foreground: #171717`) with:

  ```css
  :root {
    --background: #0f0e0c;
    --foreground: #f0ede8;
    --accent: #e8e4de;
    --muted: #666;
    --muted-subtle: #888;
    --border: #1e1e1e;
    --border-hover: #3a3a3a;
  }
  ```

- [ ] **Step 2: Update the @theme inline block**

  Find and replace the existing `@theme inline { ... }` block (currently maps `--font-sans` to `--font-geist-sans` and `--font-mono` to `--font-geist-mono`) with:

  ```css
  @theme inline {
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    --font-sans: var(--font-body);
  }
  ```

  Note: Do NOT add `--font-display` here — it would create a circular self-reference (`--font-display: var(--font-display)`). The display font is consumed directly via `var(--font-display)` in inline `style` props throughout the components; no Tailwind utility class for it is needed.

- [ ] **Step 3: Remove the prefers-color-scheme dark media query**

  Delete the entire block:
  ```css
  @media (prefers-color-scheme: dark) {
    :root {
      --background: #0a0a0a;
      --foreground: #ededed;
    }
  }
  ```

- [ ] **Step 4: Update body font-family**

  Find the `body { ... }` rule. Change:
  ```css
  font-family: Arial, Helvetica, sans-serif;
  ```
  to:
  ```css
  font-family: var(--font-body), Georgia, "Times New Roman", serif;
  ```

- [ ] **Step 5: Add shimmer keyframe**

  After the existing `@keyframes fade-up { ... }` block, add:

  ```css
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .shimmer {
    background: linear-gradient(90deg, #141210 0%, #1e1c18 50%, #141210 100%);
    background-size: 200% 100%;
    animation: shimmer 1.8s infinite linear;
  }
  ```

- [ ] **Step 6: Update scrollbar track colors to match new palette**

  Change only the `background` values in these three rules — leave all other properties (e.g., `border-radius: 5px`) untouched:
  - `::-webkit-scrollbar-track`: change `background: #18181b` → `background: #0f0e0c`
  - `::-webkit-scrollbar-thumb`: change `background: #3f3f46` → `background: #2a2a2a` (keep `border-radius: 5px`)
  - `::-webkit-scrollbar-thumb:hover`: change `background: #52525b` → `background: #3a3a3a`

- [ ] **Step 7: Start dev server and visually verify the page loads with new background**

  Run: `cd uvafashion-frontend && npm run dev`

  Open `http://localhost:3000`. Expected: page background is deep charcoal (`#0f0e0c`), not white or zinc-950. Body text should use Crimson Pro (serif, not sans-serif). No console errors.

  Stop the dev server after verifying.

- [ ] **Step 8: Commit**

  ```bash
  git add uvafashion-frontend/app/globals.css
  git commit -m "feat: update CSS variables to dark monochrome palette, add shimmer keyframe"
  ```

---

## Chunk 2: Garment Card

### Task 3: Redesign GarmentCard.tsx

**Files:**
- Modify: `uvafashion-frontend/components/garments/GarmentCard.tsx`

The card currently renders: image (with `group-hover:scale-105`), work_type label, label, decade.

The redesign adds: era badge overlay inside image, color swatch strip below image, DM Serif Display type label, Crimson Pro italic subtitle with decade + optional collection, material pills, card-level lift hover (no image scale).

- [ ] **Step 1: Replace the full file content**

  Replace the entire content of `uvafashion-frontend/components/garments/GarmentCard.tsx` with:

  ```tsx
  "use client";

  import Link from "next/link";
  import Image from "next/image";
  import { useState } from "react";
  import { Garment } from "@/types/garment";

  interface Props {
    garment: Garment;
    variant?: "runway" | "grid";
  }

  function getImageSrc(garment: Garment): string | undefined {
    return garment.thumbnailUrl || garment.imageUrl || garment.images?.[0] || undefined;
  }

  function getEraBadgeText(garment: Garment): string | undefined {
    if (garment.era) return garment.era;
    if (garment.decade) return garment.decade;
    return undefined;
  }

  function getMaterials(garment: Garment): string[] {
    if (!garment.materials) return [];
    if (Array.isArray(garment.materials)) return garment.materials.slice(0, 3);
    return [garment.materials];
  }

  function getSubtitle(garment: Garment): string {
    const decade = garment.decade || garment.date;
    if (!decade) return garment.collection || "";
    if (garment.collection) return `circa ${decade} · ${garment.collection}`;
    return `circa ${decade}`;
  }

  export default function GarmentCard({ garment, variant = "grid" }: Props) {
    const base = variant === "runway" ? "w-52" : "w-full";
    const imageSrc = getImageSrc(garment);
    const [imgError, setImgError] = useState(false);
    const eraBadge = getEraBadgeText(garment);
    const materials = getMaterials(garment);
    const colors = garment.colors?.slice(0, 4) ?? [];
    const subtitle = getSubtitle(garment);

    return (
      <Link
        href={`/garments/${garment.slug}`}
        className={`${base} flex flex-col border transition-all duration-200`}
        style={{
          borderColor: "var(--border)",
          backgroundColor: "#0f0e0c",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }}
      >
        {/* Image container */}
        <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
          {imageSrc && !imgError ? (
            <Image
              src={imageSrc}
              alt={garment.editorial_title || garment.label}
              fill
              className="object-cover transition-transform duration-300"
              sizes={variant === "runway" ? "208px" : "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: "var(--muted)" }}>
              <span>No Image</span>
            </div>
          )}

          {/* Era badge overlay */}
          {eraBadge && (
            <div
              className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 text-[10px] uppercase tracking-widest"
              style={{
                fontFamily: "var(--font-display), Georgia, serif",
                color: "#f0ede8",
                background: "rgba(15,14,12,0.85)",
                borderLeft: "2px solid #e8e4de",
                letterSpacing: "0.15em",
              }}
            >
              {eraBadge}
            </div>
          )}
        </div>

        {/* Color swatch strip */}
        {colors.length > 0 && (
          <div className="flex h-1">
            {colors.map((color, i) => (
              <span key={i} className="flex-1" style={{ backgroundColor: color }} />
            ))}
          </div>
        )}

        {/* Card body */}
        <div className="p-3 space-y-1.5">
          {/* Type label */}
          <div
            className="text-[9px] uppercase"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              letterSpacing: "0.25em",
              color: "var(--muted)",
            }}
          >
            {garment.work_type || "Garment"}
          </div>

          {/* Title */}
          <div
            className="text-lg leading-tight"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              color: "#f0ede8",
            }}
          >
            {garment.label}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div
              className="text-sm italic"
              style={{
                fontFamily: "var(--font-body), Georgia, serif",
                color: "var(--muted)",
              }}
            >
              {subtitle}
            </div>
          )}

          {/* Material tags */}
          {materials.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {materials.map((mat, i) => (
                <span
                  key={i}
                  className="text-[11px] px-1.5 py-0.5"
                  style={{
                    fontFamily: "var(--font-body), Georgia, serif",
                    color: "var(--muted)",
                    border: "1px solid #252525",
                  }}
                >
                  {mat}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    );
  }
  ```

- [ ] **Step 2: Start dev server and navigate to /collection**

  Run: `cd uvafashion-frontend && npm run dev`

  Open `http://localhost:3000/collection`. Verify:
  - Cards render without crashing
  - Era badge appears top-left on cards that have `era` or `decade` data
  - Color strip appears below image (may not show if garments have no `colors` data)
  - Material tags appear (may not show if garments have no `materials` data)
  - Subtitle shows "circa {decade}" correctly
  - Hover lifts card slightly, no image scale
  - No TypeScript or console errors

  Stop the dev server.

- [ ] **Step 3: Commit**

  ```bash
  git add uvafashion-frontend/components/garments/GarmentCard.tsx
  git commit -m "feat: redesign GarmentCard with era badge, color swatches, material tags, and new typography"
  ```

---

## Chunk 3: Skeleton Card, Button Component, Footer

### Task 4: Redesign SkeletonCard.tsx with shimmer animation

**Files:**
- Modify: `uvafashion-frontend/components/garments/SkeletonCard.tsx`

- [ ] **Step 1: Replace the full file content**

  Replace the entire content of `uvafashion-frontend/components/garments/SkeletonCard.tsx` with:

  ```tsx
  export default function SkeletonCard() {
    return (
      <div
        className="flex flex-col border"
        style={{ borderColor: "var(--border)", backgroundColor: "#0f0e0c" }}
      >
        {/* Image area */}
        <div className="w-full aspect-[3/4] shimmer" />

        {/* Color swatch strip */}
        <div className="h-1 shimmer" />

        {/* Card body */}
        <div className="p-3 space-y-2">
          {/* Type label */}
          <div className="h-2 w-16 shimmer" />

          {/* Title */}
          <div className="h-5 w-3/4 shimmer" />

          {/* Subtitle */}
          <div className="h-3.5 w-1/2 shimmer" />

          {/* Material tags */}
          <div className="flex gap-1 pt-0.5">
            <div className="h-4 w-10 shimmer" />
            <div className="h-4 w-14 shimmer" />
            <div className="h-4 w-10 shimmer" />
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Verify shimmer class is defined in globals.css**

  The `.shimmer` class was added in Task 2 Step 5. Confirm it exists in `uvafashion-frontend/app/globals.css` by searching for `shimmer`.

- [ ] **Step 3: Commit**

  ```bash
  git add uvafashion-frontend/components/garments/SkeletonCard.tsx
  git commit -m "feat: replace pulse skeleton with shimmer animation matching new card structure"
  ```

---

### Task 5: Create Button component with primary / secondary / ghost variants

**Files:**
- Create: `uvafashion-frontend/components/ui/Button.tsx`

- [ ] **Step 1: Create the ui directory and Button component**

  Create `uvafashion-frontend/components/ui/Button.tsx` with this content:

  ```tsx
  import { ButtonHTMLAttributes, forwardRef } from "react";

  type Variant = "primary" | "secondary" | "ghost";

  interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
  }

  const styles: Record<Variant, React.CSSProperties> = {
    primary: {
      background: "#e8e4de",
      color: "#0a0908",
      fontFamily: "var(--font-display), Georgia, serif",
      fontSize: "10px",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      padding: "9px 20px",
      border: "none",
      cursor: "pointer",
      display: "inline-block",
      transition: "background 0.15s ease",
    },
    secondary: {
      background: "transparent",
      color: "#a0a0a0",
      fontFamily: "var(--font-display), Georgia, serif",
      fontSize: "10px",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      padding: "9px 20px",
      border: "1px solid #2a2a2a",
      cursor: "pointer",
      display: "inline-block",
      transition: "border-color 0.15s ease, color 0.15s ease",
    },
    ghost: {
      background: "transparent",
      color: "var(--muted)",
      fontFamily: "var(--font-body), Georgia, serif",
      fontSize: "13px",
      letterSpacing: "0.1em",
      padding: "6px 0",
      border: "none",
      borderBottom: "1px solid #2a2a2a",
      cursor: "pointer",
      display: "inline-block",
      transition: "color 0.15s ease",
    },
  };

  const hoverStyles: Record<Variant, React.CSSProperties> = {
    primary: { background: "#f0ede8" },
    secondary: { borderColor: "#3a3a3a", color: "#c0bdb8" },
    ghost: { color: "#a0a0a0" },
  };

  const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "secondary", style, onMouseEnter, onMouseLeave, ...props }, ref) => {
      const base = styles[variant];

      return (
        <button
          ref={ref}
          style={{ ...base, ...style }}
          onMouseEnter={(e) => {
            Object.assign((e.currentTarget as HTMLElement).style, hoverStyles[variant]);
            onMouseEnter?.(e);
          }}
          onMouseLeave={(e) => {
            Object.assign((e.currentTarget as HTMLElement).style, base);
            if (style) Object.assign((e.currentTarget as HTMLElement).style, style);
            onMouseLeave?.(e);
          }}
          {...props}
        />
      );
    }
  );

  Button.displayName = "Button";
  export default Button;
  ```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

  Run: `cd uvafashion-frontend && npx tsc --noEmit 2>&1 | head -20`

  Expected: No new errors introduced by the Button component.

- [ ] **Step 3: Commit**

  ```bash
  git add uvafashion-frontend/components/ui/Button.tsx
  git commit -m "feat: add Button component with primary/secondary/ghost variants"
  ```

---

### Task 6: Redesign SiteFooter.tsx — desktop 3-column, mobile unchanged

**Files:**
- Modify: `uvafashion-frontend/components/layout/SiteFooter.tsx`

- [ ] **Step 1: Replace the full file content**

  Replace the entire content of `uvafashion-frontend/components/layout/SiteFooter.tsx` with:

  ```tsx
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
  ```

- [ ] **Step 2: Start dev server and verify footer**

  Run: `cd uvafashion-frontend && npm run dev`

  At desktop width (`>= 768px`): verify 3-column grid appears with brand, Explore links, About links.
  At mobile width (`< 768px`): verify only the single bottom bar shows (brand name left, year right).
  Verify all Explore/About links are present and hover color works.

  Stop the dev server.

- [ ] **Step 3: Commit**

  ```bash
  git add uvafashion-frontend/components/layout/SiteFooter.tsx
  git commit -m "feat: expand footer to 3-column desktop layout with Explore and About nav links"
  ```

---

## Chunk 4: Active Filter Chip Strip

### Task 7: Add active filter chip strip to CollectionPage.tsx

**Files:**
- Modify: `uvafashion-frontend/components/garments/CollectionPage.tsx`

This task adds a new `<div>` chip strip that renders below the existing filter selects whenever one or more filters are active (i.e., not "all"). It does not touch the `<select>` elements themselves.

- [ ] **Step 1: Define the chip strip data structure**

  In `CollectionPage.tsx`, find the block of state declarations at the top of the component (around line 34–75). After the `currentPage` state declaration, add this helper derived value using `useMemo`:

  ```tsx
  // Active filter chips — derived from current filter state
  const activeFilterChips = useMemo(() => {
    const chips: { id: string; label: string; clear: () => void }[] = [];
    if (selectedEra !== "all") {
      chips.push({ id: "era", label: `Era: ${selectedEra}`, clear: () => setSelectedEra("all") });
    }
    if (selectedType !== "all") {
      chips.push({ id: "type", label: `Type: ${selectedType}`, clear: () => setSelectedType("all") });
    }
    if (selectedColor !== "all") {
      chips.push({ id: "color", label: `Color: ${selectedColor}`, clear: () => setSelectedColor("all") });
    }
    if (selectedMaterial !== "all") {
      chips.push({ id: "material", label: `Material: ${selectedMaterial}`, clear: () => setSelectedMaterial("all") });
    }
    return chips;
  }, [selectedEra, selectedType, selectedColor, selectedMaterial]);
  ```

  Add `useMemo` to the import line if it is not already imported (it is — check line 4: `import { useState, useMemo, useEffect } from "react";`).

- [ ] **Step 2: Add the chip strip JSX below the filter row**

  In the JSX, find the comment `{/* Filter and Sort Bar */}` (around line 329). Inside that `<div className="print-hide mb-12 space-y-4">`, locate the closing `</div>` of the main filters flex row — the one that contains all the `<select>` wrappers, view mode toggle, select mode button, saved searches button, etc. A reliable anchor: look for the `{/* Advanced Filters Panel */}` comment; the closing `</div>` of the main flex row appears immediately before it (the flex row closes before the advanced filters panel starts). Immediately after that closing `</div>`, add:

  ```tsx
  {/* Active filter chip strip */}
  {activeFilterChips.length > 0 && (
    <div className="flex flex-wrap gap-2 items-center pt-2">
      {activeFilterChips.map((chip) => (
        <button
          key={chip.id}
          onClick={chip.clear}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 transition-colors duration-150"
          style={{
            fontFamily: "var(--font-body), Georgia, serif",
            color: "#e8e4de",
            border: "1px solid #555",
            background: "#161512",
          }}
        >
          {chip.label}
          <span style={{ color: "#888", fontSize: "10px" }} aria-hidden>×</span>
        </button>
      ))}
      {activeFilterChips.length >= 2 && (
        <button
          onClick={() => {
            setSelectedEra("all");
            setSelectedType("all");
            setSelectedColor("all");
            setSelectedMaterial("all");
          }}
          className="text-xs transition-colors duration-150"
          style={{
            fontFamily: "var(--font-body), Georgia, serif",
            color: "var(--muted)",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid #2a2a2a",
            padding: "2px 0",
            cursor: "pointer",
          }}
        >
          Clear all
        </button>
      )}
    </div>
  )}
  ```

- [ ] **Step 3: Start dev server and test filter chips**

  Run: `cd uvafashion-frontend && npm run dev`

  Open `http://localhost:3000/collection`. Select an era from the Era dropdown. Verify:
  - A chip appears below the filter bar labeled "Era: {selectedEra}"
  - Clicking the chip `×` clears the era filter (chip disappears, dropdown resets to "All Eras")
  - Selecting two filters shows both chips and a "Clear all" link
  - Clicking "Clear all" removes all chips and resets all dropdowns
  - No console errors

  Stop the dev server.

- [ ] **Step 4: Commit**

  ```bash
  git add uvafashion-frontend/components/garments/CollectionPage.tsx
  git commit -m "feat: add active filter chip strip to collection page"
  ```

---

## Chunk 5: Final Verification

### Task 8: Full visual review and TypeScript check

**Files:** No changes — verification only

- [ ] **Step 1: Run TypeScript compiler check**

  Run: `cd uvafashion-frontend && npx tsc --noEmit 2>&1`

  Expected: Zero new errors. Any pre-existing errors that were present before this plan are acceptable — do not fix unrelated issues.

- [ ] **Step 2: Start dev server and walk through all changed surfaces**

  Run: `cd uvafashion-frontend && npm run dev`

  Check each surface:

  | Page / Component | What to verify |
  |---|---|
  | Any page (global) | Crimson Pro serif body font visible; DM Serif Display on headings/badges |
  | Any page (global) | Background is `#0f0e0c` (deep charcoal), not white or zinc-950 |
  | `/collection` | Cards show era badge, material tags, new hover lift (no image zoom) |
  | `/collection` (loading) | Skeleton cards show shimmer animation, not flat pulse |
  | `/collection` (filters active) | Chip strip appears below filter row; chips dismiss correctly |
  | Footer (desktop ≥768px) | 3-column grid: brand description + Explore links + About links |
  | Footer (mobile <768px) | Single bottom bar: brand name left, year right |
  | Footer links | Collection, Timeline, Exhibitions, Statistics, About, Contact, Credits, Accessibility all render |

- [ ] **Step 3: Check scrollbar styling**

  On any scrollable page, verify the scrollbar track matches the new dark palette (`#0f0e0c`) and thumb is `#2a2a2a`.

- [ ] **Step 4: Final commit if any last fixes were made**

  If any minor visual fixes were made during review:
  ```bash
  git add -p
  git commit -m "fix: visual polish after design overhaul review"
  ```

---

## Notes for Implementer

- **CSS variables vs Tailwind classes:** The new design uses inline `style` props for colors that reference CSS variables (e.g., `style={{ color: "var(--muted)" }}`). This is intentional — Tailwind v4 doesn't yet have utility classes wired to the new custom variables. Do not convert these to Tailwind classes.
- **Font family fallback:** Every `fontFamily` value in inline styles must include a fallback: `"var(--font-display), Georgia, serif"` or `"var(--font-body), Georgia, serif"`. This ensures the font renders even before the Google Font loads.
- **`selectedColor` and `selectedMaterial` state:** These exist in CollectionPage but may not have visible `<select>` elements in the visible filter bar (they may be in advanced filters). The chip strip still checks them — if they're never set, their chips just never appear.
- **High-contrast mode:** The `.high-contrast` CSS rules in `globals.css` reference zinc Tailwind classes that are no longer used in the redesigned components. These rules still function for any remaining zinc-class elements but won't apply to the new components. A follow-up accessibility compatibility pass is needed but is out of scope for this plan.
- **Button component adoption (intentional scope reduction):** The spec lists updating button usages in `CollectionPage.tsx`, `GarmentDetailView.tsx`, and `EmptyState.tsx` as in-scope. This plan intentionally defers that adoption to a follow-up — the Button component is created here but not wired into existing pages. The visual impact is minimal since those pages still render functional buttons; the new component is available at `@/components/ui/Button` for future use.
