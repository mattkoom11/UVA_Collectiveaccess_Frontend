# Frontend Improvements — Design Spec
**Date:** 2026-04-10  
**Audience:** Academic researchers and students  
**Approach:** Option C — Editorial shell (Home, About) + Research core (Collection, Detail, Timeline, Search)

---

## 1. Context & Goals

The UVA Historic Fashion Archive serves primarily academic researchers and students. The current UI has a strong editorial foundation (warm dark palette, serif typography, archival tone) but suffers from:

- Inconsistent token usage across pages
- Collection page filters that require too many steps to use
- Garment cards that show too little information at a glance
- Garment detail page that buries metadata (the primary research artifact) at the bottom
- No page transitions or micro-interaction feedback

The design preserves the editorial quality of the front-door pages (Home, About) while making every research-facing page (Collection, Garment Detail, Timeline, Search) information-dense and efficient.

---

## 2. Global / Cross-Cutting Changes

### 2.1 Token Consistency
- Audit all components for hardcoded `text-zinc-*`, `bg-zinc-*`, `border-zinc-*` values and replace with the corresponding `archive-*` tokens (`text-archive-fg`, `text-archive-muted`, `bg-archive-surface`, `border-archive-border`, etc.).
- No new tokens needed — the existing set in `globals.css` covers all cases.

### 2.2 GarmentCard — Research Variant
The existing `GarmentCard` component gets a denser layout. Changes:
- Reduce card padding from `p-3` to `p-2.5`
- Add accession number below the title in monospace (`font-mono text-[10px] text-archive-muted`)
- Era badge on image overlay: increase contrast (white text, `bg-black/70`)
- Material tags: cap at 2 visible, add `+N more` overflow label
- Color swatch strip: already present, keep as-is

The component keeps its existing `variant` prop. A new value `variant="research"` applies the dense layout. The `CollectionPage`, `TimelineView`, and related-garments grid all use `variant="research"`.

### 2.3 Micro-interactions
- **Card hover:** Standardise to `border-archive-border-hover` + `translateY(-2px)` at `transition-all duration-150`. Already partially implemented — make consistent across all card surfaces.
- **Filter result count:** When active filters change on the collection page, animate the result count with a brief scale pulse (`animate-ping` once, or a CSS keyframe) so researchers get feedback that the query responded.

### 2.4 Page Fade Transition
Wrap `<main>` in a CSS animation class that applies `opacity: 0 → 1` over 120ms on mount. Implement as a client component `<FadeIn>` wrapper that applies a Tailwind `animate-[fadein_120ms_ease-out]` keyframe. No router-level complexity needed — the Next.js App Router remounts `<main>` content on navigation naturally.

**Keyframe to add to `globals.css`:**
```css
@keyframes fadein {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## 3. Home Page

### 3.1 Hero Section
**Current:** Eyebrow + H1 + tagline + single "Browse Collection" CTA.  
**New:**
- Keep eyebrow, H1, tagline as-is (they work well).
- Replace single CTA with two side-by-side buttons:
  - Primary: `Browse Collection` (existing border-button style)
  - Secondary: `Search by accession →` (text-only link style, `text-archive-muted hover:text-archive-fg`)
- The secondary CTA links to `/search` and signals to researchers that record-level lookup exists.

### 3.2 Stats Strip
**Current:** Three large numbers with short labels.  
**New:** Labels become more descriptive:
- "Garments Catalogued" (was "Garments")
- "Garment Types" (was "Types")  
- "Eras Represented" (was "Eras")

No structural change — label text only.

### 3.3 Recent Additions Strip
**Current:** `recent.slice(0, 6)` rendered as a grid of cards.  
**New:**
- Section heading: "Recently Added to the Archive" + `View all →` link to `/collection?sort=date-desc`
- Layout: horizontal scroll strip (`overflow-x-auto scrollbar-hide`), 8 compact cards
- Each card: thumbnail (fixed `w-36 h-48`), label (1 line, truncated), accession number (monospace, `text-[10px]`)
- Cards link to `/garments/[slug]`
- Strip renders only when `garments.length > 0`

---

## 4. About Page

### 4.1 Section Dividers
Replace `border-t border-archive-border pt-8` with a centred ornament divider:
```tsx
<div className="flex items-center justify-center gap-3 py-10 md:py-14">
  <div className="h-px w-12 bg-archive-border" />
  <div className="w-1 h-1 rounded-full bg-archive-border" />
  <div className="h-px w-12 bg-archive-border" />
</div>
```
This preserves section separation without the blunt horizontal rule.

### 4.2 Contact Aside
Promote the trailing contact paragraph to a styled `<aside>`:
- Background: `bg-archive-surface`
- Border: `border border-archive-border`
- Padding: `px-6 py-5`
- Small heading: "Get in Touch" in the existing `text-xs uppercase tracking-[0.2em]` style
- Visually distinct from body copy; reads as a call-to-action rather than trailing text

---

## 5. Collection Page

### 5.1 Persistent Filter Sidebar (Desktop)
**Breakpoint:** ≥ 1024px (`lg:`).  
**Layout:** Two-column flex layout. Sidebar: `w-56 shrink-0`. Main area: `flex-1 min-w-0`.

**Sidebar contents (top to bottom):**
1. "Filters" heading (`text-xs uppercase tracking-[0.2em] text-archive-muted`)
2. "Clear all" link (shown only when filters are active)
3. **Era** — radio group (All / pre-1920 / 1920–1950 / 1950–1980 / 1980+)
4. **Type** — checkbox list (all 18 types, scrollable at `max-h-48 overflow-y-auto`)
5. **Color** — checkbox list (derived from `availableColors`)
6. **Material** — checkbox list (derived from `availableMaterials`)
7. **Date Range** — two `<input type="number">` fields (From / To)
8. **Decade** — select (existing)

On mobile (< 1024px): the existing collapsible filter bar above the grid stays unchanged.

### 5.2 Grid Density
- **Page size:** Increase from 24 → 36 garments per page
- **Desktop columns:** 4 columns (`lg:grid-cols-4`) instead of 3
- **Card variant:** `variant="research"` (see §2.2)

### 5.3 Active Filter Chips
- Move from above the filter bar to a sticky strip directly above the grid (`sticky top-[header-height]` — currently `~73px`)
- Chip strip is `sticky top-[var(--header-h)]` where `--header-h` is set on `<html>` via a `useEffect` measuring the header's `offsetHeight` on mount and resize
- Shows: one chip per active filter (label + × to clear) + "N results" count at the right end
- "Clear all" chip at the far right when > 1 filter active
- Result count updates with the pulse animation from §2.3

### 5.4 Sort & View Controls
Move the sort dropdown and grid/list toggle to a single row above the chip strip, right-aligned. Keeps the toolbar compact.

### 5.5 List View
Each row (the existing list view) adds: accession number (monospace, right-aligned in its own column), making it a proper research table row. Column order: thumbnail | title + type | accession | era | date | materials.

---

## 6. Garment Detail Page

### 6.1 Two-Column Desktop Layout
**Breakpoint:** ≥ 1024px.  
**Columns:** Left 55% (images) / Right 45% (metadata). Right column is `sticky top-[header-height]` with `max-h-[calc(100vh-73px)] overflow-y-auto` so the metadata panel stays visible while scrolling through images.

**Left column:**
- Primary image (existing)
- Additional images grid (existing, below primary)
- Editorial prose (story, context, curator note) — full width below both columns

**Right column (top to bottom):**
1. Work type badge (existing `text-xs uppercase` chip)
2. Title (`text-2xl font-light`)
3. Accession number (`font-mono text-sm text-archive-muted`)
4. Metadata `<dl>` (see §6.2)
5. Favorite + Compare buttons
6. "Back to Collection" link

### 6.2 Metadata Definition List
Replace the current scattered `<dt>/<dd>` pairs with a structured two-column `<dl>`:
- Label column: `text-[11px] uppercase tracking-[0.15em] text-archive-muted w-32 shrink-0`
- Value column: `text-sm text-archive-fg`
- Each row: `flex gap-4 py-2 border-b border-archive-border/40`
- Empty fields omitted entirely

**Field order (matches researcher priority):**
Accession No. → Era → Type → Date → Decade → Materials → Colors → Dimensions → Condition → Provenance → Collection → Storage Location

### 6.3 3D Viewer as Tab
Replace the always-rendered `<Garment3DViewer>` with a tab control above the image area:
- Tabs: "Images" (default) | "3D Model" (only shown if `garment.model3d_url` exists)
- Tab bar: `flex gap-0 border-b border-archive-border mb-4`
- Active tab: `border-b-2 border-archive-fg text-archive-fg`
- Inactive tab: `text-archive-muted hover:text-archive-fg`
- The 3D viewer only mounts when its tab is active (`{activeTab === '3d' && <Garment3DViewer … />}`)

---

## 7. Timeline Page

### 7.1 Sticky Decade Headers
When scrolling within a long era section, the decade sub-header (`1960s`, `1970s`, etc.) becomes `sticky top-[header-height]` with `bg-archive-bg z-10`. This requires wrapping each decade group in a `<section>` with the header inside it.

### 7.2 Research Cards
Replace whatever card the timeline currently renders with `<GarmentCard variant="research" />` for consistency with the collection page.

---

## 8. Search Page (`/search`)

### 8.1 Quick-Lookup Mode
The search page becomes a focused record-lookup tool, distinct from the full-featured collection filter.

**Layout:**
- Large centered search input (full-width, `text-base`, autofocused on mount)
- Placeholder: `Search by name, accession number, material… (press / to focus)`
- Results render below as a compact list (not a grid)

**Result row:** `flex gap-4 items-center py-3 border-b border-archive-border/60`
- Thumbnail: `w-12 h-16 object-cover shrink-0`
- Title + accession number stacked
- Era + Type as small badges
- Arrow link icon (`→`) on the right

### 8.2 Keyboard Shortcut
Add a `useEffect` in `SiteHeader` that listens for the `/` key (when no input is focused) and focuses the header search bar. Add `"Press / to search"` as trailing placeholder text in the `SearchBar` component.

---

## 9. Component Inventory

| Component | Change type | File |
|---|---|---|
| `GarmentCard` | Add `variant="research"` | `components/garments/GarmentCard.tsx` |
| `CollectionPage` | Sidebar, grid density, chip strip | `components/garments/CollectionPage.tsx` |
| `GarmentDetailClient` | Two-col layout, metadata dl, tabs | `components/garments/GarmentDetailClient.tsx` |
| `HomePage` | Dual CTA, stat labels, recent strip | `components/home/HomePage.tsx` |
| `AboutPage` | Ornament dividers, contact aside | `app/about/page.tsx` |
| `SiteHeader` | `/` keyboard shortcut | `components/layout/SiteHeader.tsx` |
| `SearchBar` | Placeholder text | `components/layout/SearchBar.tsx` |
| `TimelineView` | Sticky headers, research cards | `components/garments/TimelineView.tsx` |
| `SearchPageClient` | Quick-lookup list mode | (new or existing search page client) |
| `FadeIn` | New wrapper component | `components/layout/FadeIn.tsx` |
| `globals.css` | `fadein` keyframe | `app/globals.css` |

---

## 10. Out of Scope
- New pages or routes
- Backend / CA integration changes
- Authentication or admin changes
- Mobile-specific redesigns beyond what's noted (existing mobile patterns are preserved)
- Animation libraries (no Framer Motion — CSS keyframes only)
