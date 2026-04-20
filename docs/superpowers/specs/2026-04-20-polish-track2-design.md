# Polish — Track 2 Design
**Date:** 2026-04-20
**Status:** Approved

## Overview

Four layered improvements to make the site presentable for stakeholder sharing. Ordered by impact: SEO first (affects every shared link immediately), then loading states, then visual consistency, then mobile.

---

## 1. SEO & Open Graph Tags

### Problem
Garment detail pages have no dynamic metadata. Shared links show the generic site title/description with no image preview. There is no structured data for search engines.

### Solution

**Dynamic metadata** — add `generateMetadata()` to `app/garments/[slug]/page.tsx`. Export fields:
- `title`: garment label
- `description`: `aesthetic_description` or `story` (first 160 chars), fallback to label + era
- `openGraph.images`: first garment image URL
- `openGraph.type`: `"article"`
- `twitter.card`: `"summary_large_image"`

**JSON-LD structured data** — inject a `<script type="application/ld+json">` block with `ClothingProduct` schema:
```json
{
  "@type": "Product",
  "name": "...",
  "description": "...",
  "image": ["..."],
  "category": "Clothing",
  "material": ["..."]
}
```

**Static OG metadata** — home page and collection page get static `title`/`description`/`openGraph` in their respective `page.tsx` files.

### Files changed
- `app/garments/[slug]/page.tsx` — add `generateMetadata()`, add JSON-LD script block
- `app/page.tsx` — add static `export const metadata`
- `app/collection/page.tsx` — add static `export const metadata`

---

## 2. Loading & Skeleton States

### Problem
The collection grid and garment detail page flash blank (or show nothing) while data loads, which looks broken during stakeholder demos.

### Solution

**`GarmentCardSkeleton` component** — a new component in `components/garments/` that matches `GarmentCard`'s exact dimensions with animated Tailwind pulse classes. No new dependencies.

**Collection grid** — wrap the garment grid in a `<Suspense>` boundary with a skeleton grid (24 cards) as fallback.

**Garment detail** — add a skeleton for the hero section (image placeholder + title/subtitle lines) as the Suspense fallback in `app/garments/[slug]/page.tsx`.

**Existing `ErrorBoundary`** stays in place — skeleton states are the loading path, error boundary handles failures.

### Files changed
- `components/garments/GarmentCardSkeleton.tsx` — new skeleton component
- `app/collection/page.tsx` — wrap grid in `<Suspense fallback={<SkeletonGrid />}>`
- `app/garments/[slug]/page.tsx` — wrap detail in `<Suspense fallback={<DetailSkeleton />}>`

---

## 3. Visual Consistency

### Problem
Non-home pages have inconsistent section padding and heading scale. Collection, timeline, compare, and favorites pages use different spacing conventions from each other, making the site feel unfinished.

### Solution
Audit and normalize:
- **Section padding**: standardize on `px-6 md:px-12 py-8` for all top-level page containers
- **Page headings**: standardize on `font-display text-3xl md:text-4xl` for H1 across all pages
- **Card sizing**: ensure `GarmentCard` renders at the same size in collection, favorites, compare, and related garments sections

No new components — these are Tailwind class adjustments in existing page and component files.

### Files to audit
- `app/collection/page.tsx` or `components/garments/CollectionPage.tsx`
- `app/timeline/page.tsx`
- `app/compare/page.tsx`
- `app/favorites/page.tsx`
- `app/exhibitions/page.tsx`

---

## 4. Mobile Feel

### Problem
Three specific mobile issues: filter panel pushes layout instead of overlaying, image gallery swipe may not work end-to-end on touch, site header has no visible collapse on small screens.

### Solution

**Filter panel** — ensure the filter sidebar uses `fixed` positioning and a backdrop overlay on mobile (`md:relative md:block`). Add a close button inside the panel.

**Image gallery** — verify the existing pinch-to-zoom and swipe handlers in `components/garments/ImageGallery` work on iOS Safari and Android Chrome. Add a visible swipe hint ("← swipe →") on first open, dismissed after first interaction.

**Site header** — confirm mobile nav menu closes on route change (add `usePathname` effect to close on navigation if not already present).

**3D controls** — add a brief overlay hint ("pinch to zoom · drag to rotate") on first load of any 3D scene, auto-dismissed after 3 seconds.

### Files changed
- `components/garments/CollectionPage.tsx` (or filter sidebar component) — mobile filter overlay
- `components/garments/ImageGallery.tsx` — swipe hint
- `components/layout/SiteHeader.tsx` — close on route change
- `components/home/HomePage.tsx` or 3D scene components — touch hint overlay

---

## Error Handling

- SEO: `generateMetadata()` must handle missing garment gracefully — return generic metadata if slug not found.
- Skeletons: Suspense fallbacks render immediately; no error cases.
- Visual/mobile fixes: purely presentational, no error states needed.

---

## Testing

- SEO: share a garment URL in a Slack message or use `og:debugger` to verify preview card.
- Skeletons: throttle network in devtools to "Slow 3G" and navigate to collection page.
- Visual: compare collection, timeline, compare, and favorites pages side-by-side at 1280px.
- Mobile: test on iOS Safari (real device or simulator) and Chrome devtools mobile emulation at 375px.
