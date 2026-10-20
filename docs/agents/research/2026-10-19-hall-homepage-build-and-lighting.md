---
date: 2026-10-19T23:34:44-04:00
researcher: mattkoom11
git_commit: d059233a6692d915e323b4df238f885a306308af
branch: feature/hall-first-visit
repository: UVA_Collectiveaccess_Frontend
topic: "How the museum hall homepage is built and lit (for the hall first visit spec)"
tags: [research, codebase, museum-hall, hallLayout, museum, lighting, react-three-fiber, MuseumHall, HallArchitecture, FlagshipGarment, HallControls]
status: complete
last_updated: 2026-10-19
last_updated_by: mattkoom11
---

# Research: How the museum hall homepage is built and lit

**Date**: 2026-10-19T23:34:44-04:00
**Researcher**: mattkoom11
**Git Commit**: d059233a6692d915e323b4df238f885a306308af
**Branch**: feature/hall-first-visit
**Repository**: UVA_Collectiveaccess_Frontend

## Research Question

How the museum hall homepage is built and lit, as context for [the hall first visit spec](../../superpowers/specs/2026-10-19-hall-first-visit-design.md): `lib/museum.ts`, `lib/hallLayout.ts`, `components/museum/*` (MuseumHall, HallArchitecture, FlagshipGarment, HallControls, MuseumHallLoader), how lights, materials and DPR are set, and the existing museum/hallLayout tests.

## Summary

The homepage (`app/page.tsx`) renders `MuseumHallLoader` with `intro`. The loader checks WebGL and reduced motion on the client and either redirects to `/collection` or dynamically imports `MuseumHall` (no SSR).

`MuseumHall` builds its scene from two pure layers:

1. `buildMuseumLayout` (`lib/museum.ts`) sorts garments into four fixed era wings. Each garment becomes a flagship, a lightbox or unplaced.
2. `buildHallLayout` (`lib/hallLayout.ts`) turns those wings into world positions: wing z-ranges, platform heights, flagship slots with inspection poses, lightbox slots, bounds and the start pose.

The scene is one R3F `<Canvas>`:
- **Fixed scene settings:** DPR `[1, 1.75]`, fov 62, R3F's default ACES Filmic tone mapping (no `flat` prop) with exposure 1.05, a near-black background and fog from 16 m to 75 m.
- **`HallArchitecture`:** room geometry, an ambient light and a hemisphere light, a scene-built `Environment` of four `Lightformer` strips, an instanced ceiling "spot grid" of unlit discs, and the stepped runway.
- **One `FlagshipGarment` per runway slot:** each has its own real `spotLight` (`GarmentSpotlight`), so the spotlight count equals the flagship count.
- **One `Lightbox` per wall slot:** unlit `meshBasicMaterial` panels.
- **Controls:** `HallControls` walks the camera and reports the wing index; `InspectControls` flies the camera to a flagship and hands over to `OrbitControls`.

The runway data today is 11 garments. All are flagships with `"era": "1980+"` and no date fields, so all 11 stand in Wing IV. Wings I–III are empty 6 m stubs, and the first flagship is about 36.5 m from the start position.

The existing tests (`lib/museum.test.ts` and `lib/hallLayout.test.ts`) are pure Vitest tests in a `node` environment. Together they hold 30 tests, all passing at this commit.

## Detailed Findings

### Entry point and loader

- [`app/page.tsx:31-35`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/app/page.tsx#L31-L35): `HomeRoute` fires `hydrateGarmentsFromCA()` without awaiting it, then renders `<MuseumHallLoader garments={getAllGarments()} intro />`. The page is `force-dynamic`. `intro` is set only here; no other route renders the hall.
- [`components/museum/MuseumHallLoader.tsx:25`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/MuseumHallLoader.tsx#L25): `MuseumHall` is loaded with `next/dynamic` (`ssr: false`), with an "Opening the galleries" placeholder.
- [`MuseumHallLoader.tsx:27-40`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/MuseumHallLoader.tsx#L27-L40): `canShowHall()` is computed once per page load (module-level cache). It is false when `(prefers-reduced-motion: reduce)` matches or neither `webgl2` nor `webgl` can be created. The probe context is released via `WEBGL_lose_context`.
- [`MuseumHallLoader.tsx:47-53`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/MuseumHallLoader.tsx#L47-L53): `useSyncExternalStore` returns `null` on the server and during hydration. `false` triggers `router.replace("/collection")`. Anything other than `true` shows the placeholder.
- [`MuseumHallLoader.tsx:56-67`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/MuseumHallLoader.tsx#L56-L67): `MuseumHall` sits inside an `ErrorBoundary` whose fallback is "The galleries are unavailable right now" plus a link to `/collection`.

### `lib/museum.ts`: wing assignment

- [`WINGS` (lines 10-15)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/museum.ts#L10-L15): four fixed `{ era, numeral, label }` entries in chronological order: `pre-1920`/I, `1920-1950`/II, `1950-1980`/III, `1980+`/IV. Labels use en dashes (`1920–1950`).
- [`MuseumLayout` (lines 22-27)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/museum.ts#L22-L27): `{ wings: Wing[]; unplaced: Garment[] }`. `Wing` extends `WingDefinition` with `flagships` and `lightboxes`.
- **Model URL helpers:**
  - [`pickPreviewModelUrl` / `getPreviewModelUrl` (lines 33-42)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/museum.ts#L33-L42): the `web_preview` role first, then any non-`archival_master` file, then the legacy `model3d_url` / `modelUrl` fields.
  - [`getDetailModelUrl` (lines 45-48)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/museum.ts#L45-L48): the `full_detail` role, falling back to the preview.
- [`isFlagship` (lines 55-57)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/museum.ts#L55-L57): `featuredOnRunway === true` and a preview URL exists.
- [`getEra` (lines 63-65)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/museum.ts#L63-L65): a private wrapper around `getEraFromDecade(decade, yearApprox, date, era)` in [`types/garment.ts:89-112`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/types/garment.ts#L89-L112).
  - An explicit `era` wins. Otherwise the year comes from `yearApprox`, else `parseInt(date)`, else a `/(\d{4})s/` match on `decade`.
  - With no year it returns `undefined`.
  - Year thresholds: < 1920, < 1950, < 1980, else `1980+`.
- **Sorting:**
  - [`byYearThenLabel` (lines 78-83)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/museum.ts#L78-L83): undated garments go last, ties broken by `label.localeCompare`.
  - [`byRunwayOrder` (lines 86-91)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/museum.ts#L86-L91): `runwayOrder` first (missing counts as +∞), then `byYearThenLabel`.
- [`buildMuseumLayout` (lines 99-124)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/museum.ts#L99-L124):
  - Always creates all four wings.
  - For each garment, no era → `unplaced`; else flagship → `wing.flagships`; else has a photo → `wing.lightboxes`; else → `unplaced`.
  - Flagships are then sorted with `byRunwayOrder` and lightboxes with `byYearThenLabel`.
  - The era check comes before the flagship check, so an undated flagship lands in `unplaced`.

### `lib/hallLayout.ts`: world positions

**Coordinate system** ([lines 4-6](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/hallLayout.ts#L4-L6)): meters. The visitor walks toward −z in an aisle at +x, beside a raised runway centred on x = 0. Wing I starts at z = 0. The entrance lobby is z ∈ (0, `ENTRANCE_DEPTH` = 8].

**Exported constants** ([lines 10-23](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/hallLayout.ts#L10-L23)):

| Constant | Value |
|---|---|
| `EYE_HEIGHT` | 1.6 |
| `HALL_HEIGHT` | 6 |
| `ENTRANCE_DEPTH` | 8 |
| `RUNWAY_WIDTH` | 2.4 |
| `AISLE_MIN_X` / `AISLE_MAX_X` | 1.9 / 6.1 |
| `RIGHT_WALL_X` / `LEFT_WALL_X` | 7 / −3.4 |
| `PLATFORM_BASE_HEIGHT` | 0.35 |
| `PLATFORM_STEP` | 0.2 |
| `FLAGSHIP_HEIGHT` | 1.7 |
| `LIGHTBOX_WIDTH` / `LIGHTBOX_HEIGHT` | 1.1 / 1.4 |

**Private constants** ([lines 25-35](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/hallLayout.ts#L25-L35)):

| Constant | Value |
|---|---|
| `WING_GAP` | 3 |
| `BACK_WALL_MARGIN` | 3 |
| `MIN_WING_LENGTH` | 14 |
| `EMPTY_WING_LENGTH` | 6 |
| `FLAGSHIP_SPACING` | 6 |
| `LIGHTBOX_SPACING` | 1.6 |
| `LIGHTBOX_MARGIN` | 1 |
| `LIGHTBOX_ROW_Y` | `[1.55, 3.15]` |
| `WALL_INSET` | 0.06 |

**Types** ([lines 37-66](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/hallLayout.ts#L37-L66)):
- `FlagshipSlot { garment, position, rotationY, inspect: { position, target } }`
- `LightboxSlot { garment, position, rotationY, wall }`
- `HallWing extends Wing { index, zStart, zEnd, platformHeight, flagshipSlots, lightboxSlots }`
- `HallLayout { wings, hallEndZ, bounds, start: { position, yaw } }`

**Wing length** ([`wingLength`, lines 78-84](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/hallLayout.ts#L78-L84)): an empty wing is `EMPTY_WING_LENGTH`. Otherwise the length is `max(MIN_WING_LENGTH, flagships × FLAGSHIP_SPACING, lightboxColumns × LIGHTBOX_SPACING + 2 × LIGHTBOX_MARGIN)`, with 4 lightboxes per column (`COLUMN_SLOTS`, lines 71-76: right row 0, right row 1, left row 0, left row 1).

**Flagship placement** ([`placeFlagships`, lines 86-101](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/hallLayout.ts#L86-L101)):
- Garments are spaced evenly at `z = zStart − (i + 0.5) × length / count`, at `[0, platformHeight, z]`.
- `rotationY = π/2`, because model fronts face +z and are turned to face the aisle.
- Inspection camera at `[AISLE_MIN_X + 0.4, platformHeight + 1.25, z]`, targeting `[0, platformHeight + FLAGSHIP_HEIGHT/2, z]`.
- The function takes a `Wing`, but reads only `wing.flagships`.

**Lightbox placement** ([`placeLightboxes`, lines 103-117](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/hallLayout.ts#L103-L117)): columns advance along −z from `zStart − LIGHTBOX_MARGIN`. Panels are inset from the wall and face into the hall: −π/2 on the right wall, +π/2 on the left.

**Whole layout** ([`buildHallLayout`, lines 120-147](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/hallLayout.ts#L120-L147)):
- A running `zStart` begins at 0. For each wing (by index), `platformHeight = PLATFORM_BASE_HEIGHT + index × PLATFORM_STEP` and `zEnd = zStart − length`. The next wing starts at `zEnd − WING_GAP`.
- `hallEndZ = lastWing.zEnd − BACK_WALL_MARGIN`.
- `bounds = { minX: AISLE_MIN_X, maxX: AISLE_MAX_X, minZ: hallEndZ + 1, maxZ: ENTRANCE_DEPTH − 1 }`.
- `start = { position: [4, EYE_HEIGHT, 6.5], yaw: 0 }` (aisle centre, 1.5 m in from the entrance wall, looking down −z).

**Wing lookup** ([`wingIndexAt`, lines 153-159](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/hallLayout.ts#L153-L159)): `z > 0` → −1 (lobby). Otherwise it scans from the last wing backwards for the first one with `z <= zStart`, so the gap after a wing still counts as that wing. The fallback is −1. The literal −1 is also used as a sentinel in `MuseumHall` (`useState(-1)`, `shownWingIndex >= 0`, `wingIndex < 0`) and as `currentWing`'s initial `null` in `HallControls`.

**Helpers:** [`clampToBounds` (lines 161-164)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/hallLayout.ts#L161-L164) and [`fitToHeight` (lines 176-182)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/hallLayout.ts#L176-L182). `fitToHeight` scales a bounding box to a target height, centres it in x/z and puts its base at y = 0; a box with zero height gets scale 1.

#### Concrete layout for the current data

All 11 runway garments carry `"era": "1980+"` and no `decade`, `date`, `yearApprox` or `runwayOrder`, so all 11 are Wing IV flagships, sorted by label. Running the functions above on that data gives:

| Segment | zStart → zEnd | Length | Platform height |
|---|---|---|---|
| Lobby | 8 → 0 | — | — |
| Wing I (empty) | 0 → −6 | 6 | 0.35 |
| Wing II (empty) | −9 → −15 | 6 | 0.55 |
| Wing III (empty) | −18 → −24 | 6 | 0.75 |
| Wing IV (11 flagships) | −27 → −93 | max(14, 66) = 66 | 0.95 |
| Back wall | `hallEndZ` = −96 | — | — |

- Flagships stand at z = −30, −36, …, −90.
- The start pose is at z = 6.5, so the nearest flagship is 36.5 m away and the farthest 96.5 m.
- The scene fog ([`MuseumHall.tsx:110`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/MuseumHall.tsx#L110)) runs from 16 m to 75 m.

### `MuseumHall`: scene and overlay state

- [Line 42](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/MuseumHall.tsx#L42): `layout = useMemo(() => buildHallLayout(buildMuseumLayout(garments)), [garments])`.
- **State** (lines 43-49):
  - `wingIndex` (−1 initially), `inspection: { slot, phase: "enter" | "exit" } | null`, `photo`, `ready`, `introDismissed`.
  - Refs: `walkTargetRef` (Vector3 | null, shared with `HallControls`) and `returnPoseRef` (shared with `InspectControls`).
- **Derived values** (lines 51-55):
  - `walking = !inspection && !photo`.
  - `inspecting` is the slot while the phase is `enter`.
  - `shownWingIndex` follows the inspected garment's z via `wingIndexAt` while inspecting, and `wingIndex` otherwise.
- **Escape** (lines 61-69) closes the photo dialog, else switches the inspection to `exit`.
- [Floor click (lines 71-75)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/MuseumHall.tsx#L71-L75): ignored when not walking or when `e.delta > 6` px. Otherwise it sets `walkTargetRef` to the clamped point at eye height.
- **Intro:**
  - `showIntro = intro && ready && !introDismissed && wingIndex < 0 && walking` (line 86).
  - `enterGalleries` (lines 88-91) dismisses the intro and sets a walk target at `[start.x, EYE_HEIGHT, -2]`, inside Wing I.
- [**Canvas** (lines 98-108)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/MuseumHall.tsx#L98-L108):
  - `camera={{ fov: 62, near: 0.05, far: 140, position: layout.start.position, rotation: [0, layout.start.yaw, 0] }}`. Passing a rotation stops R3F from aiming the camera at the origin.
  - **`dpr={[1, 1.75]}`**; `gl={{ antialias: true, powerPreference: "high-performance" }}`; `style={{ touchAction: "none" }}`.
  - `onCreated` sets `gl.toneMappingExposure = 1.05` and `setReady(true)`.
  - No `shadows` prop is passed, so no shadow maps are rendered.
- **Scene background** (lines 109-110): `<color attach="background" args={["#0b0b0c"]} />` and `<fog attach="fog" args={["#0b0b0c", 16, 75]} />`.
- **Scene children** (lines 112-139):
  - `HallArchitecture`.
  - A `FlagshipGarment` per flagship slot, keyed by garment id, with `inspecting` true for the inspected garment.
  - A `Lightbox` per lightbox slot.
  - `HallControls` with `enabled={walking}`.
  - `InspectControls` when an inspection exists, keyed by `${id}-${phase}` so it remounts per phase.
- **Location label** (lines 143-156): `aria-live="polite"`, top-left, hidden while the intro shows. It reads "Entrance", or `Wing {numeral} · {label}` with a second line `{n} on the runway · {m} on the walls`.
- **Intro panel** (lines 158-193): rendered only when `intro`. While `showIntro` it is a gradient panel with the eyebrow, the H1 "Step into the archive.", a paragraph, an "Enter the galleries →" button and a "Browse the collection" link. Otherwise it collapses to `sr-only` (the H1 stays for screen readers).
- **Controls hint** (lines 195-204): shown when `walking && ready && !showIntro`, with separate fine- and coarse-pointer wording via Tailwind's `pointer-coarse:` variant.
- **Overlays** (lines 206-264): the inspection placard aside, with a "Back to the hall" button (`autoFocus`); the photo `role="dialog"`; and the spinner while `!ready`.
- [**Screen-reader list** (lines 267-280)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/MuseumHall.tsx#L267-L280): a `<nav aria-label="Garments in the hall" className="sr-only">` with an `<h2>Wing {numeral}, {label}</h2>` per wing and links to each garment's record, flagships first.

### `HallArchitecture`: room, lights and materials

File: [`components/museum/HallArchitecture.tsx`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/HallArchitecture.tsx)

**Lights** (lines 99-100). These are the only global light sources:
- `<ambientLight intensity={0.3} />`
- `<hemisphereLight args={["#ffffff", "#1a1a1c", 0.55]} />` (sky white, ground near-black, intensity 0.55)

**Environment** (lines 104-117): drei `<Environment resolution={128} environmentIntensity={0.7}>`, built in-scene so nothing is fetched. Its contents are a `#0b0b0c` background and four `Lightformer` rects at x ∈ {−2.2, 0, 2.2, 4.4}, y = 5, rotated to face down, `scale={[0.35, 80, 1]}`, `intensity={2}`, `color="#fff6ea"`. The environment applies to every `MeshStandardMaterial` in the scene, which is where the glossy floor and runway reflections come from.

**Geometry and materials.** All are `meshStandardMaterial` unless noted. The room spans x from −3.4 to 7 and z from 8 to `hallEndZ`.

| Element | Lines | Color | Roughness | Metalness | Notes |
|---|---|---|---|---|---|
| Floor plane | 120-127 | `#3a3a3e` | 0.32 | 0.2 | `onClick={onFloorClick}` |
| Ceiling plane | 129-132 | `#0b0b0c` | 1 | — | — |
| Left, right, entrance and back walls | 134-149 | `#1e1e21` | 0.9 | — | Planes, 6 m tall |
| Runway body (per wing) | 67-70 | `#232326` | 0.6 | 0.1 | Box, `RUNWAY_WIDTH × h × length` |
| Runway top (per wing) | 71-74 | `#6e6e73` | 0.22 | 0.25 | Plane 5 mm above the box; glossy |
| Runway lit edge (per wing) | 76-79 | `#c4c4c8` | — | — | `meshBasicMaterial`, `toneMapped={false}`, 4 cm strip on the aisle side |
| Ceiling spot discs | 47-50 | `#fffaf0` | — | — | `meshBasicMaterial`, `toneMapped={false}`, `circleGeometry(0.055, 12)` |

**Spot grid** ([`SpotGrid`, lines 23-52](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/HallArchitecture.tsx#L23-L52)):
- One `instancedMesh` with `frustumCulled={false}`; matrices are set in `useLayoutEffect`.
- The grid runs at 1.1 m spacing, from x = −2.8 to 6.4 and from `ENTRANCE_DEPTH − 0.5` down to `hallEndZ + 0.5`, at y = `HALL_HEIGHT − 0.01`.
- With the current layout that is 9 columns × about 94 rows ≈ 850 instances in a single draw call.
- These discs emit no light; they are unlit glowing dots.

**Runway steps** ([`RunwaySteps`, lines 56-85](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/HallArchitecture.tsx#L56-L85)):
- One group per wing, keyed by `wing.era`.
- Wing 0 starts at `RUNWAY_START_Z = 0.5`. Each later wing starts at the previous wing's `zEnd`, so its platform also covers the gap before it at the new height. The last wing extends to `hallEndZ + 1`.
- This is the only place the runway's segment boundaries are computed.

### `FlagshipGarment`: models and the per-garment spotlight

File: [`components/museum/FlagshipGarment.tsx`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/FlagshipGarment.tsx)

- **`FittedModel`** (lines 14-19): `useGLTF(url)`, then `scene.clone(true)`, then `fitToHeight(Box3.setFromObject(model), FLAGSHIP_HEIGHT)`. It renders a `<primitive>` with that scale and offset. The GLB's own materials are used unchanged; no material overrides are applied.
- **`Placeholder`** (lines 22-29): a cylinder (`0.18`/`0.32` radius, `FLAGSHIP_HEIGHT` tall), `#1e1e21`, roughness 0.8. It is shown while loading and on load error.
- [**`GarmentSpotlight`** (lines 32-53)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/FlagshipGarment.tsx#L32-L53):
  - A target `Object3D` is created once in `useState`, placed at `[0, FLAGSHIP_HEIGHT × 0.55, 0]` via `<primitive>`, and assigned to `light.target` in `useLayoutEffect`.
  - `<spotLight position={[0.9, HALL_HEIGHT − 0.3, 0.4]} angle={0.42} penumbra={0.6} intensity={45} distance={12} decay={2} color="#fff6ea" />`, with no `castShadow`.
  - Positions are local to the slot group, which is rotated by `slot.rotationY = π/2`.
- **Composition** (lines 79-101):
  - The outer `<group position={slot.position} rotation={[0, slot.rotationY, 0]}>` holds `GarmentSpotlight` and an inner group rotated by `model3d_rotationY` (degrees → radians, line 66).
  - The inner group carries the click handler (ignored when `e.delta > 6`, otherwise `stopPropagation` and then `onSelect(slot)`) and pointer cursor handlers.
  - Inside it: `ErrorBoundary(Placeholder)` → `Suspense(Placeholder)` → the preview model, or, while inspecting with a different `full_detail` URL, a nested `Suspense` that keeps the preview until the detail model loads.
- **Light count:** one real `SpotLight` per mounted flagship. With today's data that is 11 spotlights plus the ambient and hemisphere lights, so the forward-rendered standard-material shaders include 11 spot lights. Each `FlagshipGarment` is always mounted; no distance-based culling or unmounting is applied.

### `Lightbox`

File: [`components/museum/Lightbox.tsx`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/Lightbox.tsx)

- **Distance check** (lines 39-43): runs every 20 frames (`CHECK_EVERY_FRAMES`). When the camera comes within `LOAD_DISTANCE` = 22 m, `near` flips true and stays true.
- **Texture loading** (lines 45-68): `TextureLoader().setCrossOrigin("anonymous")`, sRGB color space, disposal on cancel or unmount. Errors are swallowed and the panel stays blank.
- **Meshes** (lines 94-108):
  - A frame box: `meshStandardMaterial` `#141416`, roughness 0.5, metalness 0.3.
  - A backlit panel: `meshBasicMaterial`, `toneMapped={false}`, `#d9d4c8` before the photo loads and `#0b0b0c` behind a loaded photo.
  - The photo plane: `meshBasicMaterial map`, `toneMapped={false}`, contain-scaled.
- The panels are unlit; the scene lights only affect the frame box.

### `HallControls`: walking and wing reporting

File: [`components/museum/HallControls.tsx`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/HallControls.tsx)

- **Constants** (lines 8-13): `LOOK_SPEED` 0.0032 rad/px, `MAX_PITCH` 1.1, `WALK_SPEED` 3.2 m/s, `RUN_MULTIPLIER` 2 (Shift), `GLIDE_RATE` 3.5, `MAX_GLIDE_SPEED` 9 m/s.
- **Props:** `layout`, `enabled`, `walkTargetRef`, `onWingChange`.
- **Re-enable** (lines 56-62): when `enabled` becomes true, yaw and pitch are re-read from the camera's current quaternion (YXZ order) and `walkTargetRef` is cleared. This is how control resumes from wherever the camera was left: the Canvas start pose at first, or the pose an inspection flew back to.
- **Drag-to-look** (lines 64-97): `pointerdown` on the canvas (left button), with `pointermove`, `pointerup` and `pointercancel` on `window`. It uses "grab the world" signs and no pointer lock.
- **Keys** (lines 99-127): WASD and arrows by `e.code`. Typing targets and modifier combos are ignored, and keys are released on window `blur`.
- [**`useFrame`** (lines 131-175)](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/HallControls.tsx#L131-L175):
  - Returns immediately when `!enabled`. `dt` is capped at 0.1 s.
  - Key movement is yaw-relative and clears the walk target. Otherwise it eases toward the walk target (exponential step capped at `MAX_GLIDE_SPEED`).
  - Every frame it clamps to `bounds`, forces `y = EYE_HEIGHT` and sets `camera.rotation` from pitch and yaw.
  - It calls `onWingChange` only when `wingIndexAt` changes.
  - While enabled, it overwrites camera position and rotation every frame. While disabled, it does not touch the camera.
- Nothing in it reads `sessionStorage` or knows about the intro.

### `InspectControls`: the existing camera-flight pattern

File: [`components/museum/InspectControls.tsx`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/components/museum/InspectControls.tsx)

- **Setup** (lines 51-63): records the `from` pose. On `enter` it stores `from` into `returnPoseRef` and builds `to` from `Matrix4.lookAt(inspect.position, inspect.target, camera.up)`. On `exit`, `to` is the stored return pose.
- **Flight duration:** `FLIGHT_SECONDS = 0.9`, or 0 if `prefers-reduced-motion` matches (lines 26-28, 62).
- **`useFrame`** (lines 65-77): advances `t`, applies `easeInOut` (quadratic, line 24), then `lerpVectors` for position and `slerpQuaternions` for rotation. At `t >= 1` it marks the flight done, then either `setArrived(true)` (enter) or `onExited()` (exit).
- **After arrival** (lines 81-92): renders drei `OrbitControls` (target = `inspect.target`, no pan, damping 0.08, distance 0.25–3.5, polar 0.2–1.75).
- It is the only existing time-based camera animation in the hall. It uses a ref-held flight object advanced in `useFrame` and remounts per phase via `key`.

### Fonts, CSP, browser APIs

- **Fonts:** `next/font/google` in [`app/layout.tsx:18-37`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/app/layout.tsx#L18-L37).
  - Bodoni Moda (normal and italic) → `--font-display`.
  - IBM Plex Sans → `--font-body`.
  - IBM Plex Mono (400, 500) → `--font-plex-mono`.
  - `app/globals.css:33-35` maps them to `--font-sans`, `--font-serif` (`var(--font-display), Georgia, serif`) and `--font-mono`.
  - `next/font` self-hosts the files, generates hashed family names and exposes them only through these CSS variables.
- **CSP** in `proxy.ts`: `img-src 'self' data: blob: https: http:` (line 27), `font-src 'self' data:` (line 31), `connect-src 'self' blob:` (line 37), `worker-src blob:` (line 39).
- **Existing browser-API usage:**
  - No `CanvasTexture`, `document.fonts`, or `navigator.hardwareConcurrency` anywhere in `app/`, `components/`, `lib/` or `hooks/`.
  - `sessionStorage` is used only in `components/layout/PWAInstallPrompt.tsx:49,53` (`pwa-prompt-dismissed`, without try/catch).
  - `matchMedia("(pointer: coarse)")` appears in `components/garments/ARViewButton.tsx:113`.
  - `matchMedia("(prefers-reduced-motion: reduce)")` appears in `MuseumHallLoader.tsx:33` and `InspectControls.tsx:27`.

### Data: the runway garments

`data/garments.json` holds 11 entries, all `featuredOnRunway`, all `"era": "1980+"`, none with `decade`, `date`, `yearApprox` or `runwayOrder`. Their ids, preview files and `model3d_rotationY` values:

| id | Preview file | `model3d_rotationY` |
|---|---|---|
| demo-testdress0 | `/models/testdress0-repaired.glb` | 135 |
| demo-testdress1 | `/models/testdress1.glb` | 0 |
| demo-testdress2 | `/models/testdress2.glb` | 225 |
| demo-testdress3 | `/models/testdress3.glb` | 270 |
| demo-testdress4 | `/models/testdress4.glb` | 180 |
| dr-2023-17 | `/models/dr-2023-17.glb` | 0 |
| dr-2023-323 | `/models/dr-2023-323.glb` | −90 |
| ens-2023-14 | `/models/ens-2023-14.glb` | 180 |
| dr-2026-118 | `/models/dr-2026-118.glb` | 135 |
| dr-2025-432 | `/models/dr-2025-432.glb` | 0 |
| dr-2025-433 | `/models/dr-2025-433.glb` | 0 |

The preview GLBs in `public/models/` are 3.6–5.3 MB. `testdress0-lowpoly.glb` (9.8 MB) is also present but no entry uses it as its preview.

### Existing tests

**Config:** [`vitest.config.mts`](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/vitest.config.mts) uses `environment: "node"`, `include: ["**/*.test.ts"]` (no `.tsx` tests) and the `@` alias → repo root. `npm test` = `vitest run`. Both hall test files pass: 30 tests at this commit.

[**`lib/museum.test.ts`**](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/museum.test.ts):
- **Helpers:** a `makeGarment(overrides)` factory (lines 12-20), plus `PHOTO` and `MODEL` fixtures (lines 22-23).
- **`getPreviewModelUrl`** (4 tests): web_preview preferred, non-archival fallback, archival master never returned, legacy fields.
- **`getDetailModelUrl`** (2 tests).
- **`isFlagship`** (2 tests).
- **`getGarmentYear`** (1 test).
- **`buildMuseumLayout`** (7 tests):
  - always four wings in order (`I`–`IV`);
  - flagship vs. photo placement;
  - a featured garment without a 3D file hangs as a lightbox (uses `era: "1980+"` as a stand-in);
  - era derived from `decade`;
  - undated and nothing-to-show garments → `unplaced` (the undated case is a photo piece; line 130);
  - flagship order by `runwayOrder` then year;
  - lightbox order with undated last.

[**`lib/hallLayout.test.ts`**](https://github.com/mattkoom11/UVA_Collectiveaccess_Frontend/blob/d059233a6692d915e323b4df238f885a306308af/lib/hallLayout.test.ts):
- **Helpers:** a `garment(era, kind, overrides)` factory with an incrementing id (lines 18-30), and `layoutFor(garments) = buildHallLayout(buildMuseumLayout(garments))` (lines 32-34).
- **`buildHallLayout`** (8 tests):
  - four wings end to end, `wings[0].zStart === 0`, platform step per index, `hallEndZ` beyond the last wing;
  - **empty wing length `toBe(6)`** (line 50) and a non-empty wing ≥ 14;
  - flagship slot positions, facing and order;
  - the inspection viewpoint in the aisle;
  - lightbox walls and facing;
  - lightbox order;
  - a long wall of 200 photos fits inside its wing;
  - the start pose is in the lobby, in the aisle, with yaw 0.
- **`wingIndexAt`** (3 tests): −1 in the lobby (z = 3); each wing's midpoint gives its index; the gap counts as the wing being left.
- **`clampToBounds`** (1 test) and **`fitToHeight`** (2 tests).
- No tests exist for components. React and Three are not exercised in tests.

## Code References

- `app/page.tsx:31-35`: homepage renders `MuseumHallLoader` with `intro`
- `components/museum/MuseumHallLoader.tsx:27-53`: WebGL and reduced-motion gate, redirect, dynamic import
- `lib/museum.ts:10-15`: `WINGS` definitions
- `lib/museum.ts:99-124`: `buildMuseumLayout` (era check before flagship check)
- `types/garment.ts:89-112`: `getEraFromDecade`
- `lib/hallLayout.ts:25-35`: private spacing constants (`EMPTY_WING_LENGTH = 6`, `WING_GAP = 3`, `MIN_WING_LENGTH = 14`, `FLAGSHIP_SPACING = 6`)
- `lib/hallLayout.ts:86-101`: `placeFlagships`
- `lib/hallLayout.ts:120-147`: `buildHallLayout`
- `lib/hallLayout.ts:153-159`: `wingIndexAt`
- `components/museum/MuseumHall.tsx:98-110`: Canvas config (DPR, camera, exposure), background, fog
- `components/museum/MuseumHall.tsx:86-91`: intro visibility and "Enter the galleries"
- `components/museum/MuseumHall.tsx:143-156`: location label
- `components/museum/MuseumHall.tsx:267-280`: screen-reader garment list
- `components/museum/HallArchitecture.tsx:99-117`: ambient, hemisphere, Environment and Lightformers
- `components/museum/HallArchitecture.tsx:23-52`: instanced ceiling `SpotGrid`
- `components/museum/HallArchitecture.tsx:56-85`: `RunwaySteps` (runway materials)
- `components/museum/FlagshipGarment.tsx:32-53`: `GarmentSpotlight` (one per flagship)
- `components/museum/HallControls.tsx:56-62,131-175`: pose pickup on enable; per-frame camera ownership
- `components/museum/InspectControls.tsx:51-77`: existing eased camera-flight pattern
- `lib/hallLayout.test.ts:50`: empty-wing length assertion (6)
- `vitest.config.mts`: node environment, `*.test.ts` only

## Architecture Documentation

- **Pure layout, thin components.** Placement logic lives in two pure modules (`lib/museum.ts` → `lib/hallLayout.ts`) that are unit tested in a node environment. The components read slot positions and render; they don't compute layout. The one exception is `RunwaySteps`, which derives platform extents from wing z-ranges.
- **Layout pipeline:** `Garment[]` → `buildMuseumLayout` (wing membership) → `buildHallLayout` (world positions) → `MuseumHall` (`useMemo`) → scene components.
- **Camera ownership by mode.**
  - `HallControls` owns the camera while `enabled` (walking) and re-reads the pose when re-enabled.
  - `InspectControls` owns it during an inspection, as a flight followed by `OrbitControls`.
  - `MuseumHall`'s `walking` flag is the switch between them.
- **Sentinel −1** for "not in a wing" is used across `wingIndexAt`, `MuseumHall` state and the overlay conditions.
- **No network assets for lighting.** The environment map is built from `Lightformer`s in the scene, and the glowing elements are `meshBasicMaterial` with `toneMapped={false}`.
- **Per-frame work patterns:**
  - `useFrame` with refs (`HallControls`, `InspectControls`).
  - Throttled distance checks every N frames (`Lightbox`).
  - Instancing for repeated geometry (`SpotGrid`).
- **Click vs. drag:** a shared `CLICK_TOLERANCE_PX = 6` on `e.delta`, duplicated in `MuseumHall`, `FlagshipGarment` and `Lightbox`.
- **Rendering settings in one place:** DPR, antialiasing, power preference, exposure, background and fog are all set on or directly under the `<Canvas>` in `MuseumHall.tsx`. There is no quality tiering; every device gets the same settings.

## Related Research

None. `docs/agents/research/` did not exist before this document. Related design docs:
- `docs/superpowers/specs/2026-10-19-hall-first-visit-design.md` (the spec this research supports)

## Open Questions

- The spec's banner textures are to be drawn "with the site's own serif and mono fonts after `document.fonts.ready`". The fonts come from `next/font`, which exposes them only as CSS variables (`--font-display`, `--font-plex-mono`) with generated family names. How a canvas 2D context resolves those names was not investigated.
- There are no component-level or rendering tests, and no fps measurement tooling, in the repo. The spec's frame-rate criterion has no existing harness to build on.
