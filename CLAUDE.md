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

Note: despite the repo name, the Next.js app lives at the **repo root** —
there is no `uvafashion-frontend/` subfolder. Run `npm run dev` etc.
directly from here.

```
UVA_Collectiveaccess_Frontend/
├── app/                       # App Router pages & API routes
│   ├── layout.tsx             # Root layout — calls hydrateGarmentsFromCA()
│   ├── page.tsx               # Home page
│   ├── collection/            # /collection — paginated garment grid
│   ├── garments/[slug]/       # /garments/:slug — detail page
│   ├── backstage/[id]/        # /backstage/:id — 3D backstage detail
│   ├── admin/                 # /admin — AdminDashboard (auth-gated)
│   ├── timeline/               # /timeline
│   ├── favorites/              # /favorites
│   ├── compare/                # /compare
│   ├── exhibitions/            # /exhibitions
│   ├── learn/                  # /learn
│   ├── statistics/             # /statistics
│   ├── runway/                 # /runway
│   ├── search/                 # /search
│   └── api/
│       ├── admin/             # POST /api/admin/auth, POST /api/admin/sync
│       ├── garments/          # Garment API routes
│       └── search/            # Search API routes
├── components/
│   ├── garments/               # GarmentCard, GarmentDetailClient, ImageGallery,
│   │                           #   CollectionPage, TimelineView, GarmentSearch,
│   │                           #   Compare, Favorites, Garment3DViewer
│   ├── layout/                 # SiteHeader, SiteFooter, Breadcrumbs,
│   │                           #   SearchBar, PWA, Accessibility
│   ├── backstage/               # Backstage3D, BackstagePage
│   ├── home/                    # HomePage (3D Runway + Backstage tabs)
│   ├── admin/                   # AdminAuthGate
│   ├── runway/                  # RunwayPage
│   └── ui/                      # Shared primitives (Button, etc.)
├── lib/
│   ├── collectiveAccess.ts     # Singleton CollectiveAccessClient (5-min result cache)
│   ├── garments.ts             # getAllGarments(), hydrateGarmentsFromCA(), syncGarmentsFromCA()
│   ├── adminAuth.ts            # HMAC-signed admin sessions, rate limiting
│   ├── advancedSearch.ts       # Boolean/field search logic
│   ├── analytics.ts            # Analytics tracking
│   ├── annotations.ts          # Garment annotations
│   ├── colorUtils.ts           # Color helpers
│   ├── export.ts               # JSON/CSV/PDF export
│   ├── filterPresets.ts        # Saved filter presets
│   ├── garmentFilters.ts       # Filter logic
│   ├── imagePlaceholder.ts     # Placeholder image util
│   ├── pwa.ts                  # PWA helpers
│   ├── relatedGarments.ts      # Similarity-scoring algorithm
│   ├── savedSearches.ts        # Saved searches (localStorage)
│   └── statistics.ts           # Collection statistics
├── middleware.ts               # CSP + security headers, per-request nonce
├── types/
│   └── garment.ts              # Garment interface, Era, GarmentType, helper fns
├── data/
│   ├── garments.json           # Static fallback garment data
│   ├── sampleGarments.ts
│   ├── exhibitions.ts
│   ├── shows.ts
│   └── educationalContent.ts
├── hooks/
│   ├── useFavorites.ts
│   └── useKeyboardShortcuts.ts
└── public/                     # Static assets, 3D models
```

---

## Data Flow

1. **Static fallback**: `lib/garments.ts` → `getAllGarments()` returns static `garments.json` when `CA_BASE_URL` is not set.
2. **CA hydration**: `hydrateGarmentsFromCA()` fires in the background from `app/layout.tsx` on every request (non-blocking, no-ops silently if no CA URL). It's guarded by a 30s timeout and only actually hits CA once per cold start — after that it returns immediately since `caGarmentsCache` is already populated.
3. **In-memory + disk cache**: `CollectiveAccessClient` caches raw API responses for 5 minutes. The higher-level garment cache in `lib/garments.ts` also persists to `data/ca-garments-cache.json` on disk after every hydrate/sync, so a cold start reads the last-known-good snapshot from disk before falling back to a live CA fetch.
4. **Admin sync**: `POST /api/admin/sync` → `syncGarmentsFromCA(0)` force-refreshes the cache (in-memory and disk) — requires an authenticated admin session (see Auth & Security).
5. **Public-display filter**: only CA objects with `public_display` set truthy (Web Display Settings container) are synced into the cache — see `CollectiveAccessClient.isPublic()`. Fail-closed: unset/missing values are treated as not public.

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
  materials: string[]                // normalized via normalizeMaterials() at the data layer
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
- Behind `AdminAuthGate`: password submitted to `POST /api/admin/auth`, which
  returns an HMAC-signed, `HttpOnly`/`SameSite=Strict` session cookie
  (`lib/adminAuth.ts`) scoped to `/api/admin`. Rate-limited (10 attempts /
  15 min / IP). The `/admin` page shell itself is publicly reachable (no
  sensitive data is server-rendered into it) — actual protection is on the
  `/api/admin/*` routes it calls.
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
| `CA_SKIP_PUBLIC_DISPLAY_FILTER` | Server | Debug-only escape hatch (`"true"`) to bypass the `public_display` filter while verifying the CA bundle name — never set in production |
| `ADMIN_PASSWORD` | Server | Admin dashboard password. **Required in production** — the app refuses to start without it rather than falling back to the dev default |
| `NEXT_PUBLIC_CA_BASE_URL` | Client | Public CA base URL (non-secret only) |

> **Never** use `NEXT_PUBLIC_` for `CA_USERNAME`, `CA_PASSWORD`, or `CA_API_KEY` — those values get bundled into client JS.

---

## Auth & Security

- **Admin auth**: `POST /api/admin/auth` verifies the password (timing-safe
  compare) against `ADMIN_PASSWORD` and issues an HMAC-signed session
  cookie; `verifyAdminSession()` gates `/api/admin/sync` and the session
  check itself. Rate-limited per-IP (in-memory, resets on restart —
  acceptable for a single-admin tool per the code comment in
  `lib/adminAuth.ts`).
- **`ADMIN_PASSWORD` default**: `lib/adminAuth.ts` **refuses to start** (throws on module load) if `NODE_ENV=production` and `ADMIN_PASSWORD` is unset — it no longer silently falls back to `"uva-fashion-admin"` in production. Local dev still gets the default for convenience.
- **CA credentials**: Server-only `CA_*` env vars. `NEXT_PUBLIC_CA_*` fallbacks exist but expose secrets — avoid in production.
- **Security headers + CSP**: implemented in `middleware.ts` on every request — strict nonce-based `Content-Security-Policy` (`strict-dynamic`, `frame-ancestors 'none'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Public-display filtering**: `CollectiveAccessClient.isPublic()` restricts synced garments to CA records flagged `public_display` (see Data Flow) — mid-cataloguing/unpublished records are no longer served through `/api/garments`, `/api/search`, or any page.
- `robots.txt` disallows `/admin`.
- `poweredByHeader: false` in Next.js config.
- Export/print paths use `escapeHtml` to prevent XSS.
- Favorites, saved searches, analytics stored in `localStorage` only (no server persistence).

### Recommended (not yet implemented)
- Network-level restriction of `/admin` and `/api/admin/*` to VPN/internal (defense-in-depth beyond the session auth above)
- Persisting the login rate limiter outside process memory if this ever moves to a multi-instance/serverless-per-request deployment (currently fine for a single long-running Node process)

---

## Known Issues

| Issue | Location | Notes |
|-------|----------|-------|
| Image fetching skipped during hydration | `lib/garments.ts` | Prevents hydration hangs; images loaded separately |
| `public_display` bundle name unverified against a live CA install | `lib/collectiveAccess.ts` (`isPublic()`) | Guessed as `ca_objects.web_display_settings` by naming-convention analogy to `ca_objects.web_narrative` — confirm against the real profile; a startup warning fires if the filter hides every synced object |
| Login rate limiter is in-memory | `lib/adminAuth.ts` | Resets on process restart — fine for the current single-process deployment, revisit if this ever runs multi-instance |

---

## Development

```bash
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
- **Removed `app/api/admin/ca-test/route.ts`**: a development-only debug endpoint for inspecting the raw CA login/auth flow. It accepted the admin password as a `?password=` query param (bypassing rate limiting and leaking into logs/history), and several `?debug=` branches echoed the live CA `authToken`/session cookie back in the response. It wasn't linked from any UI. If similar debugging is needed again, gate it behind `NODE_ENV !== 'production'` and never accept secrets via query string.
- **Added `public_display` filtering** (`CollectiveAccessClient.isPublic()`): the CA profile's Web Display Settings container was already designed to gate unpublished/mid-cataloguing records from the public site, but the frontend never actually read it — every object CA returned was served regardless of status. Fixed by filtering on `public_display` before caching, fail-closed. See the Known Issues entry above re: verifying the bundle name against the live install.
