---
date: 2026-10-23T17:46:45-04:00
researcher: mattkoom11
git_commit: 93d9e67266feb7986d692ba803e3ad5e6fd7980d
branch: main
repository: UVA_Collectiveaccess_Frontend
topic: "How garment orientation (model3d_rotationY) flows through the frontend, for an /admin/orientation review page"
tags: [research, codebase, orientation, model3d_rotationY, featuredOnRunway, Garment3DViewer, FlagshipGarment, hallLayout, museum, ARViewButton, admin, AdminAuthGate]
status: complete
last_updated: 2026-10-23
last_updated_by: mattkoom11
---

# Research: How garment orientation flows through the frontend

**Date**: 2026-10-23T17:46:45-04:00
**Researcher**: mattkoom11
**Git Commit**: 93d9e67266feb7986d692ba803e3ad5e6fd7980d
**Branch**: main
**Repository**: UVA_Collectiveaccess_Frontend

## Research Question

This document traces how garment orientation flows through the frontend. It covers:

- `model3d_rotationY` in `data/garments.json` and `types/garment.ts`.
- How `Garment3DViewer` (the −45° item-page offset), `FlagshipGarment` with `lib/hallLayout.ts` (runway, π/4) and `ARViewButton` apply it.
- How `lib/museum.ts` picks runway flagships (`featuredOnRunway`).
- The `AdminAuthGate` / `app/admin` pattern.
- The existing `app/api/admin` routes.

This is context for a planned feature: an admin-only `/admin/orientation` review page. It would show each garment in its runway pose (4:30) and its item-page pose (7:30). It would have ±45° and ±5° controls, plus an Approve button that writes `model3d_rotationY` and a new `orientationReviewed` flag to `garments.json` (dev server only). Unreviewed garments would be excluded from the runway, and all 12 existing garments would start unreviewed.

## Summary

`model3d_rotationY` is a per-garment yaw in **degrees**. Calibration chooses it so that the scan's front faces **+z** in model space. Three consumers read it, and each adds a different fixed offset:

| Consumer | Total yaw applied | Resulting pose (top-down, camera look direction = 12:00) |
|---|---|---|
| Runway: `FlagshipGarment`, using `slot.rotationY` from `hallLayout.ts` | `π/4` (slot) + `model3d_rotationY` | Front at **4:30**: toward the aisle (+x), angled back toward the approaching visitor (+z) |
| Item page: `Garment3DViewer` | `model3d_rotationY − 45°` | Front at **7:30**: 45° toward the camera's left |
| AR: `ARViewButton` via `modelViewerOrientation` | `model3d_rotationY` (no offset) | model-viewer `orientation="0deg 0deg <yaw>deg"` |

**Data source:**

- The value lives only in `data/garments.json`. That file is a static, build-time `import` in `lib/garments.ts:1`.
- The CollectiveAccess mapping does **not** populate `model3d_rotationY`, so CA-sourced garments get `undefined`, which consumers read as `0`.
- No code anywhere writes `data/garments.json`. The only fs write in the repo is the atomic tmp-and-rename write of `data/ca-garments-cache.json`.

**Runway selection:**

- `isFlagship()` is `featuredOnRunway === true && getPreviewModelUrl(g) !== undefined`.
- All 12 garments in `garments.json` are flagships today. None has an era or date field, so all 12 stand on the New Acquisitions stage.
- No `orientationReviewed` field exists anywhere in the codebase.

**Admin:**

- `/admin` is a client page wrapped in `AdminAuthGate`, which checks `GET /api/admin/auth` on mount.
- The real protection is `verifyAdminSession(req)` in each `/api/admin/*` route handler. The HMAC session cookie is scoped to `Path=/api/admin`.
- There are two routes: `auth` (GET/POST/DELETE) and `sync` (POST).

## Detailed Findings

### The field: `model3d_rotationY`

- [`types/garment.ts:65`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/types/garment.ts#L65) declares `model3d_rotationY?: number`. The comment reads "Degrees to spin the scan around its vertical axis so its front faces the camera/runway (scan exports have an arbitrary front direction baked in)".
- [`types/garment.ts:68`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/types/garment.ts#L68) declares `featuredOnRunway?: boolean`, documented as `CA web_display_settings.featured_on_runway`.
- There is no `orientationReviewed` (or similar) field.

**Current values in `data/garments.json`**. All 12 records have `featuredOnRunway: true` and a single `model3d_url`. No record has `models`, `era`, `date`, `decade` or `yearApprox`.

| id | model3d_url | model3d_rotationY |
|---|---|---|
| demo-testdress0 | /models/testdress0-repaired.glb | 135 |
| demo-testdress1 | /models/testdress1.glb | 0 |
| demo-testdress2 | /models/testdress2.glb | 225 |
| demo-testdress3 | /models/testdress3.glb | 270 |
| bd-2026-125 | /models/testdress4.glb | 180 |
| dr-2023-17 | /models/dr-2023-17.glb | 0 |
| dr-2023-323 | /models/dr-2023-323.glb | -90 |
| ens-2023-14 | /models/ens-2023-14.glb | 180 |
| dr-2026-118 | /models/dr-2026-118.glb | 135 |
| dr-2025-432 | /models/dr-2025-432.glb | 0 |
| dr-2025-433 | /models/dr-2025-433.glb | 0 |
| ens-2026-124 | /models/ens-2026-124.glb | 45 |

- Values are not normalized to a single range: both `270` and `-90` appear.
- Many records' `description` text records the calibration history. Examples:
  - dr-2023-17: "set to 45 … then corrected to 0 (45 deg clockwise from a top-down/turntable view…)".
  - ens-2026-124: "calibrated against DR.2026.118's confirmed 135".
- Calibration has been done by visual check or by headless Blender renders at 45° steps.

### Item page: `Garment3DViewer`

- [`Garment3DViewer.tsx:40-43`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/components/garments/Garment3DViewer.tsx#L40-L43): `VIEWER_INITIAL_ANGLE_OFFSET_DEGREES = -45`. The comment reads "garments open on a 3/4 turn — facing 45° toward the camera's left — on top of each garment's own calibrated front-facing offset".
- [`Garment3DViewer.tsx:213-216`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/components/garments/Garment3DViewer.tsx#L213-L216): `rotationY = ((garment?.model3d_rotationY ?? 0) + -45) * π / 180`.
- [`Garment3DViewer.tsx:83-111`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/components/garments/Garment3DViewer.tsx#L83-L111) describes `GarmentModel`:
  - It auto-fits the clone to `TARGET_MODEL_HEIGHT = 2`, centered in x and z, with its base on `GROUND_Y = -1`.
  - It wraps the `<primitive>` in `<group rotation={[0, rotationY, 0]}>`, so the yaw is applied about the model's centered vertical axis rather than composed with the recentering translation.
  - The comment at `:99-101` points to `RunwayGarmentMesh in Runway3D.tsx`. That file no longer exists in the repo.
- Camera: `PerspectiveCamera` at `[0, 1, 5]`, fov 50 (`:182`), with `OrbitControls` (`:183-193`). The camera sits on +z looking toward the origin. A front facing +z therefore faces the camera (6:00), and −45° turns it to 7:30.
- The viewer also takes `modelUrl` as a separate prop. Garment data reaches it through `garment`.

### Runway: `lib/hallLayout.ts` and `FlagshipGarment`

- [`hallLayout.ts:117-134`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/lib/hallLayout.ts#L117-L134): `placeFlagships` gives every slot `rotationY: Math.PI / 4`. The comment explains: "Model fronts face +z; turn them halfway to the aisle (+x), so with the visitor's walking direction (-z) at 12:00 they face 4:30".
  - Slots sit at `x = 0`, at the platform height, spread evenly in z across the segment.
  - The inspect pose is camera `[AISLE_MIN_X + 0.4, platformHeight + 1.25, z]`, targeting `[0, platformHeight + FLAGSHIP_HEIGHT/2, z]`.
- [`hallLayout.ts:136-150`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/lib/hallLayout.ts#L136-L150): lightbox slots use `rotationY` `±π/2` (facing into the hall). This is unrelated to `model3d_rotationY`.
- [`hallLayout.ts:240-246`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/lib/hallLayout.ts#L240-L246): `fitToHeight(box, targetHeight)` is a pure scale-and-offset that centers x and z and stands the model on y = 0. `FLAGSHIP_HEIGHT = 1.7` (`:23`).
- [`FlagshipGarment.tsx:14-19`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/components/museum/FlagshipGarment.tsx#L14-L19): `FittedModel` deep-clones the GLTF scene and applies `fitToHeight`.
- [`FlagshipGarment.tsx:42`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/components/museum/FlagshipGarment.tsx#L42): `facing = (model3d_rotationY ?? 0) * π / 180`.
- [`FlagshipGarment.tsx:56-58`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/components/museum/FlagshipGarment.tsx#L56-L58) nests two groups:
  - The outer group is `position={slot.position} rotation={[0, slot.rotationY, 0]}` (π/4).
  - The inner group is `rotation={[0, facing, 0]}`, which also carries the click and hover handlers.
  - Both rotations are about Y, so the net yaw is `π/4 + model3d_rotationY`.
- While a garment is inspected, the `full_detail` model is swapped in when it differs from the preview (`:47`, `:71`). The swap does not change the rotation.
- Test: [`hallLayout.test.ts:92-104`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/lib/hallLayout.test.ts#L92-L104) asserts `slot.rotationY ≈ π/4` ("facing 4:30 toward the aisle").

### AR: `ARViewButton` and `lib/arScale.ts`

- [`arScale.ts:29-33`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/lib/arScale.ts#L29-L33): `modelViewerOrientation(rotationYDeg = 0)` returns `` `0deg 0deg ${rotationYDeg}deg` ``. model-viewer's `orientation` attribute is "roll pitch yaw".
- [`ARViewButton.tsx:195-205`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/components/garments/ARViewButton.tsx#L195-L205): `<model-viewer src={garment.model3d_url} … orientation={modelViewerOrientation(garment.model3d_rotationY)}>`. No 3/4 offset is added.
- `ARViewButton` renders nothing without `garment.model3d_url` (`:108`). It is mounted from `GarmentDetailClient.tsx:207` through `next/dynamic` (`ssr: false`, `:18`).

### Runway selection: `lib/museum.ts`

- [`museum.ts:36-51`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/lib/museum.ts#L36-L51) defines three helpers:
  - `pickPreviewModelUrl` (the `web_preview` model, else any model that is not `archival_master`).
  - `getPreviewModelUrl`, which falls back to `model3d_url || modelUrl`.
  - `getDetailModelUrl`.
- [`museum.ts:58-60`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/lib/museum.ts#L58-L60): `isFlagship(g) = g.featuredOnRunway === true && getPreviewModelUrl(g) !== undefined`. This is the single gate deciding whether a garment stands on the runway.
- [`museum.ts:103-131`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/lib/museum.ts#L103-L131) describes `buildMuseumLayout`:
  - A garment with no era is added to `acquisitions` if it is a flagship, and to `unplaced` otherwise.
  - A garment with an era goes into the wing's `flagships`, its `lightboxes` (if it has a photo) or `unplaced`.
  - Flagships are sorted by `runwayOrder`, then year, then label.
- `isFlagship` is used only inside `buildMuseumLayout` (`:113`, `:115`).
- Tests: `lib/museum.test.ts:76-78` covers the `isFlagship` truth table, and `:84-173` covers layout cases built on `featuredOnRunway: true`.

### Data source and write paths

The pipeline agent traced how garment data loads:

- `lib/garments.ts:1` loads the static JSON with `import garmentsData from "@/data/garments.json"`. It is bundled at build time and never read from disk at runtime.
- `getAllGarments()` (`lib/garments.ts:161-170`) returns the CA cache when CA is configured and the cache is populated. Otherwise it returns the static JSON with materials normalized.
- `hydrateGarmentsFromCA()` (`:107-151`) and `setCAGarmentsCache()` (`:154-159`) manage the CA cache. Its only setter caller is `app/api/admin/sync/route.ts:18`.
- `saveDiskCache` (`lib/garments.ts:36-52`) is the only fs write in the repo. It writes `data/ca-garments-cache.json` (gitignored) atomically through `${cacheFile}.${pid}.tmp` and `renameSync`. Nothing writes `data/garments.json`.
- CA mapping (`lib/collectiveAccess.ts:494-531`):
  - `featuredOnRunway = isYesValue(web_display_settings.featured_on_runway)`, where `isYesValue` (`:37-44`) accepts `true`, `1`, `"1"`, `"true"` and `"yes"`.
  - `runwayOrder` comes from `homepage_order`.
  - `models` and `model3d_url` are mapped.
  - **`model3d_rotationY` is not mapped**: the file contains no `rotation` key.
- Homepage path:
  - `app/page.tsx` is `force-dynamic` and renders `<MuseumHallLoader garments={getAllGarments()} intro />` (a server-to-client prop).
  - `MuseumHall.tsx:87` computes `buildHallLayout(buildMuseumLayout(garments))` client-side in a `useMemo`.
  - `FlagshipGarment` is rendered at `MuseumHall.tsx:207-216` and `Lightbox` at `:217-221`.

### Admin pattern

- [`app/admin/page.tsx:1-18`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/app/admin/page.tsx#L1-L18):
  - The page is `"use client"`. `AdminPage` returns `<AdminAuthGate><AdminDashboard /></AdminAuthGate>`.
  - The dashboard calls `getAllGarments()` client-side (`:27`). In a client bundle that resolves to the static JSON.
  - It POSTs to `/api/admin/sync` with `credentials: "same-origin"` (`:35`).
  - Content is wrapped in `PageLayout`, using `archive-*` Tailwind tokens and lucide icons.
- [`components/admin/AdminAuthGate.tsx`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/components/admin/AdminAuthGate.tsx):
  - On mount it calls `GET /api/admin/auth` (`:19-23`). It shows a password form that POSTs to the same route (`:25-43`).
  - Once authenticated, it renders the children plus a fixed "Sign out" button that sends `DELETE` (`:45-49`, `:59-74`).
  - It takes an optional `onSignOut` callback.
- [`lib/adminAuth.ts`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/lib/adminAuth.ts):
  - The password is resolved lazily; the function throws in production when the password is unset (`:16-25`).
  - Session tokens have the form `<ts>.<hmac>` and last 4 h (`:29-63`).
  - `verifyAdminSession(req)` (`:69-72`) checks the session.
  - The cookie is `HttpOnly; SameSite=Strict; Path=/api/admin`, and adds `Secure` in production (`:101-105`).
  - Login attempts are rate-limited per IP and globally (`:116-152`).
- Routes:
  - [`app/api/admin/auth/route.ts`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/app/api/admin/auth/route.ts): GET checks the session (200 or 401), POST logs in (rate-limited, sets the cookie) and DELETE clears the cookie.
  - [`app/api/admin/sync/route.ts`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/93d9e67266feb7986d692ba803e3ad5e6fd7980d/app/api/admin/sync/route.ts): POST returns 401 unless `verifyAdminSession`, then runs `syncGarmentsFromCA(0)`, then `setCAGarmentsCache`, and returns `{ ok, count }`, or 500 with `{ ok: false, error }`.
  - Both routes use the `NextRequest`/`NextResponse.json({ ok, … }, { status })` shape.
- `proxy.ts` sets the CSP on every route: `connect-src 'self' blob:` and `script-src 'nonce-…' 'strict-dynamic' 'unsafe-eval'`. Same-origin fetches to `/api/admin/*` and blob GLB textures are allowed.

### `NODE_ENV` gating that exists today

- `lib/garments.ts:15` defines `isDev = process.env.NODE_ENV !== "production"`, which gates logging.
- `lib/adminAuth.ts:19` (password fallback) and `:103` (the `Secure` flag) check `NODE_ENV === "production"`.
- `components/garments/ErrorBoundary.tsx:79` shows error details only in development.
- No route under `app/` is gated on `NODE_ENV`. The removed `ca-test` route is the precedent CLAUDE.md cites ("gate it behind `NODE_ENV !== 'production'`").

## Code References

- `types/garment.ts:65,68`: the `model3d_rotationY` and `featuredOnRunway` declarations
- `data/garments.json`: 12 records, all `featuredOnRunway: true`, each with a `model3d_rotationY`
- `components/garments/Garment3DViewer.tsx:43,103,213-216`: the −45° offset and the wrapping rotation group
- `components/museum/FlagshipGarment.tsx:42,56-58`: the nested slot yaw and the garment facing yaw
- `lib/hallLayout.ts:117-134`: `placeFlagships`, `rotationY: Math.PI / 4`
- `lib/hallLayout.ts:240-246`: `fitToHeight`
- `lib/arScale.ts:29-33`: `modelViewerOrientation`
- `components/garments/ARViewButton.tsx:203`: the AR orientation
- `lib/museum.ts:58-60`: `isFlagship`
- `lib/museum.ts:103-131`: `buildMuseumLayout`
- `lib/garments.ts:1,36-52,161-170`: the static import, the only fs write, and `getAllGarments`
- `lib/collectiveAccess.ts:494-531`: CA mapping (no rotation field)
- `app/admin/page.tsx`, `components/admin/AdminAuthGate.tsx`, `lib/adminAuth.ts`, `app/api/admin/{auth,sync}/route.ts`: the admin pattern
- `lib/hallLayout.test.ts:92-104`, `lib/museum.test.ts:76-173`: existing tests (Vitest, `node` env, `**/*.test.ts` only, per `vitest.config.mts`)

## Architecture Documentation

- **One stored angle and per-view constants.** The data holds a single calibrated "front faces +z" yaw. Each view adds its own presentation offset: the runway adds +45° through the slot, the item page adds −45° through a constant, and AR adds nothing. The two poses in the planned review page are therefore `rotationY + 45°` (runway, 4:30) and `rotationY − 45°` (item page, 7:30), each against the view's own camera convention.
- **Rotation about the centered axis.** Both renderers recenter the model (`fitToHeight` and the inline auto-fit) and apply yaw on an enclosing group. A changed angle spins the garment in place.
- **Pure layout and thin components.** `buildMuseumLayout` and `buildHallLayout` are pure and unit-tested in a `node` environment. Selection rules such as `isFlagship` live there, not in components.
- **Static data is compiled in.** Because `garments.json` is a module import, a change on disk reaches the app only through the module graph: dev-server hot reload or a rebuild. A running production server does not re-read it.
- **Admin is "page shell public, API gated".** The UI gate is cosmetic. Authorization happens per route through `verifyAdminSession`, and the cookie only reaches `/api/admin/*`.

## Related Research

- [2026-10-19-hall-homepage-build-and-lighting.md](2026-10-19-hall-homepage-build-and-lighting.md): hall layout, `FlagshipGarment`, lighting and the existing tests.

## Open Questions

- Whether model-viewer's yaw sign convention matches three.js's `rotation.y` (positive = counter-clockwise seen from above). The AR path passes the same degrees without conversion; the code does not say whether this was verified.
- `model3d_rotationY` is never sourced from CA. With CA configured and the cache populated, every garment would read `0`.
- The `Runway3D.tsx` comment in `Garment3DViewer.tsx:100-101` refers to a file that is no longer present.
