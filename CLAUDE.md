# CLAUDE.md — UVA Historic Fashion Archive

## Project Overview

Next.js 16 / React 19 frontend for the **UVA Historic Clothing Collection**.  
Connects to CollectiveAccess (CA) CMS; falls back to static `data/garments.json` when no CA URL is set.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 |
| 3D | Three.js + @react-three/fiber + @react-three/drei v10 |
| Icons | lucide-react |
| Language | TypeScript 5 |

---

## Repository Layout

```
UVA_Collectiveaccess_Frontend/
├── uvafashion-frontend/          # Main Next.js app
│   ├── app/                      # App Router pages & API routes
│   │   ├── layout.tsx            # Root layout — calls hydrateGarmentsFromCA()
│   │   ├── page.tsx              # Home page
│   │   ├── collection/           # /collection — paginated garment grid
│   │   ├── garments/[slug]/      # /garments/:slug — detail page
│   │   ├── backstage/[id]/       # /backstage/:id — 3D backstage detail
│   │   ├── admin/                # /admin — AdminDashboard (auth-gated)
│   │   ├── timeline/             # /timeline
│   │   ├── favorites/            # /favorites
│   │   ├── compare/              # /compare
│   │   ├── exhibitions/          # /exhibitions
│   │   ├── learn/                # /learn
│   │   ├── statistics/           # /statistics
│   │   ├── runway/               # /runway
│   │   ├── search/               # /search
│   │   └── api/
│   │       ├── admin/            # POST /api/admin/sync
│   │       ├── garments/         # Garment API routes
│   │       └── search/           # Search API routes
│   ├── components/
│   │   ├── garments/             # GarmentCard, GarmentDetailClient, ImageGallery,
│   │   │                         #   CollectionPage, TimelineView, GarmentSearch,
│   │   │                         #   Compare, Favorites, Garment3DViewer
│   │   ├── layout/               # SiteHeader, SiteFooter, Breadcrumbs,
│   │   │                         #   SearchBar, PWA, Accessibility
│   │   ├── backstage/            # Backstage3D, BackstagePage
│   │   ├── home/                 # HomePage (3D Runway + Backstage tabs)
│   │   ├── admin/                # AdminAuthGate
│   │   ├── runway/               # RunwayPage
│   │   └── ui/                   # Shared primitives (Button, etc.)
│   ├── lib/
│   │   ├── collectiveAccess.ts   # Singleton CollectiveAccessClient (5-min cache)
│   │   ├── garments.ts           # getAllGarments(), hydrateGarmentsFromCA(), syncGarmentsFromCA()
│   │   ├── advancedSearch.ts     # Boolean/field search logic
│   │   ├── analytics.ts          # Analytics tracking
│   │   ├── annotations.ts        # Garment annotations
│   │   ├── colorUtils.ts         # Color helpers
│   │   ├── export.ts             # JSON/CSV/PDF export
│   │   ├── filterPresets.ts      # Saved filter presets
│   │   ├── garmentFilters.ts     # Filter logic
│   │   ├── imagePlaceholder.ts   # Placeholder image util
│   │   ├── pwa.ts                # PWA helpers
│   │   ├── relatedGarments.ts    # Similarity-scoring algorithm
│   │   ├── savedSearches.ts      # Saved searches (localStorage)
│   │   └── statistics.ts         # Collection statistics
│   ├── types/
│   │   └── garment.ts            # Garment interface, Era, GarmentType, helper fns
│   ├── data/
│   │   ├── garments.json         # Static fallback garment data
│   │   ├── sampleGarments.ts
│   │   ├── exhibitions.ts
│   │   ├── shows.ts
│   │   └── educationalContent.ts
│   ├── hooks/
│   │   ├── useFavorites.ts
│   │   └── useKeyboardShortcuts.ts
│   └── public/                   # Static assets, 3D models
└── docs/                         # Project documentation
```

---

## Data Flow

1. **Static fallback**: `lib/garments.ts` → `getAllGarments()` returns static `garments.json` when `CA_BASE_URL` is not set.
2. **CA hydration**: `hydrateGarmentsFromCA()` is called in `app/layout.tsx` on every request (no-ops silently if no CA URL).
3. **In-memory cache**: `CollectiveAccessClient` caches responses for 5 minutes; resets on cold start.
4. **Admin sync**: `POST /api/admin/sync` → `syncGarmentsFromCA(500)` force-refreshes the in-memory cache.

### CollectiveAccess Authentication Flow

The CA client uses a **cookie + Basic Auth** flow to retrieve a session token:
- Sends Basic Auth credentials to CA login endpoint
- Stores the session cookie
- Uses that cookie for subsequent API requests

---

## Garment Type

```ts
interface Garment {
  id: string
  slug: string
  label: string
  decade?: number
  date?: string
  yearApprox?: number
  era: Era                          // 'pre-1920' | '1920-1950' | '1950-1980' | '1980+'
  work_type?: string
  type: GarmentType                 // 'dress' | 'coat' | 'jacket' | 'suit' | 'accessory' | 'other'
  colors: string[]
  materials: string | string[]      // ⚠ inconsistent — normalize before use
  images: string[]
  imageUrl?: string
  thumbnailUrl?: string
  model3d_url?: string
  modelUrl?: string
  // Editorial fields
  editorial_title?: string
  editorial_subtitle?: string
  aesthetic_description?: string
  story?: string
  inspiration?: string
  context?: string
  tagline?: string
  curatorNote?: string
  // Provenance
  accessionNumber?: string
  collection?: string
  provenance?: string
  dimensions?: string
  relatedIds?: string[]
}
```

---

## Key Pages & Features

### `/` — Home Page
- 3D Runway tab (animated models walking oval catwalk, filterable by era/type)
- 3D Backstage tab (interactive mannequins, click → `/backstage/[id]`)
- Featured exhibitions section

### `/collection` — Collection Page
- Pagination: 24 garments/page
- Sort: relevance / date (asc/desc) / name (asc/desc) / era
- Filters: era, garment type, color, material, decade, work_type, date range
- Active filter chip strip (clear individual or all)
- Grid / List view toggle
- Multi-select, favorites, compare
- Export: JSON / CSV / PDF
- Advanced search (boolean/field)
- Saved searches & filter presets
- Analytics tracking

### `/garments/[slug]` — Garment Detail
- Magazine-style hero section (editorial typography)
- Image gallery: full-screen, zoom up to 500%, pan, swipe, pinch-to-zoom, keyboard nav
- Share button: native Web Share API (mobile) or clipboard copy (desktop)
- Related garments (similarity algorithm: era 30%, type 25%, color 20%, material 15%, decade 10%)

### `/timeline`
- Visual timeline grouped by era and decade
- Color-coded era sections, clickable garment cards

### `/admin`
- Behind `AdminAuthGate` (password check via `x-admin-password` header)
- Sync CA data, export analytics, view collection stats

---

## 3D Components

| Component | Description |
|-----------|-------------|
| `Runway3D` | Animated walking models on oval catwalk path (@react-three/fiber) |
| `Backstage3D` | Interactive mannequins in backstage scene; click → `/backstage/[id]` |
| `Garment3DViewer` | Single garment GLTF viewer |

---

## Environment Variables

| Variable | Side | Purpose |
|----------|------|---------|
| `CA_BASE_URL` | Server | CollectiveAccess base URL |
| `CA_USERNAME` | Server | CA login username |
| `CA_PASSWORD` | Server | CA login password |
| `CA_API_KEY` | Server | CA API key |
| `ADMIN_PASSWORD` | Server | Admin dashboard password (default: `"uva-fashion-admin"`) |
| `NEXT_PUBLIC_CA_BASE_URL` | Client | Public CA base URL (non-secret only) |

> **Never** use `NEXT_PUBLIC_` for `CA_USERNAME`, `CA_PASSWORD`, or `CA_API_KEY` — those values get bundled into client JS.

---

## Auth & Security

- **Admin auth**: `x-admin-password` header vs. `ADMIN_PASSWORD` env var.  
  Default `"uva-fashion-admin"` **must be overridden in production**.
- **CA credentials**: Server-only `CA_*` env vars. `NEXT_PUBLIC_CA_*` fallbacks exist but expose secrets — avoid in production.
- `robots.txt` disallows `/admin`.
- `poweredByHeader: false` in Next.js config.
- Export/print paths use `escapeHtml` to prevent XSS.
- Favorites, saved searches, analytics stored in `localStorage` only (no server persistence).

### Recommended (not yet implemented)
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`
- Auth on `/admin` and `/api/admin/*` (NextAuth or shared secret middleware)
- Network-level restriction of admin routes to VPN/internal

---

## Known Issues

| Issue | Location | Notes |
|-------|----------|-------|
| `hydrateGarmentsFromCA()` runs on every request | `app/layout.tsx` | Can be slow if CA is unreachable; no timeout guard |
| In-memory cache resets on cold start | `lib/garments.ts` | No persistent cache layer |
| `materials` field is `string \| string[]` | `types/garment.ts` | Needs normalization at the data layer |
| Image fetching skipped during hydration | `lib/garments.ts` | Prevents hydration hangs; images loaded separately |

---

## Development

```bash
cd uvafashion-frontend
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
```

---

## CollectiveAccess Integration Notes

- Branch `demo/ca-integration` contains the active CA integration work.
- The CA client (`lib/collectiveAccess.ts`) was updated to use a **cookie + Basic Auth** token retrieval flow after the original API key approach failed.
- `hydrateGarmentsFromCA()` now skips image fetching during hydration (added logging for debugging).
- The collection page data flow was fixed to correctly source from the CA cache when available.
