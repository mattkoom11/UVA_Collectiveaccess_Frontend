# Conservator Mode & AR View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a raking-light "conservator mode" and a true-scale "View in your space" AR view to the garment 3D viewer.

**Architecture:** Conservator mode stays inside the existing React Three Fiber viewer (`Garment3DViewer.tsx`). It swaps the gallery light rig for one low directional light whose angle lives in a mutable ref, driven by the R3F frame loop and a DOM dial, so no React re-renders happen per frame. AR is a separate, lazily loaded `<model-viewer>` sheet, served as a vendored self-contained bundle because no npm release of model-viewer accepts the site's `three@0.181`. All maths and mesh manipulation live in pure `lib/` modules with Vitest tests. Components stay thin.

**Tech Stack:** Next 16, React 19, TypeScript 5.9 (strict), three 0.181, @react-three/fiber 9, @react-three/drei 10, Tailwind (archive design tokens), Vitest 4 (node environment), vendored `@google/model-viewer` 4.3.1, `qrcode` 1.5.4.

**Spec:** `docs/superpowers/specs/2026-10-19-conservator-ar-design.md`

## Global Constraints

- Free and open-source dependencies only.
- Do not upgrade `three`, `@react-three/fiber` or `@react-three/drei`.
- model-viewer is **not** installed from npm; it is vendored at `public/vendor/model-viewer-4.3.1.min.js` (with `public/vendor/model-viewer-LICENSE`).
- New npm dependencies, exact versions: `qrcode@1.5.4`, dev `@types/qrcode@1.5.5`.
- `DRESS_FORM_HEIGHT_CM = 145` (placeholder until Matthew measures the real form). Valid `height_cm` range: 20–300 inclusive.
- Conservator light: elevation default 12°, range 5°–45°; sweep period 20 s; sweep resumes 5 s after the last dial interaction; orbit radius 6 units; ambient 0.05.
- Surface-only clay material: `MeshStandardMaterial({ color: "#bdb5a6", roughness: 0.85 })`.
- Respect `prefers-reduced-motion: reduce`: no automatic sweep.
- Styling uses the existing `archive-*` Tailwind tokens (`text-archive-fg`, `border-archive-border`, `bg-archive-bg`, …), matching the viewer's existing controls-hint box.
- Lint runs with `--max-warnings=0`. Do not call `setState` synchronously inside `useEffect` bodies, and do not read `ref.current` during render.
- Vitest runs in the `node` environment and only picks up `**/*.test.ts` (no DOM, no `.tsx` tests).

## Review Focus

1. **A bad `height_cm` in `garments.json`** (0, negative, `NaN`, or 1450 typed in millimetres). Expected: the AR view falls back to the dress-form height instead of a microscopic or building-sized garment. Pinned in Task 2.
2. **A press exactly on the dial's centre.** Expected: the light stays where it is and doesn't snap to an arbitrary angle. Pinned in Task 1 (`pointerToAzimuth` returns `null`).
3. **Pressing "Surface only" repeatedly, or turning conservator mode off while Surface only is on.** Expected: the photo textures come back exactly as they were, never stuck on clay. Pinned in Task 3 (`setSurfaceOnly` tests) and Task 4 (the toggle resets Surface only).
4. **The tab is hidden for minutes and then shown again.** The first frame then has a huge `delta`. Expected: the azimuth stays within [0, 360) and the dial doesn't spin wildly. Pinned in Task 1 (`advanceAzimuth` with a large delta).
5. **The model-viewer bundle fails to load** (offline, or blocked by CSP). Expected: an error message with a working "Try again" that actually retries, not a promise stuck forever. Pinned in Task 5 Step 9 (manual check with DevTools request blocking; Vitest has no DOM to unit-test the loader).

---

### Task 1: Light maths

**Files:**
- Create: `lib/conservatorLight.ts`
- Test: `lib/conservatorLight.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (all exported from `@/lib/conservatorLight`):
  - constants `SWEEP_PERIOD_SEC = 20`, `SWEEP_RESUME_DELAY_MS = 5000`, `DEFAULT_AZIMUTH_DEG = 135`, `DEFAULT_ELEVATION_DEG = 12`, `MIN_ELEVATION_DEG = 5`, `MAX_ELEVATION_DEG = 45`, `LIGHT_RADIUS = 6`
  - `interface ConservatorLightState { azimuthDeg: number; elevationDeg: number; lastInteractAtMs: number }`
  - `initialLightState(): ConservatorLightState`
  - `normalizeDeg(deg: number): number`, which returns a value in [0, 360)
  - `lightPosition(azimuthDeg: number, elevationDeg: number, radius: number): [number, number, number]`
  - `pointerToAzimuth(dx: number, dy: number): number | null`
  - `advanceAzimuth(azimuthDeg: number, deltaSec: number, periodSec: number): number`
  - `shouldSweep(nowMs: number, lastInteractAtMs: number, reducedMotion: boolean, resumeDelayMs?: number): boolean`
  - `clampElevation(deg: number): number`

**Azimuth convention:** the dial is a top-down map of the scene with the viewer's starting camera at the bottom. 0° is the far side of the garment (dial top), 90° is the right, 180° is the camera side (dial bottom), and 270° is the left. CSS `rotate(az deg)` on an arm whose handle sits at the top draws exactly this.

- [ ] **Step 1: Create the feature branch and commit the spec and plan**

```bash
cd ~/Documents/GitHub/UVA_Collectiveaccess_Frontend
git checkout -b feature/conservator-ar
git add docs/superpowers/specs/2026-10-19-conservator-ar-design.md docs/superpowers/plans/2026-10-19-conservator-ar.md
git commit -m "docs: conservator mode and AR view spec and plan"
```

- [ ] **Step 2: Write the failing tests**

Create `lib/conservatorLight.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  DEFAULT_AZIMUTH_DEG,
  DEFAULT_ELEVATION_DEG,
  MAX_ELEVATION_DEG,
  MIN_ELEVATION_DEG,
  advanceAzimuth,
  clampElevation,
  initialLightState,
  lightPosition,
  normalizeDeg,
  pointerToAzimuth,
  shouldSweep,
} from "./conservatorLight";

function expectVec(actual: [number, number, number], expected: [number, number, number]) {
  actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 6));
}

describe("normalizeDeg", () => {
  it("wraps into [0, 360)", () => {
    expect(normalizeDeg(0)).toBe(0);
    expect(normalizeDeg(360)).toBe(0);
    expect(normalizeDeg(370)).toBe(10);
    expect(normalizeDeg(-10)).toBe(350);
    expect(normalizeDeg(-720)).toBe(0);
  });
});

describe("lightPosition", () => {
  it("puts azimuth 0 on the far side of the garment (-z)", () => {
    expectVec(lightPosition(0, 0, 6), [0, 0, -6]);
  });
  it("puts azimuth 90 on the right (+x)", () => {
    expectVec(lightPosition(90, 0, 6), [6, 0, 0]);
  });
  it("puts azimuth 180 on the camera side (+z)", () => {
    expectVec(lightPosition(180, 0, 6), [0, 0, 6]);
  });
  it("puts elevation 90 straight overhead regardless of azimuth", () => {
    expectVec(lightPosition(45, 90, 6), [0, 6, 0]);
  });
  it("keeps the light on a sphere of the given radius", () => {
    const [x, y, z] = lightPosition(123, 12, 6);
    expect(Math.hypot(x, y, z)).toBeCloseTo(6, 6);
  });
});

describe("pointerToAzimuth", () => {
  // Screen coordinates: +dx is right, +dy is DOWN.
  it("maps the four dial directions", () => {
    expect(pointerToAzimuth(0, -10)).toBeCloseTo(0, 6);
    expect(pointerToAzimuth(10, 0)).toBeCloseTo(90, 6);
    expect(pointerToAzimuth(0, 10)).toBeCloseTo(180, 6);
    expect(pointerToAzimuth(-10, 0)).toBeCloseTo(270, 6);
  });
  it("returns values in [0, 360)", () => {
    const az = pointerToAzimuth(-1, -1)!;
    expect(az).toBeCloseTo(315, 6);
    expect(az).toBeGreaterThanOrEqual(0);
    expect(az).toBeLessThan(360);
  });
  it("returns null at the exact centre so the light does not jump", () => {
    expect(pointerToAzimuth(0, 0)).toBeNull();
  });
});

describe("advanceAzimuth", () => {
  it("moves a quarter turn in a quarter period", () => {
    expect(advanceAzimuth(0, 5, 20)).toBeCloseTo(90, 6);
  });
  it("wraps past 360", () => {
    expect(advanceAzimuth(350, 1, 20)).toBeCloseTo(8, 6);
  });
  it("stays in range after a huge delta (tab was hidden for minutes)", () => {
    const az = advanceAzimuth(10, 1000.5, 20);
    expect(az).toBeGreaterThanOrEqual(0);
    expect(az).toBeLessThan(360);
    expect(az).toBeCloseTo(19, 6);
  });
});

describe("shouldSweep", () => {
  it("sweeps when nobody has touched the dial yet", () => {
    expect(shouldSweep(1000, -Infinity, false)).toBe(true);
  });
  it("pauses within 5 s of the last interaction", () => {
    expect(shouldSweep(10_000, 6_000, false)).toBe(false);
  });
  it("resumes 5 s after the last interaction", () => {
    expect(shouldSweep(11_000, 6_000, false)).toBe(true);
  });
  it("never sweeps under reduced motion", () => {
    expect(shouldSweep(1_000_000, -Infinity, true)).toBe(false);
  });
});

describe("clampElevation", () => {
  it("clamps to the allowed range", () => {
    expect(clampElevation(0)).toBe(MIN_ELEVATION_DEG);
    expect(clampElevation(90)).toBe(MAX_ELEVATION_DEG);
    expect(clampElevation(20)).toBe(20);
  });
});

describe("initialLightState", () => {
  it("starts at the defaults with no interaction recorded", () => {
    expect(initialLightState()).toEqual({
      azimuthDeg: DEFAULT_AZIMUTH_DEG,
      elevationDeg: DEFAULT_ELEVATION_DEG,
      lastInteractAtMs: -Infinity,
    });
  });
  it("returns a fresh object each call", () => {
    expect(initialLightState()).not.toBe(initialLightState());
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run lib/conservatorLight.test.ts`
Expected: FAIL, "Failed to resolve import "./conservatorLight"".

- [ ] **Step 4: Write the implementation**

Create `lib/conservatorLight.ts`:

```ts
// Conservator-mode light maths. The light dial is a top-down map of the
// scene with the viewer's starting camera at the bottom: azimuth 0° is the
// far side of the garment (dial top), 90° the right, 180° the camera side
// (dial bottom), 270° the left. Elevation is measured up from the
// horizontal plane through the garment's centre.

export const SWEEP_PERIOD_SEC = 20;
export const SWEEP_RESUME_DELAY_MS = 5000;
// Starts low from the front-right, so the first frame already rakes across
// the side of the garment the viewer sees.
export const DEFAULT_AZIMUTH_DEG = 135;
export const DEFAULT_ELEVATION_DEG = 12;
export const MIN_ELEVATION_DEG = 5;
export const MAX_ELEVATION_DEG = 45;
export const LIGHT_RADIUS = 6;

export interface ConservatorLightState {
  azimuthDeg: number;
  elevationDeg: number;
  // performance.now() of the last dial interaction; -Infinity means never.
  lastInteractAtMs: number;
}

export function initialLightState(): ConservatorLightState {
  return {
    azimuthDeg: DEFAULT_AZIMUTH_DEG,
    elevationDeg: DEFAULT_ELEVATION_DEG,
    lastInteractAtMs: -Infinity,
  };
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function normalizeDeg(deg: number): number {
  // `+ 0` turns -0 into 0 so callers never see a negative zero.
  return (((deg % 360) + 360) % 360) + 0;
}

export function lightPosition(
  azimuthDeg: number,
  elevationDeg: number,
  radius: number,
): [number, number, number] {
  const az = toRad(azimuthDeg);
  const el = toRad(elevationDeg);
  const ground = radius * Math.cos(el);
  return [ground * Math.sin(az), radius * Math.sin(el), -ground * Math.cos(az)];
}

// dx/dy are screen offsets from the dial's centre (+dy is down). Returns null
// at the exact centre, where the angle is undefined.
export function pointerToAzimuth(dx: number, dy: number): number | null {
  if (dx === 0 && dy === 0) return null;
  return normalizeDeg((Math.atan2(dx, -dy) * 180) / Math.PI);
}

export function advanceAzimuth(azimuthDeg: number, deltaSec: number, periodSec: number): number {
  return normalizeDeg(azimuthDeg + (360 * deltaSec) / periodSec);
}

export function shouldSweep(
  nowMs: number,
  lastInteractAtMs: number,
  reducedMotion: boolean,
  resumeDelayMs: number = SWEEP_RESUME_DELAY_MS,
): boolean {
  return !reducedMotion && nowMs - lastInteractAtMs >= resumeDelayMs;
}

export function clampElevation(deg: number): number {
  return Math.min(MAX_ELEVATION_DEG, Math.max(MIN_ELEVATION_DEG, deg));
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run lib/conservatorLight.test.ts`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add lib/conservatorLight.ts lib/conservatorLight.test.ts
git commit -m "feat: conservator light maths"
```

---

### Task 2: AR scale helpers and `height_cm`

**Files:**
- Create: `lib/arScale.ts`
- Test: `lib/arScale.test.ts`
- Modify: `types/garment.ts` (the `Garment` interface, next to `model3d_rotationY` at about line 65)

**Interfaces:**
- Consumes: the `Garment` type from `@/types/garment`.
- Produces (from `@/lib/arScale`):
  - `DRESS_FORM_HEIGHT_CM = 145`, `MIN_PLAUSIBLE_HEIGHT_CM = 20`, `MAX_PLAUSIBLE_HEIGHT_CM = 300`
  - `targetHeightCm(garment: Pick<Garment, "height_cm">): number`
  - `arScaleFactor(rawModelHeight: number, heightCm: number): number`
  - `modelViewerOrientation(rotationYDeg?: number): string`
  - `prefersARSheet(env: { maxTouchPoints: number; coarsePointer: boolean }): boolean`
- Produces on `Garment`: `height_cm?: number`.

- [ ] **Step 1: Add the field to the `Garment` type**

In `types/garment.ts`, directly after the `model3d_rotationY?: number; …` line, add:

```ts
  height_cm?: number; // Real height of the garment as displayed on its form, in cm. Drives true-scale AR; falls back to DRESS_FORM_HEIGHT_CM in lib/arScale.ts
```

- [ ] **Step 2: Write the failing tests**

Create `lib/arScale.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  DRESS_FORM_HEIGHT_CM,
  arScaleFactor,
  modelViewerOrientation,
  prefersARSheet,
  targetHeightCm,
} from "./arScale";

describe("targetHeightCm", () => {
  it("uses the garment's own height when it is plausible", () => {
    expect(targetHeightCm({ height_cm: 132 })).toBe(132);
  });
  it("accepts the range boundaries", () => {
    expect(targetHeightCm({ height_cm: 20 })).toBe(20);
    expect(targetHeightCm({ height_cm: 300 })).toBe(300);
  });
  it.each([
    ["missing", undefined],
    ["zero", 0],
    ["negative", -40],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["entered in millimetres", 1450],
    ["too small to be a garment", 5],
  ])("falls back to the dress form when height is %s", (_label, height) => {
    expect(targetHeightCm({ height_cm: height })).toBe(DRESS_FORM_HEIGHT_CM);
  });
});

describe("arScaleFactor", () => {
  it("scales a 2-unit model to 1.45 m", () => {
    expect(arScaleFactor(2, 145)).toBeCloseTo(0.725, 9);
  });
  it("scales a 30-unit raw scan to 1.2 m", () => {
    expect(arScaleFactor(30, 120)).toBeCloseTo(0.04, 9);
  });
  it.each([0, -1, Number.NaN])("returns 1 when the raw height is %s", (raw) => {
    expect(arScaleFactor(raw, 145)).toBe(1);
  });
});

describe("modelViewerOrientation", () => {
  it("puts the rotation in the yaw slot", () => {
    expect(modelViewerOrientation(135)).toBe("0deg 0deg 135deg");
  });
  it("defaults to no rotation", () => {
    expect(modelViewerOrientation()).toBe("0deg 0deg 0deg");
  });
});

describe("prefersARSheet", () => {
  it("is true for a touch device with a coarse pointer", () => {
    expect(prefersARSheet({ maxTouchPoints: 5, coarsePointer: true })).toBe(true);
  });
  it("is false for a desktop", () => {
    expect(prefersARSheet({ maxTouchPoints: 0, coarsePointer: false })).toBe(false);
  });
  it("is false for a touchscreen laptop driven by a mouse", () => {
    expect(prefersARSheet({ maxTouchPoints: 10, coarsePointer: false })).toBe(false);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run lib/arScale.test.ts`
Expected: FAIL, "Failed to resolve import "./arScale"".

- [ ] **Step 4: Write the implementation**

Create `lib/arScale.ts`:

```ts
import type { Garment } from "@/types/garment";

// Fallback height for garments without a measured height_cm. Placeholder until
// the archive's dress form is measured.
export const DRESS_FORM_HEIGHT_CM = 145;

// Anything outside this range is a data-entry slip (0, a negative, or a value
// typed in millimetres), not a real garment, so it falls back to the form.
export const MIN_PLAUSIBLE_HEIGHT_CM = 20;
export const MAX_PLAUSIBLE_HEIGHT_CM = 300;

export function targetHeightCm(garment: Pick<Garment, "height_cm">): number {
  const h = garment.height_cm;
  return typeof h === "number" &&
    Number.isFinite(h) &&
    h >= MIN_PLAUSIBLE_HEIGHT_CM &&
    h <= MAX_PLAUSIBLE_HEIGHT_CM
    ? h
    : DRESS_FORM_HEIGHT_CM;
}

// Uniform scale that makes a model whose bounding box is rawModelHeight units
// tall stand heightCm tall in AR (model-viewer treats one unit as one metre).
export function arScaleFactor(rawModelHeight: number, heightCm: number): number {
  if (!Number.isFinite(rawModelHeight) || rawModelHeight <= 0) return 1;
  return heightCm / 100 / rawModelHeight;
}

// model-viewer's orientation attribute is "roll pitch yaw"; a garment's
// calibrated front-facing spin (model3d_rotationY) is a yaw.
export function modelViewerOrientation(rotationYDeg = 0): string {
  return `0deg 0deg ${rotationYDeg}deg`;
}

// Decides between the AR sheet and the desktop QR popover before
// model-viewer has loaded (its canActivateAR only exists afterwards, and
// desktop visitors should never download it).
export function prefersARSheet(env: { maxTouchPoints: number; coarsePointer: boolean }): boolean {
  return env.maxTouchPoints > 0 && env.coarsePointer;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run lib/arScale.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/arScale.ts lib/arScale.test.ts types/garment.ts
git commit -m "feat: AR scale helpers and optional height_cm on Garment"
```

---

### Task 3: Mesh helpers (welded normals, Surface-only swap)

**Files:**
- Create: `lib/meshNormals.ts`, `lib/surfaceMaterial.ts`
- Test: `lib/meshNormals.test.ts`, `lib/surfaceMaterial.test.ts`

**Interfaces:**
- Consumes: `three`.
- Produces:
  - `computeWeldedNormals(geometry: BufferGeometry, precision?: number): void` from `@/lib/meshNormals`
  - `ensureSmoothNormals(root: Object3D): void` from `@/lib/meshNormals`. For every mesh: sets `castShadow = true`; if the geometry has no `normal` attribute, computes welded normals and turns off `flatShading` on its material(s).
  - `type MaterialStore = Map<Mesh, Material | Material[]>` from `@/lib/surfaceMaterial`
  - `setSurfaceOnly(root: Object3D, on: boolean, clay: Material, store: MaterialStore): void` from `@/lib/surfaceMaterial`

**Why welded normals:** the scans are indexed but split along UV seams (about 65k–98k vertices for 100k triangles). `geometry.computeVertexNormals()` treats the split copies separately and leaves a hard shading line along every seam, which a raking light makes very visible. Welding by position fixes that without touching UVs.

- [ ] **Step 1: Write the failing normals tests**

Create `lib/meshNormals.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { BufferAttribute, BufferGeometry, Mesh, MeshStandardMaterial } from "three";
import { computeWeldedNormals, ensureSmoothNormals } from "./meshNormals";

// A "tent": two triangles meeting along the x axis at a 90° ridge. Each
// triangle has its OWN copies of the two ridge vertices, the way a UV seam
// splits vertices in the photogrammetry exports.
//   A: v0 (0,0,0)  v1 (1,0,0)  v2 (0, 1,1)  -> face normal (0,-1,1)/√2
//   B: v3 (0,0,0)  v4 (0,-1,1) v5 (1,0,0)   -> face normal (0, 1,1)/√2
const TENT = [0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, -1, 1, 1, 0, 0];
const S = Math.SQRT1_2;

function tent(indexed: boolean): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(TENT), 3));
  if (indexed) g.setIndex([0, 1, 2, 3, 4, 5]);
  return g;
}

function normalAt(g: BufferGeometry, i: number): [number, number, number] {
  const n = g.getAttribute("normal");
  return [n.getX(i), n.getY(i), n.getZ(i)];
}

function expectVec(actual: [number, number, number], expected: [number, number, number]) {
  actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 5));
}

describe.each([
  ["indexed", true],
  ["non-indexed", false],
])("computeWeldedNormals (%s)", (_label, indexed) => {
  it("gives split copies of a ridge vertex the same, averaged normal", () => {
    const g = tent(indexed);
    computeWeldedNormals(g);
    expectVec(normalAt(g, 0), [0, 0, 1]);
    expectVec(normalAt(g, 3), [0, 0, 1]);
    expectVec(normalAt(g, 1), [0, 0, 1]);
    expectVec(normalAt(g, 5), [0, 0, 1]);
  });

  it("keeps each unshared vertex on its own face normal", () => {
    const g = tent(indexed);
    computeWeldedNormals(g);
    expectVec(normalAt(g, 2), [0, -S, S]);
    expectVec(normalAt(g, 4), [0, S, S]);
  });

  it("writes unit-length normals", () => {
    const g = tent(indexed);
    computeWeldedNormals(g);
    for (let i = 0; i < 6; i++) {
      const [x, y, z] = normalAt(g, i);
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 5);
    }
  });
});

describe("ensureSmoothNormals", () => {
  it("adds normals, turns off flat shading and enables shadows on a mesh without normals", () => {
    const material = new MeshStandardMaterial({ flatShading: true });
    const mesh = new Mesh(tent(true), material);
    ensureSmoothNormals(mesh);
    expect(mesh.geometry.getAttribute("normal")).toBeDefined();
    expect(material.flatShading).toBe(false);
    expect(mesh.castShadow).toBe(true);
  });

  it("leaves a geometry that already has normals alone", () => {
    const g = tent(true);
    g.computeVertexNormals();
    const existing = g.getAttribute("normal");
    const material = new MeshStandardMaterial({ flatShading: true });
    const mesh = new Mesh(g, material);
    ensureSmoothNormals(mesh);
    expect(mesh.geometry.getAttribute("normal")).toBe(existing);
    expect(material.flatShading).toBe(true);
    expect(mesh.castShadow).toBe(true);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run lib/meshNormals.test.ts`
Expected: FAIL, "Failed to resolve import "./meshNormals"".

- [ ] **Step 3: Implement welded normals**

Create `lib/meshNormals.ts`:

```ts
import { BufferAttribute, type BufferGeometry, type Mesh, type MeshStandardMaterial, type Object3D } from "three";

// Smooth vertex normals that ignore UV seams. Photogrammetry exports split
// vertices wherever the texture atlas has a seam; three's computeVertexNormals
// treats those copies as unrelated and leaves a hard shading line along every
// seam. Here vertices are grouped by quantized position, area-weighted face
// normals are summed per group, and every copy gets the group's normal.
// UVs, indices and vertex order are untouched.
export function computeWeldedNormals(geometry: BufferGeometry, precision = 1e-5): void {
  const position = geometry.getAttribute("position");
  const count = position.count;
  const inv = 1 / precision;

  const groupOf = new Int32Array(count);
  const keyToGroup = new Map<string, number>();
  for (let i = 0; i < count; i++) {
    const key = `${Math.round(position.getX(i) * inv)},${Math.round(position.getY(i) * inv)},${Math.round(position.getZ(i) * inv)}`;
    let group = keyToGroup.get(key);
    if (group === undefined) {
      group = keyToGroup.size;
      keyToGroup.set(key, group);
    }
    groupOf[i] = group;
  }

  const sums = new Float32Array(keyToGroup.size * 3);
  const index = geometry.getIndex();
  const cornerCount = index ? index.count : count;
  for (let corner = 0; corner < cornerCount; corner += 3) {
    const a = index ? index.getX(corner) : corner;
    const b = index ? index.getX(corner + 1) : corner + 1;
    const c = index ? index.getX(corner + 2) : corner + 2;

    const ax = position.getX(a), ay = position.getY(a), az = position.getZ(a);
    const e1x = position.getX(b) - ax, e1y = position.getY(b) - ay, e1z = position.getZ(b) - az;
    const e2x = position.getX(c) - ax, e2y = position.getY(c) - ay, e2z = position.getZ(c) - az;

    // Unnormalized cross product: its length is twice the triangle's area,
    // so larger faces pull the average harder.
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;

    for (const v of [a, b, c]) {
      const g = groupOf[v] * 3;
      sums[g] += nx;
      sums[g + 1] += ny;
      sums[g + 2] += nz;
    }
  }

  const normals = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const g = groupOf[i] * 3;
    const x = sums[g], y = sums[g + 1], z = sums[g + 2];
    const length = Math.hypot(x, y, z) || 1;
    normals[i * 3] = x / length;
    normals[i * 3 + 1] = y / length;
    normals[i * 3 + 2] = z / length;
  }
  geometry.setAttribute("normal", new BufferAttribute(normals, 3));
}

// The GLB exports ship without normals, so GLTFLoader falls back to flat
// shading. Geometry and materials are shared with drei's useGLTF cache: the
// first mount computes normals and later mounts skip the work.
export function ensureSmoothNormals(root: Object3D): void {
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    if (mesh.geometry.getAttribute("normal")) return;

    computeWeldedNormals(mesh.geometry);
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      if ("flatShading" in material) (material as MeshStandardMaterial).flatShading = false;
      material.needsUpdate = true;
    }
  });
}
```

- [ ] **Step 4: Run the normals tests to verify they pass**

Run: `npx vitest run lib/meshNormals.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing Surface-only tests**

Create `lib/surfaceMaterial.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import { setSurfaceOnly, type MaterialStore } from "./surfaceMaterial";

function scene() {
  const photoA = new MeshStandardMaterial({ color: "#ff0000" });
  const photoB = new MeshStandardMaterial({ color: "#00ff00" });
  const a = new Mesh(new BoxGeometry(), photoA);
  const b = new Mesh(new BoxGeometry(), [photoB, photoA]);
  const root = new Group();
  root.add(a, b);
  return { root, a, b, photoA, photoB };
}

describe("setSurfaceOnly", () => {
  it("swaps every mesh to the clay material and remembers the originals", () => {
    const { root, a, b, photoA, photoB } = scene();
    const clay = new MeshStandardMaterial();
    const store: MaterialStore = new Map();

    setSurfaceOnly(root, true, clay, store);

    expect(a.material).toBe(clay);
    expect(b.material).toBe(clay);
    expect(store.get(a)).toBe(photoA);
    expect(store.get(b)).toEqual([photoB, photoA]);
  });

  it("keeps the real originals when switched on twice", () => {
    const { root, a, photoA } = scene();
    const clay = new MeshStandardMaterial();
    const store: MaterialStore = new Map();

    setSurfaceOnly(root, true, clay, store);
    setSurfaceOnly(root, true, clay, store);
    setSurfaceOnly(root, false, clay, store);

    expect(a.material).toBe(photoA);
  });

  it("restores the originals and empties the store when switched off", () => {
    const { root, a, b, photoA, photoB } = scene();
    const clay = new MeshStandardMaterial();
    const store: MaterialStore = new Map();

    setSurfaceOnly(root, true, clay, store);
    setSurfaceOnly(root, false, clay, store);

    expect(a.material).toBe(photoA);
    expect(b.material).toEqual([photoB, photoA]);
    expect(store.size).toBe(0);
  });

  it("does nothing when switched off without ever being on", () => {
    const { root, a, photoA } = scene();
    setSurfaceOnly(root, false, new MeshStandardMaterial(), new Map());
    expect(a.material).toBe(photoA);
  });
});
```

- [ ] **Step 6: Run them to verify they fail**

Run: `npx vitest run lib/surfaceMaterial.test.ts`
Expected: FAIL, "Failed to resolve import "./surfaceMaterial"".

- [ ] **Step 7: Implement the swap**

Create `lib/surfaceMaterial.ts`:

```ts
import type { Material, Mesh, Object3D } from "three";

export type MaterialStore = Map<Mesh, Material | Material[]>;

// "Surface only" in conservator mode: the photo textures carry the capture
// lighting baked in, which fights the raking light, so every mesh swaps to a
// neutral clay material. Originals are kept in `store` (first one wins, so
// switching on twice never records clay as an "original") and put back when
// switched off.
export function setSurfaceOnly(root: Object3D, on: boolean, clay: Material, store: MaterialStore): void {
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    if (on) {
      if (!store.has(mesh)) store.set(mesh, mesh.material);
      mesh.material = clay;
    } else {
      const original = store.get(mesh);
      if (original) mesh.material = original;
    }
  });
  if (!on) store.clear();
}
```

- [ ] **Step 8: Run all the mesh tests**

Run: `npx vitest run lib/meshNormals.test.ts lib/surfaceMaterial.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add lib/meshNormals.ts lib/meshNormals.test.ts lib/surfaceMaterial.ts lib/surfaceMaterial.test.ts
git commit -m "feat: welded normals and surface-only material swap for scans"
```

---

### Task 4: Conservator mode in the viewer

**Files:**
- Create: `components/garments/ConservatorLighting.tsx`, `components/garments/LightDial.tsx`
- Modify: `components/garments/Garment3DViewer.tsx` (imports at lines 1–11, `GarmentModel` at lines 40–79, the default export at lines 87–180)

**Interfaces:**
- Consumes: everything from `@/lib/conservatorLight` (Task 1); `ensureSmoothNormals` (Task 3); `setSurfaceOnly` and `MaterialStore` (Task 3).
- Produces:
  - `ConservatorLighting` (default export). Props: `{ stateRef: RefObject<ConservatorLightState>; reducedMotion: boolean }`.
  - `LightDial` (default export). Props: `{ stateRef: RefObject<ConservatorLightState> }`.
  - `Garment3DViewer` keeps its existing props `{ modelUrl?, garmentId?, garment? }`.

- [ ] **Step 1: Create `ConservatorLighting.tsx`**

```tsx
"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import type { DirectionalLight } from "three";
import {
  LIGHT_RADIUS,
  SWEEP_PERIOD_SEC,
  advanceAzimuth,
  lightPosition,
  shouldSweep,
  type ConservatorLightState,
} from "@/lib/conservatorLight";

interface Props {
  stateRef: RefObject<ConservatorLightState>;
  reducedMotion: boolean;
}

// One low, hard light grazing across the garment, the way conservators
// inspect textiles: folds, seams, puckering and repairs throw shadows that
// even gallery lighting washes out. Angle state lives in a ref shared with
// LightDial so the sweep never re-renders React.
export default function ConservatorLighting({ stateRef, reducedMotion }: Props) {
  const lightRef = useRef<DirectionalLight>(null);

  useFrame((_, delta) => {
    const state = stateRef.current;
    if (shouldSweep(performance.now(), state.lastInteractAtMs, reducedMotion)) {
      state.azimuthDeg = advanceAzimuth(state.azimuthDeg, delta, SWEEP_PERIOD_SEC);
    }
    lightRef.current?.position.set(...lightPosition(state.azimuthDeg, state.elevationDeg, LIGHT_RADIUS));
  });

  return (
    <>
      <ambientLight intensity={0.05} />
      <directionalLight
        ref={lightRef}
        intensity={2.2}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
    </>
  );
}
```

- [ ] **Step 2: Create `LightDial.tsx`**

```tsx
"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import {
  DEFAULT_AZIMUTH_DEG,
  DEFAULT_ELEVATION_DEG,
  MAX_ELEVATION_DEG,
  MIN_ELEVATION_DEG,
  clampElevation,
  normalizeDeg,
  pointerToAzimuth,
  type ConservatorLightState,
} from "@/lib/conservatorLight";

const KEY_STEP_DEG = 5;

interface Props {
  stateRef: RefObject<ConservatorLightState>;
}

// Top-down map of the scene: the square in the middle is the garment, "you"
// marks the camera's starting side, and the glowing handle is the light.
// The viewer resets the light state each time conservator mode turns on, so
// the DEFAULT_* constants are the correct initial values here.
export default function LightDial({ stateRef }: Props) {
  const dialRef = useRef<HTMLDivElement>(null);
  const armRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // The sweep advances inside the R3F frame loop and writes straight to
  // stateRef, so the dial follows it with its own rAF instead of React
  // state, which avoids re-rendering the viewer every frame.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const azimuth = stateRef.current.azimuthDeg;
      if (armRef.current) armRef.current.style.transform = `rotate(${azimuth}deg)`;
      dialRef.current?.setAttribute("aria-valuenow", String(Math.round(azimuth)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stateRef]);

  const markInteraction = () => {
    stateRef.current.lastInteractAtMs = performance.now();
  };

  const steerTo = (e: PointerEvent<HTMLDivElement>) => {
    const dial = dialRef.current;
    if (!dial) return;
    const rect = dial.getBoundingClientRect();
    const azimuth = pointerToAzimuth(
      e.clientX - (rect.left + rect.width / 2),
      e.clientY - (rect.top + rect.height / 2),
    );
    if (azimuth !== null) stateRef.current.azimuthDeg = azimuth;
    markInteraction();
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    steerTo(e);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) steerTo(e);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    markInteraction();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? KEY_STEP_DEG
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -KEY_STEP_DEG
          : 0;
    if (step === 0) return;
    e.preventDefault();
    stateRef.current.azimuthDeg = normalizeDeg(stateRef.current.azimuthDeg + step);
    markInteraction();
  };

  return (
    <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2 bg-black/60 backdrop-blur-sm border border-archive-border px-4 py-3 text-xs text-archive-muted-subtle">
      <p className="font-medium text-archive-fg">Light</p>
      <div
        ref={dialRef}
        role="slider"
        tabIndex={0}
        aria-label="Light direction around the garment"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={DEFAULT_AZIMUTH_DEG}
        className="relative w-24 h-24 rounded-full border border-archive-border cursor-grab active:cursor-grabbing touch-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-archive-accent"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <div
          className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-archive-fg"
          aria-hidden
        />
        <div
          ref={armRef}
          className="absolute inset-0"
          style={{ transform: `rotate(${DEFAULT_AZIMUTH_DEG}deg)` }}
          aria-hidden
        >
          <div className="absolute left-1/2 top-0 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_10px_rgba(253,230,138,0.9)]" />
        </div>
        <span
          className="absolute left-1/2 -bottom-5 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em]"
          aria-hidden
        >
          you
        </span>
      </div>
      <label className="mt-4 flex flex-col items-center gap-1">
        <span>Height</span>
        <input
          type="range"
          min={MIN_ELEVATION_DEG}
          max={MAX_ELEVATION_DEG}
          step={1}
          defaultValue={DEFAULT_ELEVATION_DEG}
          onChange={(e) => {
            stateRef.current.elevationDeg = clampElevation(Number(e.target.value));
          }}
          className="w-24"
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 3: Wire the normals fix and Surface-only into `GarmentModel`**

In `components/garments/Garment3DViewer.tsx`, replace the imports block (lines 1–11) with:

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Box3, Group, MeshStandardMaterial, Vector3 } from "three";
import DemoGarment from "./DemoGarment";
import { Garment } from "@/types/garment";
import { getPrimaryColor } from "@/lib/colorUtils";
import ModelAnnotations from "./ModelAnnotations";
import { generateGarmentAnnotations } from "@/lib/annotations";
import ConservatorLighting from "./ConservatorLighting";
import LightDial from "./LightDial";
import { initialLightState, type ConservatorLightState } from "@/lib/conservatorLight";
import { ensureSmoothNormals } from "@/lib/meshNormals";
import { setSurfaceOnly, type MaterialStore } from "@/lib/surfaceMaterial";
```

(`useLoader` was imported but unused; it is dropped.)

Change the `GarmentModel` signature and the cloned-scene memo, and add the Surface-only effects. Replace:

```tsx
function GarmentModel({ modelUrl, rotationY = 0 }: { modelUrl: string; rotationY?: number }) {
  const groupRef = useRef<Group>(null);

  // Load the 3D model using useGLTF from drei
  // This supports GLTF/GLB formats commonly used for photogrammetry
  const { scene } = useGLTF(modelUrl);

  // Clone the scene to avoid mutating the original
  const clonedScene = useMemo(() => scene.clone(), [scene]);
```

with:

```tsx
function GarmentModel({
  modelUrl,
  rotationY = 0,
  surfaceOnly = false,
}: {
  modelUrl: string;
  rotationY?: number;
  surfaceOnly?: boolean;
}) {
  const groupRef = useRef<Group>(null);

  // Load the 3D model using useGLTF from drei
  // This supports GLTF/GLB formats commonly used for photogrammetry
  const { scene } = useGLTF(modelUrl);

  // Clone the scene to avoid mutating the original, and give the scan smooth
  // normals (the exports ship without any, which renders flat-shaded facets)
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    ensureSmoothNormals(clone);
    return clone;
  }, [scene]);

  // Conservator "Surface only": neutral clay in place of the photo texture,
  // whose baked-in capture lighting fights the raking light
  const clay = useMemo(() => new MeshStandardMaterial({ color: "#bdb5a6", roughness: 0.85 }), []);
  const originals = useRef<MaterialStore>(new Map());
  useEffect(() => {
    setSurfaceOnly(clonedScene, surfaceOnly, clay, originals.current);
  }, [clonedScene, surfaceOnly, clay]);
  useEffect(() => () => clay.dispose(), [clay]);
```

The rest of `GarmentModel` (the scale/position memo and the returned JSX) is unchanged.

- [ ] **Step 4: Extract the gallery rig and add a reduced-motion hook**

Directly above `export default function Garment3DViewer`, add:

```tsx
// Soft, even gallery-style lighting rather than moody spotlights
function GalleryLighting() {
  return (
    <>
      <ambientLight intensity={0.9} />
      <spotLight position={[5, 5, 5]} angle={0.6} penumbra={0.8} intensity={0.7} color="#fff8ec" castShadow />
      <spotLight position={[-5, 5, -5]} angle={0.6} penumbra={0.8} intensity={0.5} color="#fff8ec" castShadow />
      <pointLight position={[-5, 3, -5]} intensity={0.3} color="#fffaf0" />
      <pointLight position={[5, 3, -5]} intensity={0.3} color="#fffaf0" />
      <pointLight position={[0, 8, 0]} intensity={0.25} color="#fffaf0" />
    </>
  );
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

function toggleClass(on: boolean): string {
  return `px-3 py-2 text-xs uppercase tracking-[0.2em] border backdrop-blur-sm transition-colors ${
    on
      ? "bg-archive-fg text-archive-bg border-archive-fg"
      : "bg-black/60 text-archive-fg border-archive-border hover:border-archive-border-hover"
  }`;
}
```

- [ ] **Step 5: Rewrite the viewer body**

Replace the whole `export default function Garment3DViewer` with:

```tsx
export default function Garment3DViewer({ modelUrl, garmentId, garment }: Props) {
  const [conservator, setConservator] = useState(false);
  const [surfaceOnly, setSurfaceOnlyMode] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const lightState = useRef<ConservatorLightState>(initialLightState());

  const toggleConservator = () => {
    if (conservator) {
      // Leaving conservator mode always brings the photo texture back
      setSurfaceOnlyMode(false);
    } else {
      // Each visit starts from the default angle, matching LightDial's initial render
      lightState.current = initialLightState();
    }
    setConservator(!conservator);
  };

  return (
    <div
      className={`w-full h-[600px] md:h-[800px] lg:h-[900px] overflow-hidden border border-stone-300 shadow-2xl relative transition-colors duration-500 ${
        conservator ? "bg-neutral-950" : "bg-gradient-to-b from-stone-200 via-stone-100 to-stone-200"
      }`}
    >
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={50} />
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={1.5}
          maxDistance={12}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          enableDamping
          dampingFactor={0.05}
        />

        {conservator ? (
          <ConservatorLighting stateRef={lightState} reducedMotion={reducedMotion} />
        ) : (
          <GalleryLighting />
        )}

        {/* Ground plane — light gallery-floor tone instead of a dark stage */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#d8d2c4" roughness={0.9} />
        </mesh>

        {/* Model */}
        <Suspense fallback={<LoadingModel />}>
          {modelUrl ? (
            <GarmentModel
              modelUrl={modelUrl}
              surfaceOnly={conservator && surfaceOnly}
              rotationY={
                (((garment?.model3d_rotationY ?? 0) + VIEWER_INITIAL_ANGLE_OFFSET_DEGREES) * Math.PI) /
                180
              }
            />
          ) : (
            <PlaceholderModel garment={garment} />
          )}
        </Suspense>

        {/* Annotations */}
        {garment && (
          <ModelAnnotations
            annotations={generateGarmentAnnotations(garment)}
          />
        )}
      </Canvas>

      {/* Conservator toggles — only for real scans */}
      {modelUrl && (
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
          <button type="button" aria-pressed={conservator} onClick={toggleConservator} className={toggleClass(conservator)}>
            Conservator
          </button>
          {conservator && (
            <button
              type="button"
              aria-pressed={surfaceOnly}
              onClick={() => setSurfaceOnlyMode(!surfaceOnly)}
              className={toggleClass(surfaceOnly)}
            >
              Surface only
            </button>
          )}
        </div>
      )}

      {modelUrl && conservator && <LightDial stateRef={lightState} />}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm border border-archive-border px-4 py-3 text-xs text-archive-muted-subtle space-y-1">
        <p className="font-medium text-archive-fg mb-2">Controls</p>
        <p>🖱️ Rotate: Click & Drag</p>
        <p>🔍 Zoom: Scroll Wheel</p>
        <p>↔️ Pan: Right-click & Drag</p>
      </div>

      {!modelUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-archive-muted text-sm bg-archive-bg/70 backdrop-blur-sm border border-archive-border px-6 py-4">
            <p className="font-medium text-archive-muted-subtle mb-1">3D Model Placeholder</p>
            <p className="text-xs mt-1 text-archive-muted">Add photogrammetry model URL to view the actual 3D scan</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

(`garmentId` was already unused in the old body. Keep it in the props for API compatibility.)

- [ ] **Step 6: Typecheck, lint and run the tests**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: no type errors, zero lint warnings, all tests pass. If lint flags `garmentId` as unused, rename it in the destructuring to `garmentId: _garmentId` only if the repo's ESLint config ignores `_`-prefixed names. Otherwise remove it from the destructuring and keep it in `Props`.

- [ ] **Step 7: Check it in the browser**

Run: `npm run dev`, then open `http://localhost:3000/garments/<slug>` for `dr-2023-17` (look up its `slug` in `data/garments.json`) and choose the "3D Model" tab. Check:
- In the normal view, the scan now looks smooth, with no visible triangle facets.
- **Conservator** darkens the background; one warm low light circles the dress, and folds throw shadows.
- Dragging the dial handle moves the light and stops the sweep. The sweep resumes about 5 s after letting go. Pressing exactly at the dial's centre leaves the light where it is.
- Tab to the dial: the arrow keys move the light 5° at a time.
- The Height slider raises and lowers the light.
- **Surface only** turns the dress clay-coloured; pressing it twice restores the texture. Turning Conservator off while Surface only is on restores the texture.
- Turn on reduced motion (DevTools → Rendering → Emulate CSS `prefers-reduced-motion: reduce`), reload, and switch to Conservator: no sweep, but the dial still works.
- Repeat on `testdress0` and `ens-2023-14`, and confirm no seam lines appear under the raking light.

- [ ] **Step 8: Commit**

```bash
git add components/garments/ConservatorLighting.tsx components/garments/LightDial.tsx components/garments/Garment3DViewer.tsx
git commit -m "feat: conservator raking-light mode in the 3D viewer"
```

---

### Task 5: AR view

**Files:**
- Create: `public/vendor/model-viewer-4.3.1.min.js`, `public/vendor/model-viewer-LICENSE`, `lib/loadModelViewer.ts`, `types/model-viewer.d.ts`, `components/garments/ARQRCode.tsx`, `components/garments/ARViewButton.tsx`
- Modify: `components/garments/GarmentDetailClient.tsx` (the dynamic import at line 17; the 3D tab block at about lines 188–205), `eslint.config.mjs` (`ignores`), `package.json`, `package-lock.json`

**Interfaces:**
- Consumes: `targetHeightCm`, `arScaleFactor`, `modelViewerOrientation`, `prefersARSheet` from `@/lib/arScale` (Task 2); the `Garment` type with `height_cm` (Task 2).
- Produces:
  - `loadModelViewer(): Promise<void>` from `@/lib/loadModelViewer`
  - `interface ModelViewerElement extends HTMLElement` from `@/types/model-viewer`
  - `ARQRCode` (default export). Props: `{ url: string }`.
  - `ARViewButton` (default export). Props: `{ garment: Garment }`.

- [ ] **Step 1: Vendor the model-viewer bundle**

Run it from the repo root. The tarball is unpacked in a throwaway directory outside the repo:

```bash
TMP=$(mktemp -d)
(cd "$TMP" && npm pack @google/model-viewer@4.3.1 --silent && tar -xzf google-model-viewer-4.3.1.tgz)
mkdir -p public/vendor
cp "$TMP/package/dist/model-viewer.min.js" public/vendor/model-viewer-4.3.1.min.js
cp "$TMP/package/LICENSE" public/vendor/model-viewer-LICENSE
rm -rf "$TMP"
ls -la public/vendor
grep -c 'from"three"' public/vendor/model-viewer-4.3.1.min.js || true
```

Expected: `model-viewer-4.3.1.min.js` is about 1.07 MB, and the grep prints `0`. Zero `from"three"` imports confirms the bundle carries its own three and won't touch the site's `three@0.181`.

- [ ] **Step 2: Install the QR dependency**

```bash
npm install --save-exact qrcode@1.5.4
npm install --save-exact --save-dev @types/qrcode@1.5.5
```

Expected: `package.json` lists `"qrcode": "1.5.4"` and `"@types/qrcode": "1.5.5"`.

- [ ] **Step 3: Add the element typings**

Create `types/model-viewer.d.ts`:

```ts
import type { DetailedHTMLProps, HTMLAttributes } from "react";

// The subset of <model-viewer> (https://modelviewer.dev) this site uses.
export interface ModelViewerElement extends HTMLElement {
  canActivateAR: boolean;
  scale: string;
  getDimensions(): { x: number; y: number; z: number };
  activateAR(): Promise<void>;
}

interface ModelViewerAttributes extends HTMLAttributes<ModelViewerElement> {
  src?: string;
  alt?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "ar-scale"?: "auto" | "fixed";
  "camera-controls"?: boolean;
  orientation?: string;
  "shadow-intensity"?: string;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<ModelViewerAttributes, ModelViewerElement>;
    }
  }
}
```

- [ ] **Step 4: Write the loader**

Create `lib/loadModelViewer.ts`:

```ts
// model-viewer is vendored as a self-contained bundle (it carries its own
// three.js; every npm release pins a three peer that excludes ours). It is
// injected on first use so visitors who never open AR never download it.
// A script inserted by our own nonced bundle is allowed by the
// 'strict-dynamic' CSP set in proxy.ts.
const MODEL_VIEWER_SRC = "/vendor/model-viewer-4.3.1.min.js";

let pending: Promise<void> | null = null;

export function loadModelViewer(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadModelViewer is browser-only"));
  }
  if (customElements.get("model-viewer")) return Promise.resolve();

  if (!pending) {
    pending = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.type = "module";
      script.src = MODEL_VIEWER_SRC;
      script.onload = () => {
        customElements.whenDefined("model-viewer").then(() => resolve(), reject);
      };
      script.onerror = () => {
        // Forget the failed attempt so "Try again" injects a fresh script
        pending = null;
        script.remove();
        reject(new Error("model-viewer failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return pending;
}
```

- [ ] **Step 5: Write the QR component**

Create `components/garments/ARQRCode.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";

interface Props {
  url: string;
}

const QR_SIZE_PX = 160;

// QR code for handing the garment page to a phone, rendered as a data-URL
// image (CSP img-src already allows data:). Falls back to the plain URL if
// generation fails.
export default function ARQRCode({ url }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { margin: 1, width: QR_SIZE_PX * 2, errorCorrectionLevel: "M" }).then(
      (png) => {
        if (!cancelled) setDataUrl(png);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (failed) {
    return <p className="text-xs text-archive-muted break-all max-w-[12rem]">{url}</p>;
  }
  if (!dataUrl) {
    return <div className="w-40 h-40 bg-archive-surface-muted animate-pulse" aria-hidden />;
  }
  return (
    <Image
      src={dataUrl}
      alt={`QR code linking to ${url}`}
      width={QR_SIZE_PX}
      height={QR_SIZE_PX}
      unoptimized
      className="bg-white p-2"
    />
  );
}
```

- [ ] **Step 6: Write the AR button**

Create `components/garments/ARViewButton.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Box, X } from "lucide-react";
import type { Garment } from "@/types/garment";
import type { ModelViewerElement } from "@/types/model-viewer";
import { arScaleFactor, modelViewerOrientation, prefersARSheet, targetHeightCm } from "@/lib/arScale";
import { loadModelViewer } from "@/lib/loadModelViewer";
import ARQRCode from "./ARQRCode";

type Mode = "closed" | "sheet" | "qr";
type LoadState = "loading" | "ready" | "error";

interface Props {
  garment: Garment;
}

// "View in your space": on phones and tablets, a full-screen <model-viewer>
// sheet that places the scan in the room at its real height; on desktops, a
// QR code that hands the page to a phone.
export default function ARViewButton({ garment }: Props) {
  const [mode, setMode] = useState<Mode>("closed");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [attempt, setAttempt] = useState(0);
  const [arUnavailable, setArUnavailable] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const viewerRef = useRef<ModelViewerElement>(null);

  // Load the library when the sheet opens (and again on "Try again")
  useEffect(() => {
    if (mode !== "sheet") return;
    let cancelled = false;
    loadModelViewer().then(
      () => {
        if (!cancelled) setLoadState("ready");
      },
      () => {
        if (!cancelled) setLoadState("error");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [mode, attempt]);

  // Once the model loads, scale it to the garment's real height (measured
  // once at the model's native scale) and record whether AR is available
  useEffect(() => {
    const viewer = viewerRef.current;
    if (mode !== "sheet" || loadState !== "ready" || !viewer) return;
    let scaled = false;
    const onLoad = () => {
      if (!scaled) {
        const s = arScaleFactor(viewer.getDimensions().y, targetHeightCm(garment));
        viewer.scale = `${s} ${s} ${s}`;
        scaled = true;
      }
      setArUnavailable(!viewer.canActivateAR);
    };
    // The element is created in the same commit as this effect, so its
    // model can't have finished loading yet; listening is enough.
    viewer.addEventListener("load", onLoad);
    return () => viewer.removeEventListener("load", onLoad);
  }, [mode, loadState, garment]);

  // Escape closes the sheet or the QR popover
  useEffect(() => {
    if (mode === "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMode("closed");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  if (!garment.model3d_url) return null;

  const open = () => {
    const touch = prefersARSheet({
      maxTouchPoints: navigator.maxTouchPoints,
      coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    });
    setPageUrl(window.location.origin + window.location.pathname);
    setArUnavailable(false);
    setLoadState("loading");
    setMode(touch ? "sheet" : "qr");
  };

  const retry = () => {
    setLoadState("loading");
    setAttempt((n) => n + 1);
  };

  const close = () => setMode("closed");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center gap-2 px-4 py-3 border border-archive-border text-xs uppercase tracking-[0.2em] text-archive-fg hover:border-archive-border-hover transition-colors"
      >
        <Box className="w-4 h-4" aria-hidden />
        View in your space
      </button>

      {mode === "qr" && (
        <div
          role="dialog"
          aria-label="Open on your phone"
          className="mt-3 inline-flex flex-col items-center gap-3 border border-archive-border bg-archive-surface p-4"
        >
          <ARQRCode url={pageUrl} />
          <p className="text-xs text-archive-muted max-w-[12rem] text-center">
            Open on your phone to see it in your room
          </p>
          <button
            type="button"
            onClick={close}
            className="text-xs uppercase tracking-[0.2em] text-archive-muted hover:text-archive-fg"
          >
            Close
          </button>
        </div>
      )}

      {mode === "sheet" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${garment.label} in augmented reality`}
          className="fixed inset-0 z-50 flex flex-col bg-archive-bg"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-archive-border">
            <p className="text-xs uppercase tracking-[0.2em] text-archive-fg">{garment.label}</p>
            <button type="button" onClick={close} aria-label="Close" className="text-archive-fg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1">
            {loadState === "loading" && (
              <p className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-archive-muted">
                Loading…
              </p>
            )}

            {loadState === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <p className="text-sm text-archive-muted">AR couldn&apos;t load.</p>
                <button
                  type="button"
                  onClick={retry}
                  className="px-4 py-2 border border-archive-border text-xs uppercase tracking-[0.2em] text-archive-fg"
                >
                  Try again
                </button>
              </div>
            )}

            {loadState === "ready" && (
              <model-viewer
                ref={viewerRef}
                src={garment.model3d_url}
                alt={garment.label}
                ar
                ar-modes="webxr scene-viewer quick-look"
                ar-scale="fixed"
                camera-controls
                orientation={modelViewerOrientation(garment.model3d_rotationY)}
                style={{ width: "100%", height: "100%" }}
              >
                <button
                  slot="ar-button"
                  type="button"
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 bg-archive-fg text-archive-bg text-xs uppercase tracking-[0.2em]"
                >
                  Place in your room
                </button>
              </model-viewer>
            )}

            {arUnavailable && (
              <p className="absolute bottom-6 inset-x-4 text-center text-xs text-archive-muted">
                AR isn&apos;t supported on this device. You can still turn the garment in 3D.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Put the button on the detail page**

In `components/garments/GarmentDetailClient.tsx`, under the existing `Garment3DViewer` dynamic import (line 17), add:

```tsx
const ARViewButton = dynamic(() => import("./ARViewButton"), { ssr: false });
```

In the 3D tab block, directly after the closing `</ErrorBoundary>` and before the block's closing `</div>`, add:

```tsx
                  <div className="mt-4">
                    <ARViewButton garment={garment} />
                  </div>
```

- [ ] **Step 8: Typecheck, lint and test**

Run: `npx tsc --noEmit && npm run lint && npm test`
Before running, add `"public/vendor/**",` to the `ignores` array in `eslint.config.mjs` (after `"next-env.d.ts",`). It is third-party minified code and would otherwise fail `--max-warnings=0`.

Expected: no errors, zero warnings, all tests pass.

- [ ] **Step 9: Check it in the browser**

Run: `npm run dev`.
- **Desktop:** open the `dr-2023-17` garment page's 3D tab and click **View in your space**. A QR popover appears. Scan it with a phone: it opens the same garment page. In DevTools → Network, confirm `model-viewer-4.3.1.min.js` was **not** requested.
- **Touch emulation:** DevTools → device toolbar → a phone preset, then reload. Clicking the button opens the full-screen sheet; the bundle loads and the garment appears, facing front. Desktop Chrome has no AR, so the "AR isn't supported" line shows. That's expected.
- **Load failure (Review Focus 5):** in DevTools → Network → right-click the bundle → Block request URL, then reopen the sheet. "AR couldn't load" and "Try again" appear. Unblock the URL and press **Try again**: the garment loads.
- Check the console has no CSP violations.
- Escape closes the sheet and the popover.

- [ ] **Step 10: Commit**

```bash
git add eslint.config.mjs public/vendor lib/loadModelViewer.ts types/model-viewer.d.ts components/garments/ARQRCode.tsx components/garments/ARViewButton.tsx components/garments/GarmentDetailClient.tsx package.json package-lock.json
git commit -m "feat: View in your space AR sheet with desktop QR handoff"
```

---

### Task 6: Full verification

**Files:** none new.

- [ ] **Step 1: Run the whole suite and a production build**

```bash
npm test && npx tsc --noEmit && npm run lint && npm run build
```

Expected: all pass. The build shows no new warnings for the detail page.

- [ ] **Step 2: Test real AR on devices**

Deploy a Vercel preview (`git push -u origin feature/conservator-ar`; the Vercel GitHub integration builds it) and open the preview URL of the `dr-2023-17` page:
- **Android (Chrome):** **Place in your room** launches Scene Viewer or WebXR. The garment stands at about 1.45 m (the fallback height), so check it against a tape measure. It faces you.
- **iPhone (Safari):** **Place in your room** opens Quick Look with the same size and facing.
- Repeat the conservator checks from Task 4 Step 7 on the phone: dragging the dial by touch works and doesn't scroll the page.

- [ ] **Step 3: Record what's still open**

Note in the PR description:
- `DRESS_FORM_HEIGHT_CM = 145` is a placeholder until the dress form is measured.
- No garment has `height_cm` yet.
- The compare page still passes no `modelUrl`, so it shows the placeholder (out of scope).
