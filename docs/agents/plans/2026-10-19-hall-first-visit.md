# Hall First Visit Implementation Plan

## Overview

This plan implements [the hall first visit spec](../../superpowers/specs/2026-10-19-hall-first-visit-design.md). It changes five things about the homepage museum hall:

- Undated 3D scans get a lit **New Acquisitions** stage at the start of the runway.
- Empty era wings shrink to 3 m **coming-soon stubs**.
- The room goes dark, with **pools of light** under every garment and a distinct light color per era.
- A **fixed budget of real spotlights**, scaled by a device **quality tier**, replaces the one-spotlight-per-garment setup.
- The first homepage visit of a session opens with a short **arrival shot** that cranes the camera down into the hall.

## Current State Analysis

The full map is in [the research doc](../research/2026-10-19-hall-homepage-build-and-lighting.md). The parts that matter here:

- **Data:** all 11 runway garments in `data/garments.json` carry the placeholder `"era": "1980+"` and no date fields.
  - `buildMuseumLayout` checks era before flagship status, so they all land in Wing IV ([lib/museum.ts:104-116](../../../lib/museum.ts#L104-L116)).
  - The nearest garment is 36.5 m from the start pose at z = 6.5, and fog runs from 16 m to 75 m.
  - CA-sourced records already come through undated when they have no `date_range`: `idnoYear` ignores accession years of 2010 or later ([lib/collectiveAccess.ts:458-468](../../../lib/collectiveAccess.ts#L458-L468)). Only the static JSON carries the placeholder.
- **Layout:** wings are laid end to end from z = 0, and the platform height comes from the wing index ([lib/hallLayout.ts:120-147](../../../lib/hallLayout.ts#L120-L147)). `EMPTY_WING_LENGTH = 6`.
  - `wingIndexAt` returns −1 for the lobby. The bare −1 is also used in `MuseumHall`: `useState(-1)`, `shownWingIndex >= 0`, and `wingIndex < 0` in `showIntro`.
- **Lighting today:**
  - Room lights: `ambientLight` 0.3 and `hemisphereLight` 0.55.
  - An in-scene `Environment` of four `Lightformer` strips supplies reflections.
  - Ceiling discs are unlit glow only.
  - **One real `spotLight` per flagship** (`GarmentSpotlight`, [FlagshipGarment.tsx:32-53](../../../components/museum/FlagshipGarment.tsx#L32-L53)), so the shader light count grows with the collection.
- **Rendering settings:** DPR is fixed at `[1, 1.75]` on the `<Canvas>`, with no quality tiering.
- **Camera control:** `HallControls` sets the camera every frame while `enabled`, and re-reads yaw and pitch from the camera when it's switched back on ([HallControls.tsx:56-62](../../../components/museum/HallControls.tsx#L56-L62)). An arrival shot can therefore own the camera while the controls are disabled and hand over cleanly.
- **Tests:** pure Vitest in a `node` environment, `*.test.ts` only, so there are no component tests. `lib/hallLayout.test.ts:50` asserts the empty-wing length is 6.

## Desired End State

On a first homepage visit in a session:
- The camera cranes down from 4.5 m at the back of the lobby to the start pose over 4 s.
- The welcome panel fades in over the second half of the shot.
- Any pointer, key, wheel or touch input skips straight to the end pose.

Then:
- The visitor stands looking at the **New Acquisitions** stage, a cool-white-lit runway section starting at z = 0, with the 11 scans up close.
- Past the stage are four short stubs (Wings I–IV, each "Coming soon") with their own banners and light colors.
- The room is dark. Every garment has a pool of light beneath it, and the 4 nearest (2 on phones) are lit by real spotlights that follow the visitor.

Verification:
- `npm test`, `npm run lint` and `npm run build` pass.
- The manual browser checks in each phase pass at 1280×800 and 390×844.

### Key Discoveries:
- `next/font` variables are set on `<html>` ([app/layout.tsx:64](../../../app/layout.tsx#L64)). `getComputedStyle(document.documentElement).getPropertyValue("--font-display")` returns the generated family list, which can go straight into canvas `ctx.font`.
- `InspectControls` is the pattern for camera animation: a ref-held progress value advanced in `useFrame`, with the camera set directly ([InspectControls.tsx:65-77](../../../components/museum/InspectControls.tsx#L65-L77)).
- `GarmentSpotlight`'s local offset `[0.9, HALL_HEIGHT − 0.3, 0.4]` sits inside a group rotated by π/2, which puts it at world offset `[+0.4, HALL_HEIGHT − 0.3, −0.9]` from the garment. The pooled spotlights reuse that world offset so the look doesn't shift.
- `eslint-plugin-react-hooks` 7 (React Compiler rules) is active through `eslint-config-next`:
  - Don't read `ref.current` during render.
  - Keep three.js object mutation inside `useFrame` or effects.
  - Create long-lived three.js objects with `useState(() => …)`, as `GarmentSpotlight` already does.
- A bare `npx tsc --noEmit` fails on stale `.next/types` that reference the removed `/runway` page. Use `npm run build` for type checking; it regenerates those types.
- `sessionStorage` is used elsewhere only in `PWAInstallPrompt.tsx`, without try/catch. The spec requires try/catch here.

## What We're NOT Doing

- Bloom, vignette or any post-processing.
- Runway show mode, the shape map, "looks like this" (separate specs).
- Filling in real eras (data task).
- A visitor-facing quality toggle, or a URL override for the tier. Test the low tier with DevTools device emulation, which sets a coarse pointer and narrow width.
- Fading scans in as they load. Scans swap from the placeholder cylinder exactly as today; the light pools make the plinth read as lit before the scan arrives.
- Component or rendering tests. The test setup stays pure `node` Vitest.
- Changing `/collection`, the redirect logic in `MuseumHallLoader`, or `InspectControls`.

## Implementation Approach

The work is pure logic first, with tests, then the components that render it, in five phases:

1. Layout (garments move up close under the current lighting).
2. The lighting look (dark room, palettes, fills, banners, pools), still with per-garment spotlights so nothing goes dark mid-way.
3. Swap to the fixed spotlight pool.
4. Quality tier.
5. Arrival shot and docs.

Each phase leaves the hall fully working.

New modules:
- `lib/hallLighting.ts`: palettes, `pickLitSlots`, `assignLights`, `pickHallQuality`. Pure and tested.
- `lib/arrivalShot.ts`: `arrivalPose`. Pure and tested.
- `components/museum/LightPool.tsx`, `SegmentBanner.tsx`, `SpotlightPool.tsx`, `useLightBudget.ts`, `useHallQuality.ts`, `ArrivalShot.tsx`.

---

## Phase 1: Data, acquisitions group, stage and stubs

### Overview
Drop the era placeholder, add the `acquisitions` group and stage segment, shrink empty wings to stubs, add `STAGE_INDEX`/`LOBBY_INDEX`, and add a `hallSegments` helper that the runway and later lighting iterate over. Rendering changes are limited to the stage runway, stage flagships, the location label, the intro condition and the screen-reader list.

### Changes Required:

#### 1. Data
**File**: `data/garments.json`
**Changes**: Delete the 11 `"era": "1980+",` lines. Each one sits mid-object between `"name"` and `"type"`, so deleting the whole line leaves valid JSON.

```bash
sed -i '/^    "era": "1980+",$/d' data/garments.json
node -e 'const a=require("./data/garments.json"); if (a.some(g=>"era" in g)) process.exit(1)'
```

#### 2. Museum layout
**File**: `lib/museum.ts`
**Changes**: Add `acquisitions` to `MuseumLayout`. Route undated flagships there, sorted by `byRunwayOrder`, and update the `buildMuseumLayout` doc comment.

```ts
export interface MuseumLayout {
  // Undated flagships: scanned, but not yet placed in an era. They stand on
  // the New Acquisitions stage until research gives them a date.
  acquisitions: Garment[];
  wings: Wing[];
  // Public garments the hall can't place: undated pieces with no 3D file, or
  // pieces with no 3D file and no photo to show. They still appear in Collection.
  unplaced: Garment[];
}
```

```ts
  const acquisitions: Garment[] = [];
  ...
  for (const garment of garments) {
    const era = getEra(garment);
    const wing = era ? wingByEra.get(era) : undefined;
    if (!wing) {
      if (!era && isFlagship(garment)) acquisitions.push(garment);
      else unplaced.push(garment);
    } else if (isFlagship(garment)) {
    ...
  }

  acquisitions.sort(byRunwayOrder);
  ...
  return { acquisitions, wings, unplaced };
```

#### 3. Hall layout
**File**: `lib/hallLayout.ts`
**Changes**:
- `EMPTY_WING_LENGTH` goes from 6 to 3.
- Export `WING_GAP` (the tests need it).
- New exports: `STAGE_INDEX = -2` and `LOBBY_INDEX = -1`.
- New `HallStage` and `HallSegment` types, and `HallWing.comingSoon`.
- `placeFlagships` takes a `Garment[]`.
- When there is a stage, the wings start after it, one platform step up.
- New `hallSegments` function.

```ts
import type { SegmentKey } from "@/lib/hallLighting";

export const WING_GAP = 3;
// A wing with nothing to show yet stays in the sequence as a short stub, so
// the visitor isn't walking a long empty stretch to reach the next era.
const EMPTY_WING_LENGTH = 3;

// wingIndexAt's answers outside the four wings.
export const STAGE_INDEX = -2;
export const LOBBY_INDEX = -1;

export interface HallStage {
  zStart: number;
  zEnd: number;
  platformHeight: number;
  flagshipSlots: FlagshipSlot[];
}

export interface HallWing extends Wing {
  ...
  // Nothing to show yet: a short stub with a "Coming soon" banner.
  comingSoon: boolean;
}

export interface HallLayout {
  // The New Acquisitions stage before Wing I; null when nothing is undated.
  stage: HallStage | null;
  wings: HallWing[];
  ...
}

/** One stretch of runway, in walking order: the stage (if any), then Wings I–IV. */
export interface HallSegment {
  key: SegmentKey;
  zStart: number;
  zEnd: number;
  platformHeight: number;
  flagshipSlots: FlagshipSlot[];
  wing: HallWing | null; // null for the New Acquisitions stage
}

function isEmpty(wing: Wing): boolean {
  return wing.flagships.length === 0 && wing.lightboxes.length === 0;
}

function wingLength(wing: Wing): number {
  if (isEmpty(wing)) return EMPTY_WING_LENGTH;
  ...
}

function placeFlagships(flagships: Garment[], zStart: number, length: number, platformHeight: number): FlagshipSlot[] {
  const count = flagships.length;
  return flagships.map((garment, i) => { ...unchanged body... });
}

function buildStage(acquisitions: Garment[]): HallStage | null {
  if (acquisitions.length === 0) return null;
  const length = Math.max(MIN_WING_LENGTH, acquisitions.length * FLAGSHIP_SPACING);
  return {
    zStart: 0,
    zEnd: -length,
    platformHeight: PLATFORM_BASE_HEIGHT,
    flagshipSlots: placeFlagships(acquisitions, 0, length, PLATFORM_BASE_HEIGHT),
  };
}

export function buildHallLayout(museum: MuseumLayout): HallLayout {
  const stage = buildStage(museum.acquisitions);
  // With a stage, Wing I starts after it, one step up; without, at z = 0 as before.
  let zStart = stage ? stage.zEnd - WING_GAP : 0;
  const firstStep = stage ? 1 : 0;
  const wings: HallWing[] = museum.wings.map((wing, index) => {
    const length = wingLength(wing);
    const platformHeight = PLATFORM_BASE_HEIGHT + (index + firstStep) * PLATFORM_STEP;
    const hallWing: HallWing = {
      ...wing,
      index,
      zStart,
      zEnd: zStart - length,
      platformHeight,
      comingSoon: isEmpty(wing),
      flagshipSlots: placeFlagships(wing.flagships, zStart, length, platformHeight),
      lightboxSlots: placeLightboxes(wing, zStart),
    };
    ...
  });
  ...
  return { stage, wings, hallEndZ, bounds, start };
}

export function hallSegments(layout: HallLayout): HallSegment[] {
  const wings = layout.wings.map((wing): HallSegment => ({
    key: wing.era,
    zStart: wing.zStart,
    zEnd: wing.zEnd,
    platformHeight: wing.platformHeight,
    flagshipSlots: wing.flagshipSlots,
    wing,
  }));
  if (!layout.stage) return wings;
  const { zStart, zEnd, platformHeight, flagshipSlots } = layout.stage;
  return [{ key: "acquisitions", zStart, zEnd, platformHeight, flagshipSlots, wing: null }, ...wings];
}

/**
 * Where the visitor is at depth z: LOBBY_INDEX in the entrance lobby,
 * STAGE_INDEX on the New Acquisitions stage, else the wing index. In a gap
 * the visitor is still in the segment they are leaving.
 */
export function wingIndexAt(layout: HallLayout, z: number): number {
  if (z > 0) return LOBBY_INDEX;
  for (let i = layout.wings.length - 1; i >= 0; i--) {
    if (z <= layout.wings[i].zStart) return i;
  }
  return layout.stage ? STAGE_INDEX : LOBBY_INDEX;
}
```

`SegmentKey` lives in `lib/hallLighting.ts`, which is created in Phase 2. In Phase 1, create `lib/hallLighting.ts` with just the type, so the import resolves:

```ts
import type { Era } from "@/types/garment";

export type SegmentKey = "acquisitions" | Era;
```

#### 4. Runway geometry
**File**: `components/museum/HallArchitecture.tsx`
**Changes**:
- Take a `segments: HallSegment[]` prop.
- `RunwaySteps` iterates segments instead of `layout.wings`, keyed by `segment.key`. The first segment starts at `RUNWAY_START_Z`, each later one at the previous `zEnd`, and the last one extends to `layout.hallEndZ + 1`; the logic is otherwise unchanged.
- The comment changes from "One raised platform per era" to "One raised platform per segment".

#### 5. Hall component
**File**: `components/museum/MuseumHall.tsx`
**Changes**:
- Import `LOBBY_INDEX`, `STAGE_INDEX` and `hallSegments`. Use `useState(LOBBY_INDEX)`.
- `const segments = useMemo(() => hallSegments(layout), [layout]);`. Pass it to `HallArchitecture`, and render `FlagshipGarment`s from `segments.flatMap((s) => s.flagshipSlots)` so stage flagships get the same component and inspection flow.
- Replace the `wing` variable and the label JSX with a `location` value:

```ts
function locationLabel(layout: HallLayout, index: number): { title: string; detail?: string } {
  if (index === STAGE_INDEX) return { title: "New Acquisitions · Recently scanned, research in progress" };
  const wing = index >= 0 ? layout.wings[index] : null;
  if (!wing) return { title: "Entrance" };
  if (wing.comingSoon) return { title: `Wing ${wing.numeral} · ${wing.label} · Coming soon` };
  return {
    title: `Wing ${wing.numeral} · ${wing.label}`,
    detail: `${wing.flagshipSlots.length} on the runway · ${wing.lightboxSlots.length} on the walls`,
  };
}
```

- `showIntro` uses `wingIndex === LOBBY_INDEX` instead of `wingIndex < 0`. With the old test, the panel would stay open on the stage, where the index is −2. The comment becomes "The welcome panel closes once the visitor enters, or walks into the galleries."
- Screen-reader list: if `layout.stage` exists, render it first:

```tsx
{layout.stage && (
  <div>
    <h2>New Acquisitions</h2>
    <ul>
      {layout.stage.flagshipSlots.map(({ garment }) => (
        <li key={garment.id}><Link href={`/garments/${garment.slug}`}>{garment.label}</Link></li>
      ))}
    </ul>
  </div>
)}
```

#### 6. Tests
**File**: `lib/museum.test.ts`, inside `describe("buildMuseumLayout")`. Add:
- "puts undated flagships in New Acquisitions": `makeGarment({ id: "a", featuredOnRunway: true, ...MODEL })` → `acquisitions` ids `["a"]`, `unplaced` empty, every wing empty.
- "keeps undated photo-only pieces unplaced": undated `PHOTO` garment → `unplaced`, `acquisitions` empty.
- "keeps dated flagships in their wing": `era: "pre-1920"` flagship → Wing I flagships, `acquisitions` empty.
- "orders acquisitions by runwayOrder, then year": like the existing flagship-order test, without `era`.
- Extend "always returns all four wings" with `expect(buildMuseumLayout([]).acquisitions).toEqual([])`.

**File**: `lib/hallLayout.test.ts`. Change the helper to `garment(era: Era | undefined, kind, overrides)`, then:
- Line 50: `toBe(6)` → `toBe(3)`. Add `expect(wings[0].comingSoon).toBe(true)` and `expect(wings[2].comingSoon).toBe(false)`.
- "places the New Acquisitions stage before Wing I, sized to its garments":
  - 1 undated flagship gives a stage length of 14; 3 give 18.
  - `stage.zStart === 0`, and `stage.platformHeight === PLATFORM_BASE_HEIGHT`.
  - Every stage slot's z lies within (`zEnd`, `zStart`).
- "starts Wing I WING_GAP after the stage, one step up": `wings[0].zStart === stage.zEnd - WING_GAP`, and `wings[i].platformHeight ≈ PLATFORM_BASE_HEIGHT + (i + 1) × PLATFORM_STEP`.
- "has no stage, and today's wing positions, when nothing is undated": `layoutFor([]).stage === null`, and `wings[0].zStart === 0`.
- `hallSegments`: with a stage, the keys are `["acquisitions", "pre-1920", "1920-1950", "1950-1980", "1980+"]` and the stage segment's `wing` is null. Without one, it returns the 4 era keys.
- `wingIndexAt`:
  - Replace `-1` with `LOBBY_INDEX`.
  - New `describe` on a layout with a stage: the stage midpoint returns `STAGE_INDEX`; the gap between the stage and Wing I returns `STAGE_INDEX`; z = 3 returns `LOBBY_INDEX`; each wing's midpoint returns its index.

### Success Criteria:

#### Automated Verification:
- [x] No garment in `data/garments.json` has an `era` key (the node one-liner above exits 0)
- [x] Unit tests pass: `npm test`
- [x] Linting passes: `npm run lint`
- [x] Type check and build pass: `npm run build`

#### Manual Verification:
- [x] `npm run dev`, then open `/` at 1280×800: from the entrance, the 11 scans stand on the runway close ahead, not as a distant cluster
- [x] Walking onto the stage, the label reads "New Acquisitions · Recently scanned, research in progress"
- [x] Walking past the stage shows four short stubs; the label reads e.g. "Wing II · 1920–1950 · Coming soon"
- [x] The welcome panel closes when walking onto the stage
- [x] Clicking a stage garment flies in, orbits and flies back as before
- [x] The runway steps up at each stub
- [x] Console free of errors

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Lighting look (palettes, dark room, fills, banners, pools)

### Overview
Add the segment palettes, dim the room, and give each segment a fill light and a hanging banner. Add a light pool under every flagship. `GarmentSpotlight` stays for now, so every garment keeps its light; Phase 3 replaces it.

### Changes Required:

#### 1. Palettes
**File**: `lib/hallLighting.ts`
**Changes**: Add `SegmentPalette` and `SEGMENT_PALETTES`. The starting values below follow the spec's color-temperature intent and get tuned visually in this phase's manual check.

```ts
export interface SegmentPalette {
  spot: string; // spotlight color
  fill: string; // segment fill light color
  wash: string; // wall wash and light-pool tint
  banner: string; // hanging numeral color
}

// Each segment reads by the color of its light, from gaslight amber in the
// oldest wing to cool lab white on the New Acquisitions stage.
export const SEGMENT_PALETTES: Record<SegmentKey, SegmentPalette> = {
  acquisitions: { spot: "#f2f6ff", fill: "#9fb4e6", wash: "#c8d6ff", banner: "#b8c8f0" }, // ~6000 K
  "pre-1920": { spot: "#ffd29e", fill: "#c27a3e", wash: "#ffb066", banner: "#e0a868" }, // ~2700 K
  "1920-1950": { spot: "#ffe3c0", fill: "#b8916a", wash: "#f2c99a", banner: "#e6c79e" }, // ~3200 K
  "1950-1980": { spot: "#fff2e4", fill: "#a8a29a", wash: "#fff0dc", banner: "#ece4d8" }, // ~4500 K
  "1980+": { spot: "#f8faff", fill: "#9aa3b0", wash: "#e8eef8", banner: "#d6dde8" }, // ~5500 K
};
```

#### 2. Room
**File**: `components/museum/HallArchitecture.tsx`
**Changes**:
- `ambientLight` intensity 0.3 → 0.08. `hemisphereLight` intensity 0.55 → 0.15.
- `SpotGrid` disc color `#fffaf0` → `#4a4740`, still with `toneMapped={false}`, so the discs read as a faint glow.
- Per segment, add one fill light: `<pointLight position={[1.5, HALL_HEIGHT - 0.4, (seg.zStart + seg.zEnd) / 2]} color={SEGMENT_PALETTES[seg.key].fill} intensity={FILL_INTENSITY} decay={2} />`, with `FILL_INTENSITY = 10` as a starting value tuned visually. No shadows. There are at most 5 fill lights, fixed by the number of segments and independent of garment count.
- Per segment, add `<SegmentBanner segment={seg} />`.

#### 3. Banner
**File**: `components/museum/SegmentBanner.tsx` (new)
**Changes**: A plane hung over the runway at the segment start, facing the approaching visitor (+z).
- Its texture is a `CanvasTexture` drawn once with the site fonts. drei's `Text` isn't used, because it fetches a font from a CDN.
- Two thin rods run up to the ceiling, so it reads as hung.

```tsx
"use client";

import { useEffect, useState } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { HALL_HEIGHT, type HallSegment } from "@/lib/hallLayout";
import { SEGMENT_PALETTES } from "@/lib/hallLighting";

const WIDTH = 2.6;
const HEIGHT = 1.3;
const HANG_Y = HALL_HEIGHT - 1.25;
const PX_PER_M = 400;

function bannerText(segment: HallSegment): { title: string; subtitle: string; note?: string } {
  if (!segment.wing) return { title: "New Acquisitions", subtitle: "Recently scanned" };
  const { numeral, label, comingSoon } = segment.wing;
  return { title: numeral, subtitle: label, note: comingSoon ? "Coming soon" : undefined };
}

// The site's fonts come from next/font, which only exposes their generated
// family names through CSS variables on <html>.
function fontFamily(variable: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || fallback;
}

async function drawBanner(segment: HallSegment): Promise<CanvasTexture> {
  const serif = fontFamily("--font-display", "Georgia, serif");
  const mono = fontFamily("--font-plex-mono", "monospace");
  const titleFont = `italic ${segment.wing ? 260 : 120}px ${serif}`;
  const smallFont = `500 44px ${mono}`;
  try {
    await Promise.all([document.fonts.load(titleFont), document.fonts.load(smallFont)]);
    await document.fonts.ready;
  } catch {
    // Draw with whatever font is available rather than not at all.
  }
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * PX_PER_M;
  canvas.height = HEIGHT * PX_PER_M;
  const ctx = canvas.getContext("2d")!;
  const { title, subtitle, note } = bannerText(segment);
  ctx.fillStyle = SEGMENT_PALETTES[segment.key].banner;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = titleFont;
  ctx.fillText(title, canvas.width / 2, canvas.height * 0.55);
  ctx.font = smallFont;
  ctx.letterSpacing = "8px";
  ctx.fillText(subtitle.toUpperCase(), canvas.width / 2, canvas.height * 0.75);
  if (note) {
    ctx.globalAlpha = 0.6;
    ctx.fillText(note.toUpperCase(), canvas.width / 2, canvas.height * 0.9);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export default function SegmentBanner({ segment }: { segment: HallSegment }) {
  const [texture, setTexture] = useState<CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let drawn: CanvasTexture | null = null;
    drawBanner(segment).then((tex) => {
      drawn = tex;
      if (cancelled) tex.dispose();
      else setTexture(tex);
    });
    return () => {
      cancelled = true;
      drawn?.dispose();
    };
  }, [segment]);

  return (
    <group position={[0, HANG_Y, segment.zStart - 0.4]}>
      {[-WIDTH / 2 + 0.15, WIDTH / 2 - 0.15].map((x) => (
        <mesh key={x} position={[x, (HALL_HEIGHT - HANG_Y) / 2, 0]}>
          <cylinderGeometry args={[0.006, 0.006, HALL_HEIGHT - HANG_Y, 4]} />
          <meshBasicMaterial color="#2a2a2e" />
        </mesh>
      ))}
      {texture && (
        <mesh>
          <planeGeometry args={[WIDTH, HEIGHT]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
```

`segment` objects come from the `useMemo`'d `hallSegments(layout)`, so the effect only reruns when the garments change.

#### 4. Light pool
**File**: `components/museum/LightPool.tsx` (new)
**Changes**: A flat additive quad on the runway under each flagship. Its radial-gradient texture is generated once and shared by all pools.

```tsx
"use client";

import { AdditiveBlending, CanvasTexture } from "three";
import type { Vec3 } from "@/lib/hallLayout";

const RADIUS = 1.1;
let poolTexture: CanvasTexture | null = null;

// One soft white disc, drawn in code so nothing is downloaded; each pool tints it.
function getPoolTexture(): CanvasTexture {
  if (!poolTexture) {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    poolTexture = new CanvasTexture(canvas);
  }
  return poolTexture;
}

/** The pool of light on the runway under a garment: its only per-garment lighting cost. */
export default function LightPool({ position, color }: { position: Vec3; color: string }) {
  const [x, y, z] = position;
  return (
    // Just above the runway top (which sits 5 mm above the platform) to avoid z-fighting.
    <mesh position={[x, y + 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[RADIUS * 2, RADIUS * 2]} />
      <meshBasicMaterial
        map={getPoolTexture()}
        color={color}
        transparent
        opacity={0.55}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
```

#### 5. Hall component
**File**: `components/museum/MuseumHall.tsx`
**Changes**: Render the pools next to the flagships. They sit outside any `Suspense`, so they show from the first frame and stay if a GLB fails:

```tsx
{segments.map((s) =>
  s.flagshipSlots.map((slot) => (
    <LightPool key={`pool-${slot.garment.id}`} position={slot.position} color={SEGMENT_PALETTES[s.key].wash} />
  )),
)}
```

#### 6. Intro exit transition (added on request during Phase 2 review)
**File**: `components/museum/MuseumHall.tsx`
**Changes**:
- When the welcome panel hides (on "Enter the galleries" or on walking onto the stage), it fades out and lifts 16 px over 0.7 s (`transition-[opacity,translate] duration-700 ease-out`, with `opacity-0 -translate-y-4 pointer-events-none` when hidden) instead of switching to `sr-only`.
- It stays in the DOM, so the heading remains for screen readers. The paragraph and buttons sit in an `inert` `display: contents` wrapper while hidden.
- The location label and the controls hint fade in (100 ms delay, 500 ms fade; shortened from 300/700 ms on review) instead of popping in.
- As a side effect, the panel also fades in (dropping 16 px) when the hall first becomes ready.
- Walking also dismisses the panel as soon as the visitor sets off: `HallControls` takes an `onStepIn` callback, called once when the camera first moves more than 1 m (`STEP_IN_DISTANCE`) from the start pose. Previously the panel only cleared on reaching the stage, about 6.5 m in. Once dismissed this way, it stays dismissed, as with the button.

#### 7. Tests
**File**: `lib/hallLighting.test.ts` (new)
- "has a palette for every segment": for each of `"acquisitions"` and `WINGS.map((w) => w.era)`, `SEGMENT_PALETTES[key]` exists, and each of `spot`, `fill`, `wash` and `banner` matches `/^#[0-9a-f]{6}$/i`.

### Success Criteria:

#### Automated Verification:
- [x] Unit tests pass: `npm test`
- [x] Linting passes: `npm run lint`
- [x] Type check and build pass: `npm run build`

#### Manual Verification:
- [x] Room is dark, and each garment sits in a visible pool of light
- [x] The stage reads cool white; each stub has its own light color (amber in I, champagne in II, bright white in III, cool neutral in IV)
- [x] Banners hang over the runway at each segment start, in the Bodoni and Plex Mono fonts (not a fallback serif): "New Acquisitions / Recently scanned", "I / Pre-1920 / Coming soon", …
- [x] Palette hex values tuned by eye and updated in `SEGMENT_PALETTES` (starting values approved as-is)
- [x] Lightboxes (if any) and ceiling glow still read correctly
- [x] Console free of errors

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Spotlight pool and light budget

### Overview
Replace the per-garment `GarmentSpotlight` with a fixed pool of 4 always-mounted spotlights. The pool is assigned to the nearest garments every 200 ms and cross-fades when a light changes garment.

### Changes Required:

#### 1. Pure picking and assignment
**File**: `lib/hallLighting.ts`

```ts
import type { Vec3 } from "@/lib/hallLayout";

export interface LitSlot {
  id: string;
  position: Vec3;
  color: string; // the segment's spot color
}

function distanceSq(a: Vec3, b: Vec3): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

/** Ids of the `count` slots nearest the camera; ties go to the lower id, so picks don't flicker. */
export function pickLitSlots(camera: Vec3, slots: { id: string; position: Vec3 }[], count: number): string[] {
  if (count <= 0) return [];
  return slots
    .map((s) => ({ id: s.id, d: distanceSq(camera, s.position) }))
    .sort((a, b) => a.d - b.d || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, count)
    .map((s) => s.id);
}

/**
 * Hands the picked slots to the pooled lights. A light whose slot is still
 * picked keeps it, so only lights that really change garment fade out and in.
 */
export function assignLights(current: (string | null)[], picked: string[]): (string | null)[] {
  const wanted = new Set(picked);
  const kept = current.map((id) => (id !== null && wanted.has(id) ? id : null));
  const taken = new Set(kept);
  const free = picked.filter((id) => !taken.has(id));
  return kept.map((id) => id ?? free.shift() ?? null);
}
```

#### 2. Budget hook
**File**: `components/museum/useLightBudget.ts` (new)

```ts
"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { assignLights, pickLitSlots, type LitSlot } from "@/lib/hallLighting";

const REPICK_SECONDS = 0.2;
// Each way: a light moving to another garment takes ~0.4 s in all.
const FADE_SECONDS = 0.2;

export interface PooledLight {
  slot: LitSlot | null;
  fade: number; // 0..1, multiplies the light's intensity
}

/**
 * Keeps `count` pooled lights on the garments nearest the camera. Returns a
 * ref, updated every frame, for the caller to read in its own useFrame.
 */
export function useLightBudget(slots: LitSlot[], count: number): RefObject<PooledLight[]> {
  const lights = useRef<PooledLight[]>(Array.from({ length: count }, () => ({ slot: null, fade: 0 })));
  const wanted = useRef<(string | null)[]>(Array.from({ length: count }, () => null));
  const sinceRepick = useRef(Number.POSITIVE_INFINITY);
  const byId = useMemo(() => new Map(slots.map((s) => [s.id, s])), [slots]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    sinceRepick.current += dt;
    if (sinceRepick.current >= REPICK_SECONDS) {
      sinceRepick.current = 0;
      const { x, y, z } = state.camera.position;
      wanted.current = assignLights(wanted.current, pickLitSlots([x, y, z], slots, count));
    }
    const step = dt / FADE_SECONDS;
    lights.current.forEach((light, i) => {
      const id = wanted.current[i];
      if ((light.slot?.id ?? null) === id) {
        light.fade = id === null ? 0 : Math.min(1, light.fade + step);
      } else if (light.fade > 0) {
        light.fade = Math.max(0, light.fade - step);
      } else {
        light.slot = id === null ? null : (byId.get(id) ?? null);
      }
    });
  });

  return lights;
}
```

`count` is fixed for the life of the hall (Phase 4 decides it once on mount), so the arrays are never resized.

#### 3. Spotlight pool
**File**: `components/museum/SpotlightPool.tsx` (new)

```tsx
"use client";

import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, type SpotLight } from "three";
import { FLAGSHIP_HEIGHT, HALL_HEIGHT } from "@/lib/hallLayout";
import type { LitSlot } from "@/lib/hallLighting";
import { useLightBudget } from "./useLightBudget";

const SPOT_INTENSITY = 45;
// Up in the ceiling grid, slightly toward the aisle and ahead of the garment
// (the old per-garment spotlight's offset, in world terms).
const SPOT_OFFSET: [number, number, number] = [0.4, HALL_HEIGHT - 0.3, -0.9];

/**
 * A fixed number of real spotlights, always mounted so the shaders' light
 * count never changes, moved onto the garments nearest the visitor.
 */
export default function SpotlightPool({ slots, count }: { slots: LitSlot[]; count: number }) {
  const lights = useLightBudget(slots, count);
  const spots = useRef<(SpotLight | null)[]>([]);
  const lastSlot = useRef<(LitSlot | null)[]>([]);
  const [targets] = useState(() => Array.from({ length: count }, () => new Object3D()));

  useLayoutEffect(() => {
    spots.current.forEach((spot, i) => {
      if (spot) spot.target = targets[i];
    });
  }, [targets]);

  useFrame(() => {
    lights.current.forEach((light, i) => {
      const spot = spots.current[i];
      if (!spot) return;
      spot.intensity = SPOT_INTENSITY * light.fade;
      if (light.slot && light.slot !== lastSlot.current[i]) {
        const [x, y, z] = light.slot.position;
        spot.position.set(x + SPOT_OFFSET[0], SPOT_OFFSET[1], z + SPOT_OFFSET[2]);
        targets[i].position.set(x, y + FLAGSHIP_HEIGHT * 0.55, z);
        spot.color.set(light.slot.color);
      }
      lastSlot.current[i] = light.slot;
    });
  });

  return (
    <>
      {targets.map((target, i) => (
        <Fragment key={i}>
          <primitive object={target} />
          <spotLight
            ref={(el: SpotLight | null) => {
              spots.current[i] = el;
            }}
            angle={0.42}
            penumbra={0.6}
            intensity={0}
            distance={12}
            decay={2}
          />
        </Fragment>
      ))}
    </>
  );
}
```

#### 4. Remove the per-garment spotlight
**File**: `components/museum/FlagshipGarment.tsx`
**Changes**: Delete `GarmentSpotlight` and its `<GarmentSpotlight />` usage. Drop the now-unused imports: `useLayoutEffect`, `useRef`, `useState`, `Object3D`, `SpotLight`, `HALL_HEIGHT`.

#### 5. Hall component
**File**: `components/museum/MuseumHall.tsx`

```ts
const litSlots = useMemo(
  () =>
    segments.flatMap((s) =>
      s.flagshipSlots.map((slot) => ({ id: slot.garment.id, position: slot.position, color: SEGMENT_PALETTES[s.key].spot })),
    ),
  [segments],
);
```

Render `<SpotlightPool slots={litSlots} count={4} />` inside the Canvas. The `4` becomes `quality.spotlights` in Phase 4.

#### 6. Tests
**File**: `lib/hallLighting.test.ts`
- `pickLitSlots`:
  - Returns the nearest N in distance order.
  - Breaks ties by id: two slots at an equal distance with ids `"b"` and `"a"` → `"a"` first.
  - Returns all of them (sorted) when there are fewer slots than N.
  - Returns `[]` when N = 0, and `[]` for no slots.
- `assignLights`:
  - Keeps a light on a slot that's still picked: `(["a", "b"], ["b", "c"])` → `["c", "b"]`.
  - Fills empty lights: `([null, null], ["a"])` → `["a", null]`.
  - Clears lights whose slot was dropped: `(["a"], [])` → `[null]`.
  - The output never holds an id twice.

### Success Criteria:

#### Automated Verification:
- [x] Unit tests pass: `npm test`
- [x] Linting passes: `npm run lint`
- [x] Type check and build pass: `npm run build`
- [x] `GarmentSpotlight` no longer exists: `! grep -rn GarmentSpotlight components`

#### Manual Verification:
- [x] The 4 garments nearest the visitor are spotlit in their segment's spot color, and the others show only their light pool
- [x] Walking along the stage, spotlights hand over to the next garments with a soft fade, with no pops or flicker
- [x] Inspecting a garment keeps it spotlit
- [x] In the Three.js scene (e.g. `__THREE_DEVTOOLS__` or a temporary `console.log(scene)`), exactly 4 `SpotLight`s exist regardless of garment count
- [x] Console free of errors

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Quality tier

### Overview
Decide a high or low tier once on mount. It sets the number of spotlights, the DPR range, and whether the runway is glossy with environment reflections or matte without them.

### Changes Required:

#### 1. Pure tier decision
**File**: `lib/hallLighting.ts`

```ts
export interface HallQuality {
  tier: "high" | "low";
  spotlights: number;
  dpr: [number, number];
  glossyRunway: boolean;
}

const HIGH_QUALITY: HallQuality = { tier: "high", spotlights: 4, dpr: [1, 1.75], glossyRunway: true };
const LOW_QUALITY: HallQuality = { tier: "low", spotlights: 2, dpr: [1, 1.25], glossyRunway: false };

/** Phones and weak devices get fewer lights, a lower resolution and a matte runway. */
export function pickHallQuality(device: { coarsePointer: boolean; viewportWidth: number; cores?: number }): HallQuality {
  const weak = device.cores !== undefined && device.cores <= 4;
  return device.coarsePointer || device.viewportWidth < 768 || weak ? LOW_QUALITY : HIGH_QUALITY;
}
```

#### 2. Hook
**File**: `components/museum/useHallQuality.ts` (new)

```ts
"use client";

import { useState } from "react";
import { pickHallQuality, type HallQuality } from "@/lib/hallLighting";

/** The hall's quality tier, decided once on mount. The hall only renders in the browser. */
export function useHallQuality(): HallQuality {
  const [quality] = useState(() =>
    pickHallQuality({
      coarsePointer: window.matchMedia("(pointer: coarse)").matches,
      viewportWidth: window.innerWidth,
      cores: navigator.hardwareConcurrency || undefined,
    }),
  );
  return quality;
}
```

#### 3. Wire it in
**File**: `components/museum/MuseumHall.tsx`: `const quality = useHallQuality();`, then:
- `dpr={quality.dpr}` on the Canvas.
- `<SpotlightPool slots={litSlots} count={quality.spotlights} />`.
- `<HallArchitecture … glossy={quality.glossyRunway} />`.

**File**: `components/museum/HallArchitecture.tsx`: new `glossy: boolean` prop.
- Render `<Environment>` only when `glossy`.
- Runway top: glossy `roughness 0.22 / metalness 0.25` (as now); matte `roughness 0.75 / metalness 0`.
- Floor: glossy `0.32 / 0.2` (as now); matte `0.7 / 0`. Without an environment map, metalness only darkens the surface.

#### 4. Tests
**File**: `lib/hallLighting.test.ts`, `pickHallQuality`:
- A desktop (`false`, 1280, 8) → high, 4 spotlights, DPR `[1, 1.75]`, glossy.
- A coarse pointer → low.
- A width of 767 → low; 768 → high.
- 4 cores → low.
- Unknown cores (`undefined`) on a desktop → high.
- Low → 2 spotlights, DPR `[1, 1.25]`, matte.

### Success Criteria:

#### Automated Verification:
- [x] Unit tests pass: `npm test`
- [x] Linting passes: `npm run lint`
- [x] Type check and build pass: `npm run build`

#### Manual Verification:
- [x] At 1280×800 on the laptop: 4 spotlights, glossy runway with reflections
- [x] In DevTools device mode (iPhone 12 Pro, 390×844, reload after switching): 2 spotlights, matte runway
- [x] Low tier at phone size with the 11 garments holds near 60 fps (DevTools → Rendering → Frame Rendering Stats, walking the stage for ~30 s)
- [x] Console free of errors

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 5: Arrival shot and docs

### Overview
On the first homepage visit of a session, crane the camera from high at the back of the lobby down to the start pose over 4 s. Any input skips to the end pose. Walking is disabled during the shot, and the welcome panel fades in over its second half. Then update `CLAUDE.md`.

### Changes Required:

#### 1. Pure path
**File**: `lib/arrivalShot.ts` (new)

```ts
import { ENTRANCE_DEPTH, type Vec3 } from "@/lib/hallLayout";

export const ARRIVAL_SECONDS = 4;

// High at the back of the lobby, just off the runway's edge, looking down at
// the first lit stage; the shot cranes down to the visitor's start pose.
const FROM_POSITION: Vec3 = [1.5, 4.5, ENTRANCE_DEPTH - 0.4];
const FROM_LOOK_AT: Vec3 = [0, 1, -12];
const LOOK_AHEAD = 10;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
// Written so t = 0 and t = 1 return a and b exactly.
const mix = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] * (1 - t) + b[0] * t,
  a[1] * (1 - t) + b[1] * t,
  a[2] * (1 - t) + b[2] * t,
];

/** Where the camera is, and what it looks at, at progress t (clamped to 0..1) of the arrival shot. */
export function arrivalPose(t: number, start: { position: Vec3; yaw: number }): { position: Vec3; lookAt: Vec3 } {
  const e = easeOutCubic(Math.min(1, Math.max(0, t)));
  const [x, y, z] = start.position;
  // At yaw 0 the camera looks down -z (see HallControls).
  const endLookAt: Vec3 = [x - Math.sin(start.yaw) * LOOK_AHEAD, y, z - Math.cos(start.yaw) * LOOK_AHEAD];
  return { position: mix(FROM_POSITION, start.position, e), lookAt: mix(FROM_LOOK_AT, endLookAt, e) };
}
```

#### 2. Driver
**File**: `components/museum/ArrivalShot.tsx` (new)

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { ARRIVAL_SECONDS, arrivalPose } from "@/lib/arrivalShot";
import type { HallLayout } from "@/lib/hallLayout";

const SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

/**
 * Glides the camera into the hall, then calls onDone. Any input jumps to the
 * last frame, so a skipped shot ends in exactly the same pose.
 */
export default function ArrivalShot({ start, onDone }: { start: HallLayout["start"]; onDone: () => void }) {
  const t = useRef(0);
  const done = useRef(false);
  const [look] = useState(() => new Vector3());

  useEffect(() => {
    const skip = () => {
      t.current = 1;
    };
    SKIP_EVENTS.forEach((type) => window.addEventListener(type, skip, { passive: true }));
    return () => SKIP_EVENTS.forEach((type) => window.removeEventListener(type, skip));
  }, []);

  useFrame((state, delta) => {
    if (done.current) return;
    // Capped so a long first frame (shader compiles) doesn't jump the shot ahead.
    t.current = Math.min(1, t.current + Math.min(delta, 0.1) / ARRIVAL_SECONDS);
    const { position, lookAt } = arrivalPose(t.current, start);
    state.camera.position.set(...position);
    state.camera.lookAt(look.set(...lookAt));
    if (t.current >= 1) {
      done.current = true;
      onDone();
    }
  });

  return null;
}
```

A skip applies the end pose on the next frame (≈16 ms), and `onDone` is called there. The final `lookAt` is level and straight ahead, so when `HallControls` re-enables it reads yaw = `start.yaw` and pitch = 0.

#### 3. Hall state
**File**: `components/museum/MuseumHall.tsx`

```ts
const ARRIVAL_SEEN_KEY = "hall-arrival-seen";

// Storage can throw (blocked site data); the shot then plays every visit.
function arrivalSeen(): boolean {
  try {
    return sessionStorage.getItem(ARRIVAL_SEEN_KEY) !== null;
  } catch {
    return false;
  }
}

function markArrivalSeen() {
  try {
    sessionStorage.setItem(ARRIVAL_SEEN_KEY, "1");
  } catch {
    // Nothing to remember it in.
  }
}
```

Inside the component:
- `const [arriving, setArriving] = useState(() => intro && !arrivalSeen());`
- `const finishArrival = useCallback(() => { setArriving(false); markArrivalSeen(); }, []);`
- Make sure the press that skips the shot doesn't also walk or open a garment:

```ts
const pressBeganArriving = useRef(false);
useEffect(() => {
  const onDown = () => {
    pressBeganArriving.current = arriving;
  };
  window.addEventListener("pointerdown", onDown, true);
  return () => window.removeEventListener("pointerdown", onDown, true);
}, [arriving]);
```

- `handleFloorClick`, `handleSelectFlagship` and `handleSelectPhoto` return early when `arriving || pressBeganArriving.current`.
- `<HallControls … enabled={walking && !arriving} />`.
- `{arriving && <ArrivalShot start={layout.start} onDone={finishArrival} />}` inside the Canvas.
- Intro panel: while `showIntro && arriving`, append `pointer-events-none animate-[fade-in_2s_ease-out_2s_both]` to its classes, so it fades in over the shot's second half. When `arriving` turns false, the class is removed and the panel is fully shown at once. This covers the skip case.
  - Since Phase 2 the panel also has an opacity/translate transition. The animation's `both` fill overrides it during the shot. Check that removing the animation on skip doesn't make the panel re-run the 0.7 s fade-in; if it does, suppress the transition while `arriving` (e.g. `transition-none`).
- Controls hint: also keep it at `opacity-0` while `arriving`.

**File**: `app/globals.css`: no change needed. The existing `fade-in` keyframe (opacity 0 → 1) is reused, so the panel class is `animate-[fade-in_2s_ease-out_2s_both]`. (The plan originally added an identical `intro-arrive` keyframe.)

#### 4. Tests
**File**: `lib/arrivalShot.test.ts` (new)
- t = 0: the position is elevated (`y ≈ 4.5`) and in the lobby (`0 < z <= ENTRANCE_DEPTH`).
- t = 1: `position` `toEqual(start.position)` exactly. The look direction is level (`lookAt[1] === position[1]`), and its yaw `atan2(-(lx - px), -(lz - pz))` ≈ `start.yaw`. Check for yaw 0 and yaw 0.5.
- Clamping: `arrivalPose(-1)` equals `arrivalPose(0)`, and `arrivalPose(2)` equals `arrivalPose(1)`.
- Continuity: stepping t from 0 to 1 by 0.01, no step moves the position more than 0.15 m or the look target more than 0.6 m.

#### 5. Docs
**File**: `CLAUDE.md`
- Homepage bullets: add the New Acquisitions stage (undated flagships), the coming-soon stubs, the per-era lighting with a fixed spotlight pool and quality tier, and the arrival shot (once per session, `sessionStorage` key `hall-arrival-seen`, skipped by any input).
- 3D Components table: add `SpotlightPool` / `useLightBudget`, `LightPool`, `SegmentBanner` and `ArrivalShot`. Remove the per-garment spotlight wording if present. Mention `lib/hallLighting.ts` and `lib/arrivalShot.ts` next to `lib/hallLayout.ts`.

### Success Criteria:

#### Automated Verification:
- [x] Unit tests pass: `npm test`
- [x] Linting passes: `npm run lint`
- [x] Type check and build pass: `npm run build`

#### Manual Verification:
- [x] In a fresh tab session, `/` plays the crane-down over ~4 s; the welcome panel fades in over the second half
- [x] Reloading in the same tab does not replay it; a new tab (new session) does
- [x] Clicking, pressing a key, scrolling or tapping mid-shot jumps to the same end pose with the panel fully shown, and the skipping click does not walk or open a garment
- [x] After the shot, drag, WASD and floor clicks work normally, and the controls hint appears once the panel is dismissed
- [x] With site data blocked in the browser, the shot plays every visit and no errors are thrown
- [x] Screenshots at 1280×800 and 390×844: the shot's first and last frames, the stage, a wing transition, a coming-soon stub
- [x] Console free of errors

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful.

---

## Testing Strategy

### Unit Tests:
- `lib/museum.test.ts`:
  - acquisitions routing (undated flagship, undated photo-only, dated flagship);
  - acquisitions order;
  - `acquisitions` is always present.
- `lib/hallLayout.test.ts`:
  - stage position and length;
  - wings after the stage, one step up;
  - `stage === null` with today's positions;
  - 3 m `comingSoon` stubs;
  - `hallSegments` order;
  - `wingIndexAt` with `STAGE_INDEX` and `LOBBY_INDEX`, including the stage-to-wing gap.
- `lib/hallLighting.test.ts`:
  - palette coverage;
  - `pickLitSlots` (nearest N, ties, fewer than N, N = 0);
  - `assignLights` (keep, fill, clear, no duplicates);
  - `pickHallQuality` thresholds.
- `lib/arrivalShot.test.ts`: endpoints, clamping, continuity.

### Integration Tests:
None. The repo has no component or rendering test setup, and this plan doesn't add one.

### Manual Testing Steps:
1. Fresh session at 1280×800: the arrival shot plays, the panel fades in, "Enter the galleries" walks onto the stage.
2. Walk the stage: spotlights hand over smoothly; banners and colors change at each stub.
3. Inspect a stage garment and return.
4. Skip the shot with each input type in a fresh session.
5. Phone emulation (390×844): low tier, ~60 fps, labels readable.
6. Temporarily give one garment `"era": "pre-1920"` in `data/garments.json`: it moves to Wing I (no longer a stub), and the stage shrinks. Revert afterwards.

## Performance Considerations

- **Light count per tier:**
  - High: 4 spot, ≤ 5 point, 1 ambient, 1 hemisphere.
  - Low: 2 spot, ≤ 5 point, 1 ambient, 1 hemisphere.
  - Neither grows with garment count. Today the count is 11 spotlights plus 2 room lights, and it grows with every garment.
- **Per-garment cost:** one additive quad with a shared texture.
- **Light budget:** `pickLitSlots` runs at most 5 times a second, at O(n log n) over the flagships, which is trivial at hundreds of flagships.
- **Low tier:** drops the `Environment` cube render and reflections, and caps DPR at 1.25.
- **Banners:** at most 5 textures of 1040×520, drawn once.

## Migration Notes

- Removing `era` from the static JSON only affects the no-CA fallback. CA-sourced records are unaffected (see Current State).
- When real eras arrive, a garment moves from the stage to its wing with no code change. Once every flagship is dated, `stage` becomes null and the hall starts at Wing I.

## References

- Spec: `docs/superpowers/specs/2026-10-19-hall-first-visit-design.md`
- Research: `docs/agents/research/2026-10-19-hall-homepage-build-and-lighting.md`
- Camera-flight pattern: `components/museum/InspectControls.tsx:51-77`
- Per-garment spotlight being replaced: `components/museum/FlagshipGarment.tsx:32-53`
- Walk-control handover: `components/museum/HallControls.tsx:56-62`
