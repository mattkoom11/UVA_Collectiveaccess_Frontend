# Frontend Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade every research-facing page with information-dense layouts, token consistency, micro-interactions, and a quick-lookup search experience while preserving the editorial quality of the front-door pages.

**Architecture:** Pure UI layer — no new routes, no API changes, no new dependencies. A new `FadeIn` client component provides page transitions. `GarmentCard` gains a `variant="research"` prop. `CollectionPage` gets a persistent desktop sidebar. `GarmentDetailClient` gets a two-column sticky layout. `SearchPage` becomes a compact list-lookup tool. All changes use existing `archive-*` Tailwind tokens; hardcoded `zinc-*` classes are replaced as we touch each file.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript 5, lucide-react. No new npm packages.

**Spec:** `docs/superpowers/specs/2026-04-10-frontend-improvements-design.md`

---

## Chunk 1: Foundation — keyframe, FadeIn, GarmentCard research variant

### Task 1: Add `fadein` keyframe to globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add the keyframe** — open `app/globals.css` and append the following after the `.scrollbar-hide` block (around line 77):

```css
@keyframes fadein {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 2: Verify lint passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: add fadein keyframe to globals.css"
```

---

### Task 2: Create FadeIn wrapper component

**Files:**
- Create: `components/layout/FadeIn.tsx`

- [ ] **Step 1: Create the file**

```tsx
// components/layout/FadeIn.tsx
"use client";

import { ReactNode } from "react";

export default function FadeIn({ children }: { children: ReactNode }) {
  return (
    <div className="animate-[fadein_120ms_ease-out]">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Apply FadeIn in root layout** — in `app/layout.tsx`, import `FadeIn` and wrap `{children}` inside `<main>`:

```tsx
// app/layout.tsx — add import at top with other layout imports
import FadeIn from "@/components/layout/FadeIn";

// then change the <main> element (line 71) from:
<main id="main-content" className="flex-1">
  {children}
</main>

// to:
<main id="main-content" className="flex-1">
  <FadeIn>{children}</FadeIn>
</main>
```

- [ ] **Step 3: Verify**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/layout/FadeIn.tsx app/layout.tsx
git commit -m "feat: add FadeIn page transition wrapper (120ms fadein keyframe)"
```

---

### Task 3: Add `variant="research"` to GarmentCard

**Files:**
- Modify: `components/garments/GarmentCard.tsx`

The research variant makes the card information-dense: tighter padding, accession number under title in monospace, higher-contrast era badge, material tags capped at 2 with `+N more` overflow.

- [ ] **Step 1: Extend the Props type** — change line 8–11:

```tsx
// Before:
interface Props {
  garment: Garment;
  variant?: "runway" | "grid";
}

// After:
interface Props {
  garment: Garment;
  variant?: "runway" | "grid" | "research";
}
```

- [ ] **Step 2: Update era badge for research variant** — the era badge is rendered around line 77. Update it so research gets higher contrast (`bg-black/70 text-white`):

```tsx
{/* Era label */}
{eraBadge && (
  <div
    className={`absolute top-2.5 left-2.5 z-10 rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-widest ${
      variant === "research"
        ? "bg-black/70 text-white ring-1 ring-inset ring-white/20"
        : "ring-1 ring-inset ring-archive-accent/35 bg-[color-mix(in_oklch,var(--background)_78%,transparent)] text-archive-fg"
    }`}
    style={{ fontFamily: "var(--font-display), Georgia, serif", letterSpacing: "0.15em" }}
  >
    {eraBadge}
  </div>
)}
```

- [ ] **Step 3: Update card body padding and content for research variant** — replace the **entire** card body block from line 97 (`<div className="p-3 space-y-1.5">`) through line 154 (`</Link>`) with the variant-aware version below. This replaces the existing "Type + accession row" div (lines 99–114) and all subsequent content in one replacement — do not leave the old type+accession row in place:

```tsx
{/* Card body */}
<div className={`${variant === "research" ? "p-2.5" : "p-3"} space-y-1.5`}>
  {/* Type row */}
  <div
    className="text-[9px] uppercase text-archive-muted"
    style={{
      fontFamily: "var(--font-display), Georgia, serif",
      letterSpacing: "0.25em",
    }}
  >
    {garment.work_type || "Garment"}
  </div>

  {/* Title */}
  <div
    className="text-lg leading-tight text-archive-fg"
    style={{ fontFamily: "var(--font-display), Georgia, serif" }}
  >
    {garment.label}
  </div>

  {/* Accession number — research variant only */}
  {variant === "research" && garment.accessionNumber && (
    <div className="font-mono text-[10px] text-archive-muted">
      {garment.accessionNumber}
    </div>
  )}

  {/* Subtitle — non-research only */}
  {variant !== "research" && subtitle && (
    <div
      className="text-sm italic text-archive-muted leading-relaxed"
      style={{ fontFamily: "var(--font-body), Georgia, serif" }}
    >
      {subtitle}
    </div>
  )}

  {/* Material tags */}
  {materials.length > 0 && (
    <div className="flex flex-wrap gap-1 pt-0.5">
      {(variant === "research" ? materials.slice(0, 2) : materials).map((mat, i) => (
        <span
          key={i}
          className="text-[11px] px-1.5 py-0.5 border border-archive-border text-archive-muted"
          style={{ fontFamily: "var(--font-body), Georgia, serif" }}
        >
          {mat}
        </span>
      ))}
      {variant === "research" && materials.length > 2 && (
        <span
          className="text-[11px] px-1.5 py-0.5 border border-archive-border text-archive-muted"
          style={{ fontFamily: "var(--font-body), Georgia, serif" }}
        >
          +{materials.length - 2} more
        </span>
      )}
    </div>
  )}
</div>
```

- [ ] **Step 4: Verify**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/garments/GarmentCard.tsx
git commit -m "feat: add variant=research to GarmentCard (dense layout, accession, overflow tags)"
```

---

## Chunk 2: Home & About Pages

### Task 4: HomePage — dual CTA + descriptive stat labels

**Files:**
- Modify: `components/home/HomePage.tsx`

- [ ] **Step 1: Replace single CTA with dual CTA** — in the hero section around line 38–45, replace:

```tsx
<div className="flex items-center justify-center gap-4 pt-2">
  <Link
    href="/collection"
    className="px-6 py-3 text-sm uppercase tracking-[0.15em] font-light border border-archive-border-hover text-archive-fg/90 hover:bg-archive-surface transition-colors duration-200 ease-out"
  >
    Browse Collection
  </Link>
</div>
```

with:

```tsx
<div className="flex items-center justify-center gap-6 pt-2 flex-wrap">
  <Link
    href="/collection"
    className="px-6 py-3 text-sm uppercase tracking-[0.15em] font-light border border-archive-border-hover text-archive-fg/90 hover:bg-archive-surface transition-colors duration-200 ease-out"
  >
    Browse Collection
  </Link>
  <Link
    href="/search"
    className="text-sm text-archive-muted hover:text-archive-fg transition-colors duration-200 ease-out"
  >
    Search by accession →
  </Link>
</div>
```

- [ ] **Step 2: Update stat strip labels** — around lines 61, 70, 79, change the three label strings:

```tsx
// Line ~61: change "Garments" to:
<div className="text-xs uppercase tracking-[0.2em] text-archive-muted">Garments Catalogued</div>

// Line ~70: change "Types" to:
<div className="text-xs uppercase tracking-[0.2em] text-archive-muted">Garment Types</div>

// Line ~79: change "Eras" to:
<div className="text-xs uppercase tracking-[0.2em] text-archive-muted">Eras Represented</div>
```

- [ ] **Step 3: Verify**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add components/home/HomePage.tsx
git commit -m "feat: HomePage dual CTA and descriptive stat labels"
```

---

### Task 5: HomePage — horizontal recent additions strip

**Files:**
- Modify: `components/home/HomePage.tsx`

The current "From the Archive" section renders `recent.slice(0, 6)` in a grid. Replace it with a horizontal scroll strip of 8 compact cards.

- [ ] **Step 1: Remove `recent` variable and replace the "Recent Garments" section** — delete line 22 (`const recent = garments.slice(0, 6);`) entirely. Then replace the entire "Recent Garments" section (the `{recent.length > 0 && ( ... )}` block, lines ~87–137, including its opening guard) with the new strip below. Note the guard changes from `recent.length > 0` to `garments.length > 0`:

```tsx
{/* Recent Additions Strip */}
{garments.length > 0 && (
  <section className="border-b border-archive-border py-12 md:py-16">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-light text-archive-fg/90 uppercase tracking-[0.2em]">
          Recently Added to the Archive
        </h2>
        <Link
          href="/collection?sort=date-desc"
          className="text-sm text-archive-muted hover:text-archive-fg transition-colors duration-200 flex items-center gap-2"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {garments.slice(0, 8).map((garment) => (
          <Link
            key={garment.id}
            href={`/garments/${garment.slug}`}
            className="flex-none group border border-archive-border hover:border-archive-border-hover transition-colors duration-150"
          >
            <div className="relative w-36 h-48 bg-archive-surface overflow-hidden">
              {(garment.thumbnailUrl || garment.imageUrl || garment.images?.[0]) ? (
                <img
                  src={garment.thumbnailUrl || garment.imageUrl || garment.images![0]}
                  alt={garment.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-archive-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-2 w-36">
              <div
                className="text-sm leading-tight text-archive-fg truncate"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}
              >
                {garment.label}
              </div>
              {garment.accessionNumber && (
                <div className="font-mono text-[10px] text-archive-muted mt-0.5 truncate">
                  {garment.accessionNumber}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
)}
```

- [ ] **Step 2: Verify `recent` is gone** — confirm no remaining references to `recent` exist in the file (the variable was removed in step 1).

- [ ] **Step 3: Verify**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add components/home/HomePage.tsx
git commit -m "feat: HomePage horizontal recent additions strip (8 compact cards)"
```

---

### Task 6: About page — ornament dividers + contact aside

**Files:**
- Modify: `app/about/page.tsx`

- [ ] **Step 1: Replace the four `border-t` section openers** — there are four `<section>` elements with `border-t border-archive-border` (lines 40, 61, 86, 105). Three of them get ornament dividers inserted before them; the fourth (the contact section at line 105) is converted to an `<aside>` in Step 2. The pattern: remove `border-t border-archive-border pt-8 md:pt-12` from each section's className, and insert the ornament divider JSX *before* the section in the JSX tree.

Update all four sections so that:
- "The UVA Fashion Project" section keeps `className="space-y-4"` (no border needed — it's first)
- Before "The Historic Clothing Collection" section (line 40), insert the divider
- Before "Photogrammetry and 3D Capture" section (line 61), insert the divider
- Before "Looking Forward" section (line 86), insert the divider
- The contact section at line 105 is handled entirely in Step 2 (do not add a divider before it here)

Ornament divider JSX (use this between every section pair):

```tsx
<div className="flex items-center justify-center gap-3 py-10 md:py-14">
  <div className="h-px w-12 bg-archive-border" />
  <div className="w-1 h-1 rounded-full bg-archive-border" />
  <div className="h-px w-12 bg-archive-border" />
</div>
```

- [ ] **Step 2: Promote contact section to a styled aside** — replace the last `<section>` (lines 105–113):

```tsx
// Before:
<section className="border-t border-archive-border pt-8 md:pt-12 mt-12">
  <div className="text-sm text-archive-muted font-light space-y-2 leading-[1.7]">
    <p>
      For more information about the UVA Historic Clothing Collection, please contact the collection
      curators through the University of Virginia&apos;s special collections department.
    </p>
  </div>
</section>

// After (insert ornament divider before it, then):
<aside className="bg-archive-surface border border-archive-border px-6 py-5">
  <p className="text-xs uppercase tracking-[0.2em] text-archive-muted mb-3">Get in Touch</p>
  <p className="text-sm text-archive-muted font-light leading-[1.7]">
    For more information about the UVA Historic Clothing Collection, please contact the collection
    curators through the University of Virginia&apos;s special collections department.
  </p>
</aside>
```

- [ ] **Step 3: Verify**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add app/about/page.tsx
git commit -m "feat: About page ornament dividers and contact aside"
```

---

## Chunk 3: Collection Page — Sidebar + Grid Density + Chip Strip

### Task 7: Persistent filter sidebar (desktop ≥1024px)

**Files:**
- Modify: `components/garments/CollectionPage.tsx`

The current page is a single-column layout with a centered filter bar above the grid. For desktop, restructure to a two-column flex: `w-56 shrink-0` sidebar on the left, `flex-1 min-w-0` main area on the right. The existing mobile filter bar stays intact and is hidden at `lg:`.

- [ ] **Step 1: Wrap the grid area in a two-column layout** — in the return JSX, the `<div className="max-w-7xl mx-auto px-4 py-12 md:py-20">` wraps everything. After the search bar block and before the existing filter/sort bar, add the two-column wrapper. Restructure the JSX so the layout below the search bar becomes:

```tsx
{/* Two-column layout: sidebar (lg+) + main */}
<div className="flex gap-8 items-start">
  {/* Desktop filter sidebar — hidden below lg */}
  <aside className="hidden lg:flex flex-col gap-5 w-56 shrink-0 pt-2">
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-archive-muted mb-3">Filters</p>
      {activeFilterChips.length > 0 && (
        <button
          onClick={() => {
            setSelectedEra("all");
            setSelectedType("all");
            setSelectedColor("all");
            setSelectedMaterial("all");
            setDateRange({});
          }}
          className="text-xs text-archive-muted hover:text-archive-fg transition-colors mb-4 underline underline-offset-2"
        >
          Clear all
        </button>
      )}
    </div>

    {/* Era — radio group */}
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-archive-muted mb-2">Era</p>
      {(["all", "pre-1920", "1920-1950", "1950-1980", "1980+"] as const).map((era) => (
        <label key={era} className="flex items-center gap-2 py-1 cursor-pointer group">
          <input
            type="radio"
            name="sidebar-era"
            value={era}
            checked={selectedEra === era}
            onChange={() => setSelectedEra(era as Era | "all")}
            className="accent-archive-fg"
          />
          <span className="text-xs text-archive-muted group-hover:text-archive-fg transition-colors capitalize">
            {era === "all" ? "All eras" : era}
          </span>
        </label>
      ))}
    </div>

    {/* Type — checkbox list */}
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-archive-muted mb-2">Type</p>
      <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-hide">
        {(["dress","coat","jacket","suit","shirt-blouse","skirt","pants-trousers","outerwear","undergarment","headwear","footwear","accessory","jewelry","ensemble","swimwear","uniform","non-western","textile","other"] as const).map((t) => (
          <label key={t} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedType === t}
              onChange={() => setSelectedType(selectedType === t ? "all" : t as GarmentType)}
              className="accent-archive-fg"
            />
            <span className="text-xs text-archive-muted group-hover:text-archive-fg transition-colors capitalize">
              {t.replace("-", " ")}
            </span>
          </label>
        ))}
      </div>
    </div>

    {/* Color — checkbox list */}
    {availableColors.length > 0 && (
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-archive-muted mb-2">Color</p>
        <div className="max-h-36 overflow-y-auto space-y-1 scrollbar-hide">
          {availableColors.map((color) => (
            <label key={color} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedColor === color}
                onChange={() => setSelectedColor(selectedColor === color ? "all" : color)}
                className="accent-archive-fg"
              />
              <span className="text-xs text-archive-muted group-hover:text-archive-fg transition-colors capitalize">
                {color}
              </span>
            </label>
          ))}
        </div>
      </div>
    )}

    {/* Material — checkbox list */}
    {availableMaterials.length > 0 && (
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-archive-muted mb-2">Material</p>
        <div className="max-h-36 overflow-y-auto space-y-1 scrollbar-hide">
          {availableMaterials.map((material) => (
            <label key={material} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedMaterial === material}
                onChange={() => setSelectedMaterial(selectedMaterial === material ? "all" : material)}
                className="accent-archive-fg"
              />
              <span className="text-xs text-archive-muted group-hover:text-archive-fg transition-colors capitalize">
                {material}
              </span>
            </label>
          ))}
        </div>
      </div>
    )}

    {/* Date Range */}
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-archive-muted mb-2">Date Range</p>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="From"
          value={dateRange.start || ""}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value ? parseInt(e.target.value, 10) : undefined })}
          className="w-full bg-archive-surface border border-archive-border px-2 py-1.5 text-xs text-archive-fg focus:outline-none focus:border-archive-border-hover"
          min="1800" max="2100"
        />
        <input
          type="number"
          placeholder="To"
          value={dateRange.end || ""}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value ? parseInt(e.target.value, 10) : undefined })}
          className="w-full bg-archive-surface border border-archive-border px-2 py-1.5 text-xs text-archive-fg focus:outline-none focus:border-archive-border-hover"
          min="1800" max="2100"
        />
      </div>
    </div>

    {/* Decade — add new state: const [selectedDecade, setSelectedDecade] = useState<string>("all"); */}
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-archive-muted mb-2">Decade</p>
      <select
        value={selectedDecade}
        onChange={(e) => setSelectedDecade(e.target.value)}
        className="w-full bg-archive-surface border border-archive-border px-2 py-1.5 text-xs text-archive-fg focus:outline-none focus:border-archive-border-hover"
      >
        <option value="all">All decades</option>
        {["1900s","1910s","1920s","1930s","1940s","1950s","1960s","1970s","1980s","1990s","2000s"].map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
  </aside>

  {/* Main content area — contains everything that was previously below the search bar */}
  <div className="flex-1 min-w-0">
    {/*
      Move the following existing blocks inside this div, in order:
      1. The mobile filter bar: <div className="print-hide mb-12 space-y-4"> — add "lg:hidden" to its className
      2. The sort/view controls row (grid/list toggle + sort dropdown)
      3. The active filter chip strip (already there — will be made sticky in Task 8)
      4. The bulk action bar
      5. The garment grid / list / empty state
      6. The pagination controls
    */}
  </div>
</div>
```

To implement this step: wrap the existing content that comes after the search bar (`<div className="print-hide mb-12 space-y-4">` through the pagination block) in a `<div className="flex-1 min-w-0">`. Then add `lg:hidden` to the existing filter bar div so it only shows on mobile. The sidebar handles filtering on desktop.

**`selectedDecade` wiring:** Add `const [selectedDecade, setSelectedDecade] = useState<string>("all");` alongside the other filter states at the top of the component. Add `if (selectedDecade !== "all") params.set("decade", selectedDecade);` to the URL params `useEffect`. Add a filter clause in `filteredGarments`:

```tsx
// After the dateRange filter block:
if (selectedDecade !== "all") {
  results = results.filter(g => {
    const dec = g.decade ? String(g.decade) : undefined;
    return dec === selectedDecade || dec === selectedDecade.replace("s", "");
  });
}
```

Also include `selectedDecade` in the `filteredGarments` useMemo dependency array, and add `setSelectedDecade("all")` to all "Clear all" buttons (sidebar, chip strip).

**`textile` type note:** The sidebar type checkbox list includes `"textile"`. Verify that `"textile"` is in the `GarmentType` union in `types/garment.ts` before using it in the `setSelectedType` call. If it is not, use `selectedType === t ? "all" : (t as GarmentType)` and TypeScript will flag it — simply remove `"textile"` from the list if it causes a type error.

- [ ] **Step 2: Verify**

```bash
npm run lint
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add components/garments/CollectionPage.tsx
git commit -m "feat: Collection page persistent filter sidebar (desktop lg+)"
```

---

### Task 8: Grid density + sticky chip strip

**Files:**
- Modify: `components/garments/CollectionPage.tsx`

- [ ] **Step 1: Change PAGE_SIZE to 36** — line 24:

```tsx
// Before:
const PAGE_SIZE = 24;

// After:
const PAGE_SIZE = 36;
```

- [ ] **Step 2: Update grid from 3 to 4 columns at lg** — around line 909 and 919–920:

```tsx
// In both the skeleton grid and the results grid, change:
// "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10"
// to:
"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6"
```

- [ ] **Step 3: Use GarmentCard with variant="research"** — currently, the grid renders raw divs with `GarmentImage` inside. Replace each garment div in the grid view with `<GarmentCard garment={garment} variant="research" />` and ensure `GarmentCard` is imported. Keep the select mode overlay and FavoriteButton as before by wrapping the card in a `div className="relative"`:

```tsx
import GarmentCard from "./GarmentCard";

// In the grid rendering (around line 923):
{paginatedGarments.map((garment) => (
  <div key={garment.id} className="relative group">
    {selectMode && (
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(garment.id); }}
        className="print-hide absolute top-2 left-2 z-20 flex items-center justify-center w-7 h-7 border border-archive-border bg-archive-bg/90 hover:border-archive-border-hover transition-colors"
        aria-label={selectedIds.includes(garment.id) ? "Deselect" : "Select"}
      >
        {selectedIds.includes(garment.id)
          ? <CheckSquare className="w-4 h-4 text-archive-fg" />
          : <Square className="w-4 h-4 text-archive-muted" />}
      </button>
    )}
    <FavoriteButton garmentId={garment.id} className="print-hide absolute top-2 right-2 z-20" />
    <GarmentCard garment={garment} variant="research" />
  </div>
))}
```

- [ ] **Step 4: Extend `activeFilterChips` to include `dateRange` entries** — the existing `activeFilterChips` useMemo (around line 85) only covers era, type, color, and material. Add dateRange chips so the strip reflects those filters too:

```tsx
// In the activeFilterChips useMemo, add after the existing chips:
if (dateRange.start !== undefined) {
  chips.push({ id: "dateStart", label: `From: ${dateRange.start}`, clear: () => setDateRange({ ...dateRange, start: undefined }) });
}
if (dateRange.end !== undefined) {
  chips.push({ id: "dateEnd", label: `To: ${dateRange.end}`, clear: () => setDateRange({ ...dateRange, end: undefined }) });
}
```

Also extend the "Clear all" button in the chip strip (and the Clear all in the sidebar) to also call `setSelectedDecade("all")` if that state was added.

- [ ] **Step 5: Make chip strip sticky with `--header-h`** — add a `useEffect` at the top of the component (with other `useEffect`s) that measures the header height and sets a CSS variable:

```tsx
useEffect(() => {
  const header = document.querySelector("header");
  if (!header) return;
  const update = () => {
    document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`);
  };
  update();
  window.addEventListener("resize", update);
  return () => window.removeEventListener("resize", update);
}, []);
```

Then find the active filter chip strip div (around line 634) and make it sticky:

```tsx
// Wrap the chip strip in a sticky bar above the grid
{activeFilterChips.length > 0 && (
  <div
    className="sticky z-20 -mx-4 px-4 py-2 bg-archive-bg border-b border-archive-border flex flex-wrap gap-2 items-center"
    style={{ top: "var(--header-h, 73px)" }}
  >
    {activeFilterChips.map((chip) => (
      <button
        key={chip.id}
        onClick={chip.clear}
        aria-label={`Remove filter: ${chip.label}`}
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border border-archive-border text-archive-fg bg-archive-bg hover:border-archive-border-hover transition-colors duration-150"
      >
        {chip.label}
        <X className="w-3 h-3 text-archive-muted" aria-hidden />
      </button>
    ))}
    <span className="ml-auto text-xs text-archive-muted">
      {filteredGarments.length} result{filteredGarments.length !== 1 ? "s" : ""}
    </span>
    {activeFilterChips.length >= 2 && (
      <button
        onClick={() => {
          setSelectedEra("all");
          setSelectedType("all");
          setSelectedColor("all");
          setSelectedMaterial("all");
          setDateRange({});
        }}
        className="text-xs text-archive-muted hover:text-archive-fg transition-colors border-l border-archive-border pl-2 ml-1"
      >
        Clear all
      </button>
    )}
  </div>
)}
```

- [ ] **Step 6: Add list view accession column** — the list view currently renders a flex row with image + title info. Add the accession number as a right-aligned monospace column. Find the list view row rendering (where `viewMode === "list"` is used) and update the row to include:

```tsx
{/* Accession — list view only */}
{viewMode === "list" && garment.accessionNumber && (
  <div className="hidden md:block font-mono text-xs text-archive-muted shrink-0 w-32 text-right">
    {garment.accessionNumber}
  </div>
)}
```

- [ ] **Step 7: Verify**

```bash
npm run lint
```

- [ ] **Step 8: Commit**

```bash
git add components/garments/CollectionPage.tsx
git commit -m "feat: Collection 36/page, 4-col grid, research cards, sticky chip strip, list accession col"
```

---

## Chunk 4: Garment Detail — Two-Column Layout + Metadata dl + 3D Tab

### Task 9: Two-column layout + sticky metadata panel

**Files:**
- Modify: `components/garments/GarmentDetailClient.tsx`

The current detail page has a large editorial hero at the top (full-width hero section with massive typography) followed by vertical content. Per the spec, the two-column layout (55/45, left=images, right=metadata) replaces the hero + vertical layout for the research view.

The hero section remains but is restructured: at `lg:`, the editorial title/subtitle/hero imagery goes in the left column and the metadata panel goes in the right column (sticky).

- [ ] **Step 1: Replace `<div className="min-h-screen bg-zinc-950 text-zinc-50">` wrapper** — the outer wrapper uses hardcoded zinc colors. Replace with archive tokens:

```tsx
// Before (line 62):
<div className="min-h-screen bg-zinc-950 text-zinc-50">

// After:
<div className="min-h-screen bg-archive-bg text-archive-fg">
```

- [ ] **Step 2: Restructure main content into two columns** — the current layout has `<section>` hero (full-width) followed by `<div className="max-w-5xl mx-auto px-4 py-16">` for the main content. Replace the outer structure with a two-column layout at lg:

Replace the outer `<div className="max-w-5xl mx-auto px-4 py-16">` and everything inside it (from line 127 to just before the "Related Garments" section) with:

```tsx
{/* Two-column layout: images (left) + metadata (right) */}
<div className="max-w-6xl mx-auto px-4 py-12">
  <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
    {/* Left column: images + editorial prose */}
    <div className="w-full lg:w-[55%] min-w-0">
      {/* Primary image */}
      {garment.images && garment.images.length > 0 && (
        <div
          className="relative w-full aspect-[3/4] mb-6 overflow-hidden cursor-pointer group"
          onClick={() => handleImageClick(0)}
        >
          {garment.images[0] ? (
            <Image
              src={garment.images[0]}
              alt={editorialTitle}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
          ) : (
            <div className="absolute inset-0 bg-archive-surface flex items-center justify-center">
              <span className="text-archive-muted text-sm">No image</span>
            </div>
          )}
        </div>
      )}

      {/* Additional images */}
      {garment.images && garment.images.length > 1 && (
        <div className="grid grid-cols-3 gap-2 mb-10">
          {garment.images.slice(1, 4).map((img, i) => (
            <div
              key={i}
              className="relative aspect-[3/4] overflow-hidden cursor-pointer group"
              onClick={() => handleImageClick(i + 1)}
            >
              <Image
                src={img}
                alt={`${editorialTitle} — view ${i + 2}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 1024px) 33vw, 18vw"
              />
            </div>
          ))}
        </div>
      )}

      {/* Editorial prose — full width below images */}
      {(story || context || curatorNote) && (
        <div className="space-y-10 pt-4 border-t border-archive-border">
          {story && (
            <section>
              <h2 className="text-xs uppercase tracking-[0.3em] text-archive-muted mb-4">The Story</h2>
              <p className="text-base text-archive-muted font-light leading-[1.8]">{story}</p>
            </section>
          )}
          {context && (
            <section>
              <h2 className="text-xs uppercase tracking-[0.3em] text-archive-muted mb-4">Historical Context</h2>
              <p className="text-base text-archive-muted font-light leading-[1.8]">{context}</p>
            </section>
          )}
          {curatorNote && (
            <section>
              <h2 className="text-xs uppercase tracking-[0.3em] text-archive-muted mb-4">Curator&apos;s Note</h2>
              <p className="text-base italic text-archive-muted font-light leading-[1.8]">{curatorNote}</p>
            </section>
          )}
        </div>
      )}
    </div>

    {/* Right column: metadata panel (sticky on desktop) — see Step 3 for contents */}
    <div
      className="w-full lg:w-[45%] shrink-0 lg:sticky"
      style={{ top: "calc(var(--header-h, 73px) + 1.5rem)", maxHeight: "calc(100vh - var(--header-h, 73px) - 3rem)", overflowY: "auto" }}
    >
      {/* filled in during same edit — do not commit until Step 3 is also done */}
    </div>
  </div>
</div>
```

Do **not** commit yet — complete Step 3 first.

---

### Task 10: Structured metadata definition list + header info

**Files:**
- Modify: `components/garments/GarmentDetailClient.tsx`

Fill in the right column metadata panel with the structured `<dl>` in the same editing session as Task 9. Commit once both the two-column layout (Task 9) and the metadata content are complete.

- [ ] **Step 3: Add metadata dl to the right column** — in the same file edit as Task 9, replace the `{/* filled in during same edit */}` placeholder with:

```tsx
{/* Work type badge */}
<div className="mb-4">
  <span className="text-xs uppercase tracking-[0.2em] border border-archive-border text-archive-muted px-3 py-1">
    {garment.work_type || "Garment"}
  </span>
</div>

{/* Title */}
<h1
  className="text-2xl font-light text-archive-fg mb-1 leading-snug"
  style={{ fontFamily: "var(--font-display), Georgia, serif" }}
>
  {editorialTitle}
</h1>

{/* Accession number */}
{garment.accessionNumber && (
  <p className="font-mono text-sm text-archive-muted mb-6">
    {garment.accessionNumber}
  </p>
)}

{/* Metadata definition list */}
<dl className="space-y-0 mb-8">
  {[
    { label: "Accession No.", value: garment.accessionNumber },
    { label: "Era", value: era },
    { label: "Type", value: garment.work_type },
    { label: "Date", value: garment.date },
    { label: "Decade", value: garment.decade },
    { label: "Materials", value: Array.isArray(garment.materials) ? garment.materials.join(", ") : garment.materials },
    { label: "Colors", value: garment.colors?.join(", ") },
    { label: "Dimensions", value: garment.dimensions },
    { label: "Provenance", value: garment.provenance },
    { label: "Collection", value: garment.collection },
    { label: "Storage Location", value: (garment as any).storageLocation },
  ]
    .filter(({ value }) => value)
    .map(({ label, value }) => (
      <div key={label} className="flex gap-4 py-2 border-b border-archive-border/40">
        <dt className="text-[11px] uppercase tracking-[0.15em] text-archive-muted w-32 shrink-0 pt-0.5">
          {label}
        </dt>
        <dd className="text-sm text-archive-fg flex-1">
          {value}
        </dd>
      </div>
    ))}
</dl>

{/* Actions */}
<div className="flex gap-3 flex-wrap mb-6">
  <FavoriteButton garmentId={garment.id} variant="button" />
  <CompareButton garmentId={garment.id} variant="button" />
</div>

{/* Back link */}
<Link
  href="/collection"
  className="text-xs uppercase tracking-[0.2em] text-archive-muted hover:text-archive-fg transition-colors"
>
  ← Back to Collection
</Link>
```

- [ ] **Step 4: Verify** (covers both the two-column layout from Task 9 and the metadata content from this task)

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add components/garments/GarmentDetailClient.tsx
git commit -m "feat: Garment detail two-column layout with sticky metadata panel and structured dl"
```

---

### Task 11: 3D viewer as tab

**Files:**
- Modify: `components/garments/GarmentDetailClient.tsx`

Currently `<Garment3DViewer>` is always rendered (around line 138). Replace it with a tab control. Only mount the viewer when its tab is active.

- [ ] **Step 1: Add `activeTab` state** — at the top of the component function, add:

```tsx
const [activeTab, setActiveTab] = useState<"images" | "3d">("images");
```

- [ ] **Step 2: Add tab bar above the images in the left column** — insert before the primary image div (inside the left column):

```tsx
{/* Tab bar — only show 3D tab if model exists */}
{garment.model3d_url && (
  <div className="flex gap-0 border-b border-archive-border mb-6">
    {(["images", "3d"] as const).map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors ${
          activeTab === tab
            ? "border-b-2 border-archive-fg text-archive-fg -mb-px"
            : "text-archive-muted hover:text-archive-fg"
        }`}
      >
        {tab === "images" ? "Images" : "3D Model"}
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 3: Conditionally render 3D viewer** — wrap the existing `<Garment3DViewer>` usage so it only mounts when `activeTab === "3d"`:

```tsx
{/* 3D Viewer tab content */}
{garment.model3d_url && activeTab === "3d" && (
  <div className="mb-10">
    <Garment3DViewer
      modelUrl={garment.model3d_url}
      garmentId={garment.id}
      garment={garment}
    />
  </div>
)}
```

- [ ] **Step 4: Gate primary image and additional images on `activeTab === "images"`** — in the left column (added in Task 9), find the two image guard conditions and add `activeTab === "images" &&` to each. The JSX bodies are unchanged — only the opening condition is extended:

```tsx
// Primary image: change opening condition from:
{garment.images && garment.images.length > 0 && (
// to:
{activeTab === "images" && garment.images && garment.images.length > 0 && (

// Additional images grid: change opening condition from:
{garment.images && garment.images.length > 1 && (
// to:
{activeTab === "images" && garment.images && garment.images.length > 1 && (
```

- [ ] **Step 5: Remove the old always-rendered `<section>` for 3D viewer** — delete the old section (around original lines 128–143):

```tsx
// Delete this entire block:
{/* 3D Interactive Viewer - Always shown, isolated view */}
<section className="mb-20">
  ...
  <Garment3DViewer ... />
</section>
```

- [ ] **Step 6: Verify**

```bash
npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add components/garments/GarmentDetailClient.tsx
git commit -m "feat: Garment detail 3D viewer as conditional tab (only mounts when active)"
```

---

## Chunk 5: Timeline + Search + Header

### Task 12: Timeline sticky decade headers + research cards

**Files:**
- Modify: `components/garments/TimelineView.tsx`

- [ ] **Step 1: Import GarmentCard** — at the top of `TimelineView.tsx`, add:

```tsx
import GarmentCard from "./GarmentCard";
```

- [ ] **Step 2: Wrap each decade group in a `<section>` with a sticky header** — read `TimelineView.tsx` to find where the timeline renders its group list. The `timelineData` useMemo (around line 32) produces objects with these fields: `{ key, era, timeValue, items, count }`. `timeValue` holds the decade or year string (e.g. `"1960s"`); `era` holds the era string (e.g. `"1950-1980"`).

In the render section, replace the current group rendering loop with:

```tsx
{timelineData.map((group) => (
  <section key={group.key} className="relative">
    <div
      className="sticky z-10 bg-archive-bg py-2 border-b border-archive-border mb-4"
      style={{ top: "var(--header-h, 73px)" }}
    >
      <h3 className="text-xs uppercase tracking-[0.2em] text-archive-muted">
        {group.timeValue || group.era}
      </h3>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
      {group.items.map((garment) => (
        <GarmentCard key={garment.id} garment={garment} variant="research" />
      ))}
    </div>
  </section>
))}
```

- [ ] **Step 3: Remove old inline card rendering** — delete the existing card rendering code that was replaced by `<GarmentCard variant="research" />`.

- [ ] **Step 4: Verify**

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add components/garments/TimelineView.tsx
git commit -m "feat: Timeline sticky decade headers and GarmentCard research variant"
```

---

### Task 13: Search page quick-lookup list mode + token audit

**Files:**
- Modify: `app/search/page.tsx`
- Modify: `components/garments/AdvancedSearchBar.tsx` (add `inputRef` prop — see Step 3)

The current search page is a grid layout with zinc tokens. Replace it with a compact list (one result per row: thumbnail + title + accession + era/type badges + arrow) and use archive tokens throughout.

- [ ] **Step 1: Replace the results grid with a compact list** — in `SearchPageContent`, replace the `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ...">` results block with:

```tsx
{filteredResults.length > 0 ? (
  <div className="divide-y divide-archive-border/60">
    {filteredResults.map((garment) => (
      <Link
        key={garment.id}
        href={`/garments/${garment.slug}`}
        className="flex gap-4 items-center py-3 hover:bg-archive-surface transition-colors group"
      >
        {/* Thumbnail */}
        <div className="w-12 h-16 shrink-0 bg-archive-surface overflow-hidden">
          {(garment.thumbnailUrl || garment.imageUrl) ? (
            <img
              src={garment.thumbnailUrl || garment.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-4 h-4 text-archive-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Title + accession */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-archive-fg font-light truncate">
            {highlightMatch(
              (garment as any).name || garment.label || garment.editorial_title || "Untitled",
              searchQuery
            )}
          </div>
          {garment.accessionNumber && (
            <div className="font-mono text-[10px] text-archive-muted mt-0.5">
              {garment.accessionNumber}
            </div>
          )}
        </div>

        {/* Era + type badges */}
        <div className="hidden sm:flex gap-2 shrink-0">
          {garment.era && (
            <span className="text-[10px] uppercase tracking-widest border border-archive-border text-archive-muted px-2 py-0.5">
              {garment.era}
            </span>
          )}
          {garment.work_type && (
            <span className="text-[10px] uppercase tracking-widest border border-archive-border text-archive-muted px-2 py-0.5">
              {garment.work_type}
            </span>
          )}
        </div>

        {/* Arrow */}
        <span className="text-archive-muted group-hover:text-archive-fg transition-colors text-sm shrink-0">→</span>
      </Link>
    ))}
  </div>
) : searchQuery ? (
  <EmptyState
    icon={Search}
    title="No results found"
    description="No garments match your search. Try different keywords."
    actionLabel="Clear search"
    onAction={handleClearSearch}
  />
) : (
  <EmptyState
    icon={FileQuestion}
    title="Search the collection"
    description="Search by name, accession number, material, color, or decade."
    actionLabel="Browse collection"
    actionHref="/collection"
  />
)}
```

- [ ] **Step 2: Token audit — replace zinc classes with archive tokens** — in the page header, search query bubble, filter bar, and loading state, replace:
  - `text-zinc-400` → `text-archive-muted`
  - `text-zinc-200` / `text-zinc-100` → `text-archive-fg`
  - `border-zinc-700` → `border-archive-border`
  - `bg-zinc-900/50` → `bg-archive-surface`

- [ ] **Step 3: Make search input full-width and autofocused** — `AdvancedSearchBar` does not accept an `autoFocus` prop. Instead, add a `useRef` and `useEffect` in `SearchPageContent` to focus on mount:

```tsx
// At the top of SearchPageContent, add:
const searchInputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  searchInputRef.current?.focus();
}, []);
```

Then change the search container from `max-w-2xl` to `max-w-3xl` and update the placeholder:

```tsx
<div className="max-w-3xl mx-auto mb-8">
  <AdvancedSearchBar
    variant="full"
    onSearch={handleSearch}
    placeholder="Search by name, accession number, material… (press / to focus)"
    showAdvanced={false}
    inputRef={searchInputRef}
  />
</div>
```

If `AdvancedSearchBar` does not expose an `inputRef` prop, add one: in `AdvancedSearchBar.tsx`, accept `inputRef?: React.RefObject<HTMLInputElement>` in its props interface and pass it to the `<input ref={inputRef}>` element.

- [ ] **Step 4: Verify**

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add app/search/page.tsx components/garments/AdvancedSearchBar.tsx
git commit -m "feat: Search page quick-lookup list mode with token audit"
```

---

### Task 14: SiteHeader `/` keyboard shortcut + SearchBar placeholder

**Files:**
- Modify: `components/layout/SiteHeader.tsx`
- Modify: `components/layout/SearchBar.tsx`

- [ ] **Step 1: Add `/` keyboard shortcut to SiteHeader** — in `SiteHeader.tsx`, add a `useEffect` that listens for the `/` key and focuses the desktop search input. Add after the existing `useEffect` blocks:

```tsx
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
```

- [ ] **Step 2: Update SearchBar placeholder** — in `SiteHeader.tsx`, change the desktop `<SearchBar>` placeholder (line 81):

```tsx
// Before:
<SearchBar variant="header" placeholder="Search by name, material, color, decade..." />

// After (both desktop and mobile):
<SearchBar variant="header" placeholder="Search garments… (press / to focus)" />
```

Apply the same change to the mobile drawer `<SearchBar>` around line 104.

- [ ] **Step 3: Verify**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add components/layout/SiteHeader.tsx
git commit -m "feat: SiteHeader / keyboard shortcut to focus search + updated placeholder"
```

---

*End of plan.*
