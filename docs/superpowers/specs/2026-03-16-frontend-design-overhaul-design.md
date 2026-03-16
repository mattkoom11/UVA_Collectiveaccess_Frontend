# Frontend Design Overhaul — Design Spec
**Date:** 2026-03-16
**Project:** UVA Historic Clothing Collection Frontend
**Status:** Approved

---

## Overview

Elevate the visual design of the UVA Fashion Archive from a competent-but-generic dark UI to a distinctive, curatorial aesthetic befitting a historic clothing collection. The current design uses Geist/Arial fonts, a minimal zinc color palette, and under-designed components (sparse garment cards, single-line footer, undifferentiated buttons).

**Chosen Aesthetic Direction:** Dark Monochrome Museum
- **Display font:** DM Serif Display (headings, labels, badges)
- **Body font:** Crimson Pro (body text, italics, metadata)
- **Background:** Deep charcoal `#0f0e0c` / `#0a0908`
- **Foreground:** Warm off-white `#f0ede8`
- **Accent:** Silver-white `#e8e4de`
- **Borders:** Subtle `#1e1e1e` / `#2a2a2a`, hover `#3a3a3a`
- **Muted text:** `--muted: #666` / `--muted-subtle: #888`

---

## Scope of Changes

### 1. Typography & Global CSS

**Files:** `uvafashion-frontend/app/layout.tsx`, `uvafashion-frontend/app/globals.css`

- Import `DM_Serif_Display` and `Crimson_Pro` via `next/font/google` in `layout.tsx`; expose as CSS variables `--font-display` and `--font-body`
- In `globals.css`:
  - **Remove** the `@media (prefers-color-scheme: dark)` block that overrides `--background`/`--foreground` — new palette is set unconditionally in `:root`
  - **Update** the Tailwind v4 `@theme inline` block to map `--color-background`, `--color-foreground`, `--font-sans`, and `--font-display` to the new variables so Tailwind utilities (`bg-background`, `text-foreground`, `font-sans`) resolve correctly
  - Update `:root` CSS variables:
    ```css
    --background: #0f0e0c;
    --foreground: #f0ede8;
    --accent: #e8e4de;
    --muted: #666;
    --muted-subtle: #888;
    --border: #1e1e1e;
    --border-hover: #3a3a3a;
    ```
  - Add `@keyframes shimmer` (used by skeleton cards):
    ```css
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    ```
  - **Note:** The `.high-contrast` override rules in `globals.css` reference hardcoded zinc values. After palette migration, do a compatibility review pass on `AccessibilityControls` to ensure high-contrast mode still functions — this is a review task, not a blocker for the initial implementation.

---

### 2. Garment Cards

**File:** `uvafashion-frontend/components/garments/GarmentCard.tsx`

Current state: Simple vertical card — image, label, type, decade. Minimal text, image has `group-hover:scale-105`.

Redesign:
- **Remove** the existing `group-hover:scale-105` from the inner `<Image>` element
- **Era badge overlay:** Absolutely positioned inside the image container (`position: absolute; top: 10px; left: 10px; z-index: 10`). `DM Serif Display`, 10px, `letter-spacing: 0.15em`, uppercase, `color: #f0ede8`, `background: rgba(15,14,12,0.85)`, `border-left: 2px solid #e8e4de`, `padding: 3px 8px`. Shows `garment.era` if available, else `garment.decade`.
- **Color swatch strip:** 4px-tall `<div>` immediately below the image (outside the image container). Built from `garment.colors[]` — up to 4 `<span>` children each `flex: 1` with `background` set to the color value. Hidden (`display: none`) if `colors` is empty or undefined.
- **Garment type label:** `DM Serif Display`, 9px, `letter-spacing: 0.25em`, uppercase, `color: var(--muted)`, shown above the title
- **Title:** `DM Serif Display`, 18–20px, `color: #f0ede8`
- **Subtitle:** `Crimson Pro` italic, 14px, `color: var(--muted)`. Format: `"circa {decade}"` — if `garment.collection` is present, append ` · {collection}`; omit the ` · {collection}` segment when the field is undefined or empty
- **Material tags:** `Crimson Pro`, 11–12px, `color: var(--muted)`, `border: 1px solid #252525`, `padding: 2px 7px`. Show up to 3. If `garment.materials` is a string (not array), display as a single tag. Hidden if no materials.
- **Card hover:** `border-color: var(--border-hover)`, `transform: translateY(-2px)`, `transition: all 0.2s ease`. No image scale.

---

### 3. Site Footer

**File:** `uvafashion-frontend/components/layout/SiteFooter.tsx`

Current state: Single `flex justify-between` row — brand name left, copyright right.

Redesign:
- **Mobile (default):** Preserve existing layout — `flex justify-between`, brand name left, copyright year right. No change to mobile appearance.
- **Desktop (`md+`):** 3-column grid above the existing bottom bar:
  - **Col 1 (wide, `grid-cols: 2fr 1fr 1fr`):**
    - Brand name: `DM Serif Display`, 16px, `letter-spacing: 0.15em`, uppercase, `color: #f0ede8`
    - Description below: `Crimson Pro` italic, 13px, `color: var(--muted)`: *"A curated collection of historic garments from the University of Virginia."*
  - **Col 2 — Explore:**
    - Heading: `DM Serif Display`, 11px, `letter-spacing: 0.2em`, uppercase, `color: var(--muted)`, `margin-bottom: 10px`
    - Links: Collection, Timeline, Exhibitions, Statistics — `Crimson Pro`, 12px, `color: #444`, `display: block`, `line-height: 2`, hover `color: #888`
  - **Col 3 — About:**
    - Heading: same as Col 2 heading style
    - Links: About, Contact, Credits, Accessibility — same link style
  - Thin `border-top: 1px solid #151515` divider between the 3-column grid and the bottom copyright bar
  - Bottom bar: existing `flex justify-between` — brand name left, `© {year} University of Virginia` right — preserved on all breakpoints

---

### 4. Button Hierarchy

**File:** `uvafashion-frontend/components/ui/Button.tsx` (create new file; also create `components/ui/` directory)

Create a `Button` React component with a `variant` prop: `"primary" | "secondary" | "ghost"` (default: `"secondary"`).

Styles per variant:
- **Primary:** `background: #e8e4de`, `color: #0a0908`, `font-family: var(--font-display)`, `font-size: 10px`, `letter-spacing: 0.2em`, `text-transform: uppercase`, `padding: 9px 20px`, `border: none`. Hover: `background: #f0ede8`.
- **Secondary:** `background: transparent`, `border: 1px solid #2a2a2a`, `color: #a0a0a0`, same font/size/tracking as primary. Hover: `border-color: #3a3a3a`, `color: #c0bdb8`.
- **Ghost:** `background: transparent`, `border: none`, `border-bottom: 1px solid #2a2a2a`, `font-family: var(--font-body)` (Crimson Pro), `font-size: 13px`, `letter-spacing: 0.1em`, `color: var(--muted)`, `padding: 6px 0`. Hover: `color: #a0a0a0`.

Update key existing button usages to use `<Button variant="primary">` or `<Button variant="secondary">` in: `CollectionPage.tsx`, `GarmentDetailView.tsx`, `EmptyState.tsx`. Admin dashboard buttons are out of scope.

---

### 5. Filter Tags (Structural + Visual Change)

**File:** `uvafashion-frontend/components/garments/CollectionPage.tsx`

Current state: Era, type, color, material, decade, and work_type filters are `<select>` dropdowns — no tag chips exist.

This section introduces a new **active filter chip strip** below the existing filter selects. It does not replace the `<select>` dropdowns (those remain). Instead, when a filter has a non-default selection, it renders a chip in a new `<div>` chip strip that appears between the filter row and the results grid.

Each chip:
- **Inactive/unselected:** Not shown (chips only appear for active selections)
- **Active chip:** `Crimson Pro`, 12px, `color: #e8e4de`, `border: 1px solid #555`, `background: #161512`, `padding: 4px 10px`, inline-flex with a `×` dismiss button (`color: #888`, hover `color: #ccc`) that clears that filter to its default value
- Chip strip: `display: flex`, `gap: 6px`, `flex-wrap: wrap`, hidden entirely when no filters are active
- A "Clear all" ghost-style link at the end of the strip when 2+ chips are active

---

### 6. Loading Skeletons

**File:** `uvafashion-frontend/components/garments/SkeletonCard.tsx`

Current state: Basic Tailwind `animate-pulse` with flat gray blocks.

Redesign:
- Replace `animate-pulse` with shimmer animation using the `@keyframes shimmer` defined in `globals.css`
- Shimmer gradient: `background: linear-gradient(90deg, #141210 0%, #1e1c18 50%, #141210 100%)`, `background-size: 200% 100%`, `animation: shimmer 1.8s infinite linear`
- Match new card structure: image placeholder area → 4px swatch strip → type label block → title block → subtitle block → 3 small tag pill blocks
- All skeleton blocks use the shimmer style; maintain same card outer dimensions as `GarmentCard`

---

## Out of Scope

- 3D scene styling (Runway3D, Backstage3D)
- Admin dashboard layout and buttons
- PWA manifest or icons
- Any data model or API changes
- Replacing `<select>` filter dropdowns with tag chips (the active chip strip in Section 5 is additive)

---

## Responsive Behavior

- Follow existing Tailwind responsive prefix patterns throughout
- Footer: single-line `justify-between` on mobile, 3-column grid on `md+`
- Garment cards: visual enhancements only, no layout changes
- Buttons: same sizing across breakpoints
- Filter chip strip: wraps to multiple lines on mobile (`flex-wrap: wrap`)

---

## File Change Summary

| File | Change Type |
|---|---|
| `app/layout.tsx` | Add DM Serif Display + Crimson Pro font imports |
| `app/globals.css` | Update CSS variables, `@theme inline`, remove dark media query, add shimmer keyframe |
| `components/garments/GarmentCard.tsx` | Full visual redesign |
| `components/garments/SkeletonCard.tsx` | Shimmer animation, match new card structure |
| `components/garments/CollectionPage.tsx` | Add active filter chip strip |
| `components/layout/SiteFooter.tsx` | Desktop 3-column layout, mobile unchanged |
| `components/ui/Button.tsx` | New file — primary/secondary/ghost variants |
