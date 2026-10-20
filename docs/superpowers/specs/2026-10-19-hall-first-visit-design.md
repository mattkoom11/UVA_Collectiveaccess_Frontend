# Hall First Visit Design
**Date:** 2026-10-19
**Status:** Approved (pending written-spec review)

## Overview

The homepage is the museum hall (`MuseumHall`, React Three Fiber). This spec makes the first visit to it worth staying for, mainly for public visitors and students on both phones and laptops:

1. **New Acquisitions stage:** undated 3D scans get their own lit stage at the start of the runway, instead of a fake `1980+` era.
2. **Coming-soon stubs:** empty era wings shrink to short stubs.
3. **Lighting:** dark room, pools of light on each garment, and a distinct light character per era ("Pools + wing character", option C of the brainstorm renders).
4. **Light budget and quality tier:** a fixed pool of real spotlights on the nearest garments, cheap fakes elsewhere, scaled to the device.
5. **Arrival shot:** a short camera glide into the hall on the first homepage visit of a session.

This is sub-project 1 of the frontend brainstorm. Runway show mode (2) and the shape map / "looks like this" (3) get their own specs. Bloom and post-processing are deferred.

### Constraints

- Stack: Next 16, React 19, three 0.181, @react-three/fiber 9, @react-three/drei 10, Vitest 4. No new dependencies.
- 11 runway garments today, all with GLBs (3.6–5.3 MB, 100k faces). The collection will grow, so per-frame lighting cost must not grow with garment count.
- None of the 11 has a real era yet; all carry the `1980+` placeholder. Eras may arrive slowly, so undated garments are a normal, lasting state.
- Visitors who prefer reduced motion, or have no WebGL, are already redirected to `/collection` by `MuseumHallLoader`; that stays.

### Success criteria

- From the entrance, a visitor sees lit garments up close, not a distant cluster at the far end.
- A garment with no era stands on the New Acquisitions stage and moves to its wing as soon as it gets an era, with no other change.
- Each era wing is recognisable by its light color and hanging numeral.
- The number of real lights is fixed per quality tier, independent of garment count.
- The phone tier holds near 60 fps with the current 11 garments in a phone-sized viewport.
- The arrival shot plays once per browser session and any input skips it to the same end state.

---

## 1. Data: drop the era placeholder

Remove `"era": "1980+"` from the 11 entries in `data/garments.json` (the placeholder was never a real date). No new fields. The `Garment` type already allows `era` to be absent.

## 2. Museum layout: the acquisitions group

`lib/museum.ts`:

- `MuseumLayout` gains `acquisitions: Garment[]`.
- In `buildMuseumLayout`, a garment with no era (`getEra` returns `undefined`) that `isFlagship` goes to `acquisitions`, sorted with `byRunwayOrder`. An undated garment that is not a flagship still goes to `unplaced` (Collection only), as today.
- Dated garments are unchanged.

## 3. Hall layout: stage and stubs

`lib/hallLayout.ts`:

- **Segments.** The runway is a sequence of segments: the New Acquisitions stage, then Wings I–IV. `HallLayout` gains `stage: HallStage | null`. `HallStage` has `zStart`, `zEnd`, `platformHeight` and `flagshipSlots`, placed with the same `placeFlagships` logic, with no lightboxes.
- **Stage geometry.** The stage starts at `z = 0` (where Wing I starts today), its length is `max(MIN_WING_LENGTH, count × FLAGSHIP_SPACING)`, and its platform is `PLATFORM_BASE_HEIGHT`. Wing I begins `WING_GAP` after the stage ends, and each wing's platform steps up from there. With no acquisitions, `stage` is `null` and the wings are placed exactly as today.
- **Coming-soon stubs.** `EMPTY_WING_LENGTH` changes from 6 to 3. `HallWing` gains `comingSoon: boolean` (true when the wing has no flagships and no lightboxes).
- **Where am I.** `wingIndexAt` returns `-2` inside the stage, `-1` in the entrance lobby, and the wing index otherwise. Exported constants `STAGE_INDEX = -2` and `LOBBY_INDEX = -1` replace the bare numbers at call sites.

`MuseumHall` overlay:

- The location label reads `New Acquisitions · Recently scanned, research in progress` on the stage, `Wing II · 1920–1950 · Coming soon` in a stub, and keeps `N on the runway · M on the walls` otherwise.
- The screen-reader garment list includes the stage first, under the heading "New Acquisitions".
- Rendering of stage flagships reuses `FlagshipGarment` and the inspection flow unchanged.

## 4. Lighting

### 4.1 Segment palettes

New `lib/hallLighting.ts` (pure data and functions):

```ts
export type SegmentKey = "acquisitions" | Era;
export interface SegmentPalette {
  spot: string;   // spotlight color
  fill: string;   // segment fill light color
  wash: string;   // wall wash and light-pool tint
  banner: string; // hanging numeral color
}
export const SEGMENT_PALETTES: Record<SegmentKey, SegmentPalette>;
```

| Segment | Character | Approx. color temperature |
|---|---|---|
| New Acquisitions | cool lab white | ~6000 K |
| I · Pre-1920 | warm gaslight amber | ~2700 K |
| II · 1920–1950 | soft champagne | ~3200 K |
| III · 1950–1980 | clean bright white | ~4500 K |
| IV · 1980+ | crisp neutral, slightly cool | ~5500 K |

Hex values are tuned visually during implementation; the table fixes the intent.

### 4.2 Room

`HallArchitecture`:

- `ambientLight` intensity 0.3 → ~0.08; `hemisphereLight` intensity 0.55 → ~0.15.
- Ceiling dots dim to a faint glow (darker emissive color, still `toneMapped={false}`).
- Per segment: one fill `pointLight` (no shadows) tinted `fill`, placed high over the segment's centre, and one **hanging banner** over the runway at the segment start: the wing numeral (or "New Acquisitions"), the era label, and "Coming soon" for stubs, tinted `banner`. Each banner is a plane with a `CanvasTexture` drawn once with the site's own serif and mono fonts after `document.fonts.ready`. drei's `Text` is not used, because it fetches its default font from a CDN at runtime.

### 4.3 Light pools (every garment)

A `LightPool` decal under every flagship: a flat quad on the runway with a radial-gradient alpha texture generated once in code (`CanvasTexture`, so nothing is downloaded), additive blending, tinted with the segment's `wash`, and `depthWrite={false}`. This is the only per-garment lighting cost.

### 4.4 Light budget (real spotlights)

- New pure function in `lib/hallLighting.ts`:
  ```ts
  pickLitSlots(camera: [number, number, number], slots: { id: string; position: Vec3 }[], count: number): string[]
  ```
  It returns the ids of the `count` slots nearest the camera (ties broken by id, for stability), or all of them if there are fewer.
- New hook `useLightBudget(slots, count)` in `components/museum/`: re-picks at most every 200 ms inside `useFrame` and returns, per pooled light, the target slot and a fade value.
- New `SpotlightPool` component: renders exactly `count` `spotLight`s, always mounted, so the shader light count never changes. Each one moves to its assigned slot, takes that segment's `spot` color, and eases its intensity to 0 when its slot changes, then back up at the new slot (~0.4 s total). An unassigned light sits at intensity 0.
- `GarmentSpotlight` is removed from `FlagshipGarment.tsx`.

### 4.5 Quality tier

New hook `useHallQuality()` returning a config object, decided once on mount:

| | High (laptops) | Low (phones / weak devices) |
|---|---|---|
| Real spotlights | 4 | 2 |
| Runway | glossy (existing `Lightformer` environment reflections) | matte (higher roughness, no environment map) |
| DPR | `[1, 1.75]` | `[1, 1.25]` |

Low when `(pointer: coarse)` matches, or the viewport is narrower than 768 px, or `navigator.hardwareConcurrency <= 4`. Otherwise high. Visitors cannot change it.

## 5. Arrival shot

- **When.** The first homepage visit per browser session. The `sessionStorage` key `hall-arrival-seen` is read and written inside try/catch; if storage throws, the shot plays.
- **Path.** New pure function in `lib/arrivalShot.ts`:
  ```ts
  arrivalPose(t: number, start: { position: Vec3; yaw: number }): { position: Vec3; lookAt: Vec3 }
  ```
  At `t = 0` the camera is high (~4.5 m) and behind the lobby, looking down the runway. At `t = 1` it is exactly the layout's `start` pose looking straight ahead. Position and look target are interpolated with an ease-out cubic. `t` is clamped to [0, 1].
- **Driver.** An `ArrivalShot` component inside the Canvas advances `t` over ~4 s with `useFrame`, sets the camera from `arrivalPose`, and calls `onDone()` when `t` reaches 1. A pointerdown, keydown, wheel or touchstart on the window sets `t = 1` immediately (so the shot finishes in exactly the same pose) and calls `onDone()`.
- **Hall state.** `MuseumHall` gains `arriving` (initially true only when `intro` is set and the session flag is absent). While `arriving`, `HallControls` is disabled. The intro panel fades in over the shot's second half and is fully shown at the end or on skip. The controls hint appears after `onDone`. The session flag is written on `onDone`.
- Scans load as today and fade in when ready; the light pools and banners are visible from the first frame, so the glide always heads toward lit stages.

## 6. Edge cases

| Case | Behaviour |
|---|---|
| No undated flagships | `stage` is null; the hall starts at Wing I as before (with the new lighting and stubs). |
| No garments at all | Four stubs; the arrival shot plays down the empty lit hall. |
| A GLB fails to load | Existing behaviour; its light pool still shows, so it reads as an empty plinth. |
| `sessionStorage` blocked | The arrival shot plays every visit. |
| No WebGL / reduced motion | Existing redirect to `/collection`. |
| Weak device classified high | At most 4 spotlights and the glossy runway, roughly today's cost. |

## 7. Testing

Unit tests (Vitest), next to the existing ones:

- `lib/museum.test.ts`: undated flagship → `acquisitions`; undated photo-only → `unplaced`; dated flagship → its wing; `acquisitions` sorted by `runwayOrder`. Tests that use `1980+` as a stand-in for "some era" stay as they are.
- `lib/hallLayout.test.ts`: the stage comes before Wing I and its length scales with garment count; Wing I starts `WING_GAP` after the stage; no acquisitions gives `stage === null` and today's wing positions; an empty wing is 3 m with `comingSoon` true; `wingIndexAt` returns `STAGE_INDEX`, `LOBBY_INDEX` and wing indices correctly. The existing empty-wing test changes from 6 to 3.
- `lib/hallLighting.test.ts`: every segment key has a palette; `pickLitSlots` returns the nearest N, breaks ties by id, and handles fewer slots than N and N = 0.
- `lib/arrivalShot.test.ts`: `t = 0` is the elevated start; `t = 1` equals the layout start pose; values outside [0, 1] are clamped; small steps in `t` give small steps in position (no jumps).

Manual verification before completion:

- `npm run lint` and `npm test` pass.
- Dev server checked in the browser at laptop (1280×800) and phone (390×844) sizes: screenshots of the arrival shot's first and last frames, the stage, a wing transition and a coming-soon stub; console free of errors.
- Frame rate checked on the low tier at phone size with the 11 garments.

## 8. Out of scope

- Bloom, vignette and other post-processing.
- Runway show mode, the shape map and "looks like this" (separate specs).
- Filling in real eras (a data task).
- A visitor-facing quality toggle.
