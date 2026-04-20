# Polish — Track 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the UVA Historic Fashion Archive for stakeholder sharing — add missing SEO metadata, wire skeleton states, normalize visual consistency across pages, and add a swipe hint to the image gallery.

**Architecture:** All changes are isolated to individual page and component files. No new dependencies. Skeleton components already exist — they just need to be wired up. SEO metadata follows the pattern already established in `app/garments/[slug]/page.tsx`.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4

---

## Pre-flight: Actual Code State

Before implementing, note what is already done:
- `app/garments/[slug]/page.tsx` already has complete `generateMetadata()`, OpenGraph, Twitter card, JSON-LD. No changes needed here.
- `components/garments/SkeletonCard.tsx` and `SkeletonList.tsx` already exist.
- `components/layout/SiteHeader.tsx` already closes mobile menu on route change via `useEffect([pathname])`.
- Mobile filter panel in `CollectionPage.tsx` already shows an inline mobile filter section (`lg:hidden`). Not a drawer, but functional.
- `ImageGallery.tsx` already has touch/swipe/pinch handlers — just no visible hint UI.

---

## Task 1: Add Static Metadata to Home and Collection Pages

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/collection/page.tsx`

- [ ] **Step 1: Add metadata export to app/page.tsx**

Open `app/page.tsx`. Add this export before the default export:

```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UVA Fashion Archive",
  description: "Explore the University of Virginia's historic clothing collection — garments spanning over a century of fashion history.",
  openGraph: {
    title: "UVA Fashion Archive",
    description: "Explore the University of Virginia's historic clothing collection — garments spanning over a century of fashion history.",
    siteName: "UVA Fashion Archive",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UVA Fashion Archive",
    description: "Explore the University of Virginia's historic clothing collection.",
  },
};
```

- [ ] **Step 2: Add metadata export to app/collection/page.tsx**

Open `app/collection/page.tsx`. Add this export before the default export:

```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collection | UVA Fashion Archive",
  description: "Browse the full UVA Historic Clothing Collection — filter by era, type, color, and material.",
  openGraph: {
    title: "Collection | UVA Fashion Archive",
    description: "Browse the full UVA Historic Clothing Collection — filter by era, type, color, and material.",
    siteName: "UVA Fashion Archive",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Collection | UVA Fashion Archive",
    description: "Browse the full UVA Historic Clothing Collection.",
  },
};
```

- [ ] **Step 3: Verify in browser**

Start dev server and open `http://localhost:3000` in a browser. Right-click → View Page Source. Verify:
- `<title>UVA Fashion Archive</title>` is present
- `<meta property="og:title" content="UVA Fashion Archive" />` is present

Repeat for `http://localhost:3000/collection`.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/collection/page.tsx
git commit -m "seo: add static metadata to home and collection pages"
```

---

## Task 2: Replace Crude Loading Text in Compare Page

**Files:**
- Modify: `app/compare/page.tsx`

- [ ] **Step 1: Open app/compare/page.tsx**

Current Suspense fallback:
```tsx
<Suspense fallback={<div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center"><p className="text-zinc-400">Loading...</p></div>}>
```

- [ ] **Step 2: Replace with a skeleton grid**

```tsx
import SkeletonCard from "@/components/garments/SkeletonCard";

function CompareSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
```

Replace the `fallback` prop:
```tsx
<Suspense fallback={<CompareSkeleton />}>
```

- [ ] **Step 3: Verify**

```bash
npm run build 2>&1 | tail -10
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add app/compare/page.tsx
git commit -m "ui: replace Loading text in compare page with skeleton grid"
```

---

## Task 3: Normalize Visual Consistency Across Pages

**Files:**
- Modify: `components/garments/TimelineView.tsx`
- Modify: `components/garments/FavoritesPageClient.tsx`

The standard across the app is `max-w-7xl mx-auto px-4 py-12 md:py-20` for page containers, and `text-3xl md:text-4xl font-light tracking-tight` for page headings. Two deviations to fix:

**3a — Timeline missing responsive vertical padding**

- [ ] **Step 1: Open TimelineView.tsx, find line 151**

Current:
```tsx
<div className="max-w-7xl mx-auto px-4 py-12" ref={timelineRef}>
```

Change to:
```tsx
<div className="max-w-7xl mx-auto px-4 py-12 md:py-20" ref={timelineRef}>
```

**3b — Favorites has extra lg:text-5xl on h1**

- [ ] **Step 2: Open FavoritesPageClient.tsx, find line 37**

Current:
```tsx
<h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
```

Change to:
```tsx
<h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
```

- [ ] **Step 3: Verify visually**

Open `http://localhost:3000/timeline` and `http://localhost:3000/favorites` side by side with `http://localhost:3000/collection`. Spacing and heading scale should feel consistent.

- [ ] **Step 4: Commit**

```bash
git add components/garments/TimelineView.tsx components/garments/FavoritesPageClient.tsx
git commit -m "ui: normalize page container padding and heading scale across timeline and favorites"
```

---

## Task 4: Add Swipe Hint to Image Gallery

**Files:**
- Modify: `components/garments/ImageGallery.tsx`

Touch/swipe/pinch handlers already exist. We just need a visible one-time hint that auto-dismisses after 2s or on first swipe.

- [ ] **Step 1: Add dismissed state to ImageGallery**

Open `ImageGallery.tsx`. Find the existing `useState` declarations near the top of the component (around line 20-30). Add:

```ts
const [swipeHintVisible, setSwipeHintVisible] = useState(true);
```

- [ ] **Step 2: Dismiss hint on first touch and after 2 seconds**

In the existing `handleTouchStart` function (around line 111), add a dismiss call at the top:

```ts
setSwipeHintVisible(false);
```

Also add a `useEffect` alongside the existing effects:

```ts
useEffect(() => {
  const t = setTimeout(() => setSwipeHintVisible(false), 2000);
  return () => clearTimeout(t);
}, []);
```

- [ ] **Step 3: Render the hint overlay**

Find the fullscreen image container in the JSX (the element with `fixed inset-0` around line 929 of CollectionPage, or wherever the gallery renders its main view in ImageGallery.tsx). Add inside it, after the main image:

```tsx
{swipeHintVisible && (
  <div className="pointer-events-none absolute bottom-16 inset-x-0 flex justify-center">
    <span className="bg-black/60 text-white/80 text-xs px-4 py-1.5 rounded-full tracking-widest uppercase">
      ← swipe →
    </span>
  </div>
)}
```

- [ ] **Step 4: Verify on mobile emulation**

In Chrome devtools, enable mobile emulation at 375px. Open a garment detail page and tap the image to open the gallery. The hint should appear and fade out after 2 seconds, or disappear on first swipe.

- [ ] **Step 5: Commit**

```bash
git add components/garments/ImageGallery.tsx
git commit -m "ui: add auto-dismissing swipe hint to image gallery on mobile"
```
