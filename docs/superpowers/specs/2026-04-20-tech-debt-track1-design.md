# Tech Debt — Track 1 Design
**Date:** 2026-04-20
**Status:** Approved

## Overview

Three targeted, isolated fixes to stabilize the foundation of the UVA Historic Fashion Archive. Each fix is scoped to a single file or layer with no cross-cutting changes.

---

## 1. Security Headers

### Problem
The following headers are recommended in CLAUDE.md but not yet implemented: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`, `Permissions-Policy`.

### Solution
Add all headers in `middleware.ts`. The root layout already sets `x-nonce` on every request specifically to enable a nonce-based CSP — wire that up.

### Headers to add
| Header | Value |
|--------|-------|
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Nonce-based; allow same-origin scripts, Google Fonts, CA base URL |
| `Permissions-Policy` | Disable camera, microphone, geolocation |

### Files changed
- `middleware.ts` — inject headers into every response

---

## 2. Materials Normalization

### Problem
The `materials` field on `Garment` is typed as `string | string[]`. This forces every consumer to handle both shapes, causing inconsistent rendering across the collection, detail, and compare pages.

### Solution
`normalizeMaterials()` already exists in `types/garment.ts`. Apply it at the single mapping point in `lib/garments.ts` where raw CA data is converted into `Garment` objects. All downstream consumers then receive a clean `string[]`.

### Files changed
- `lib/garments.ts` — call `normalizeMaterials(raw.materials)` during CA→Garment mapping
- `types/garment.ts` — tighten `materials` type to `string[]` (breaking change caught by TypeScript)

### Side effects
TypeScript will surface any remaining callers that pass `string` — fix those at the call site.

---

## 3. CA Hydration Reliability

### Problem
`hydrateGarmentsFromCA()` is `await`-ed in the root layout, meaning a slow or unreachable CA server blocks every page render until the 30s timeout fires. The disk cache covers warm restarts, but the first cold request after the cache expires still blocks.

### Solution
Change the root layout to fire `hydrateGarmentsFromCA()` as a **non-blocking void call**. Pages that need garment data call `getAllGarments()` which returns the disk cache or static fallback immediately. CA hydration completes in the background and populates the in-memory cache for subsequent requests.

```ts
// app/layout.tsx — before
await hydrateGarmentsFromCA();

// after
void hydrateGarmentsFromCA();
```

The existing deduplication guard (`hydrateInFlight`) and disk cache already handle concurrent requests and cold starts correctly — we just stop waiting on them at render time.

### Files changed
- `app/layout.tsx` — remove `await` from `hydrateGarmentsFromCA()` call

---

## Error Handling

- Security headers: no error states — they are set unconditionally.
- Materials normalization: `normalizeMaterials()` already handles null/undefined gracefully.
- CA hydration: the non-blocking change means failure is already silent; the existing `try/catch` and timeout guard remain in place.

---

## Testing

- Security headers: verify with browser devtools Network tab or `curl -I` on any page.
- Materials: check collection page and garment detail — materials should render consistently as arrays everywhere.
- CA hydration: confirm page load time improves when CA is unreachable; confirm garments still appear from disk/static cache.
