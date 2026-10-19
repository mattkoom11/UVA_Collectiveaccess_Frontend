# Conservator Mode & AR View Design
**Date:** 2026-10-19
**Status:** Approved

## Overview

Two additions to the garment 3D viewer, both aimed at making the scanned garments more engaging for visitors and showing off the photogrammetry:

1. **Conservator mode:** a raking-light view that reveals folds, seams, repairs and distortion, the way textile conservators inspect garments.
2. **AR view:** place a scanned garment in the visitor's own room at true scale, from a phone or tablet.

This is sub-project A of a larger set of frontend ideas (timeline morph, collection fingerprint and photo search follow as separate specs; cloth-physics runway is deferred).

### Constraints

- Free and open-source tooling only.
- Stack: Next 16, React 19, three 0.181, @react-three/fiber 9, @react-three/drei 10, Vitest 4.
- 9 garments have GLBs today (4 archive pieces, 5 test dresses), 3.6–5.3 MB each, 65k–97k vertices.
- **The GLBs contain no `NORMAL` attribute and no normal maps.** GLTFLoader therefore falls back to flat shading, and the albedo textures carry the capture lighting baked in.

### Success criteria

- Conservator mode visibly shows fabric folds and surface relief on every garment with a GLB, on desktop and mobile.
- AR places a garment at its real height on Android (Scene Viewer / WebXR) and iOS (Quick Look).
- Garments without a GLB, devices without AR, and visitors with `prefers-reduced-motion` all get a working, sensible experience.

---

## 1. Shared change: smooth normals

### Problem
Without a `NORMAL` attribute every mesh renders flat-shaded. Under any directional light the triangle facets show; under a raking light they dominate.

### Solution
In `GarmentModel` (`components/garments/Garment3DViewer.tsx`), after cloning the scene, traverse it and compute **welded** normals on every mesh whose geometry lacks a `normal` attribute, then set `material.flatShading = false` and `material.needsUpdate = true`. This runs once per load, in every mode; the regular gallery view also gains smooth shading.

The meshes are indexed but split along UV seams (about 65k–98k vertices for 100k triangles), so three's `computeVertexNormals()` would leave hard shading lines along every texture seam, and a raking light makes those obvious. `lib/meshNormals.ts` instead groups vertices by quantized position, accumulates area-weighted face normals per group, and writes the averaged normal back to every vertex in the group. UVs and the vertex layout are untouched.

The geometry is shared with drei's `useGLTF` cache, so computing normals on the shared geometry is intentional: the "lacks a `normal` attribute" check makes it run once, and remounts reuse the result.

---

## 2. Conservator mode

### Behaviour
- A **"Conservator"** toggle button sits in the viewer's top-right corner. Off by default.
- When on, the gallery rig (ambient 0.9, two spotlights, three point lights) is replaced by:
  - one **directional light** at a low elevation (default 12° above the floor plane), casting shadows;
  - ambient light at 0.05 so unlit sides read as near-black, not pure black.
- The light **sweeps** around the garment at one revolution per 20 s.
- A **dial overlay** (bottom-right, 96 px circle with a draggable handle) shows the light's azimuth. Dragging the handle stops the sweep and sets the azimuth directly. The sweep resumes 5 s after the last drag.
- An **elevation slider** under the dial ranges 5°–45°.
- A **"Surface only"** sub-toggle (visible only while conservator mode is on) swaps each mesh's material for a neutral clay `MeshStandardMaterial` (`#bdb5a6`, roughness 0.85). This removes the baked capture lighting so geometry alone carries the image. Original materials are restored when it is switched off.
- Under `prefers-reduced-motion: reduce` the sweep never starts; the dial and slider still work.

### Limits
Conservator mode reveals geometry at mesh resolution: folds, seams, puckering, distortion, losses. It cannot show thread-level weave, which the meshes do not contain. Baking a normal map from the dense scan in the garment-capture pipeline would add that later and is out of scope here.

### Components
- **`components/garments/ConservatorLighting.tsx`**: R3F component. Props: `azimuthDeg`, `elevationDeg`. Renders the directional light and dim ambient light. The light orbits at a fixed radius (6 units) around the origin.
- **`components/garments/LightDial.tsx`**: DOM overlay. Props: `azimuthDeg`, `elevationDeg`, `onAzimuthChange`, `onElevationChange`, `onInteract`. Pointer events with pointer capture so it works on touch. Keyboard: arrow keys move the azimuth 5°, and the slider is a native `<input type="range">`.
- **`lib/conservatorLight.ts`**: pure functions:
  - `lightPosition(azimuthDeg, elevationDeg, radius)` → `[x, y, z]`
  - `pointerToAzimuth(dx, dy)` → degrees in [0, 360)
  - `sweepAzimuth(startDeg, elapsedSec, periodSec)` → degrees in [0, 360)
- **`Garment3DViewer.tsx`** holds state `conservator: boolean`, `surfaceOnly: boolean`, `azimuthDeg`, `elevationDeg`, `lastInteractAt`. A small `useFrame` driver advances the sweep when it is active.

The existing gallery lights move into a `GalleryLighting` component inside the same file, so the two rigs swap cleanly.

---

## 3. AR view

### Behaviour
- A **"View in your space"** button appears under the viewer when the garment has a `model3d_url`.
- **Touch device** (`navigator.maxTouchPoints > 0` and `(pointer: coarse)` matches): tapping opens a full-screen sheet containing `<model-viewer>` with `ar`, `ar-modes="webxr scene-viewer quick-look"`, `ar-scale="fixed"`, and the garment's GLB. A **"Place in your room"** button (model-viewer's `ar-button` slot, shown only when `canActivateAR` is true) starts AR. AR can't start automatically because the library loads asynchronously, which uses up the tap's user-gesture activation. If the model loads and `canActivateAR` is false, the sheet says "AR isn't supported on this device" and still shows the garment in 3D.
- **Other devices (desktop):** the button opens a popover with a QR code for the current garment page URL and the line "Open on your phone to see it in your room".
- The device check uses the pointer heuristic rather than `canActivateAR`, because that property only exists after model-viewer has loaded, and desktop visitors should never download it.
- iOS USDZ is generated on the fly by model-viewer; no new files go in `public/models/`.

### Scale
- New optional field on `Garment` (`types/garment.ts`): `height_cm?: number`, the garment's real height as displayed on its form, in centimetres.
- New constant `DRESS_FORM_HEIGHT_CM = 145` in `lib/arScale.ts`, the fallback when `height_cm` is absent. **Matthew to confirm against the actual dress form.**
- `lib/arScale.ts` exports `arScaleFactor(rawModelHeight, heightCm)`, which returns the uniform scale that makes the model's bounding-box height equal `heightCm / 100` metres. The raw model height is read from the loaded model in model-viewer (`getDimensions()`), and the factor is applied via its `scale` attribute.
- `model3d_rotationY` is applied via model-viewer's `orientation` attribute so the garment faces the visitor.
- `targetHeightCm(garment)` returns `height_cm` only when it is a finite number between 20 and 300; anything else (missing, zero, negative, or a value plainly entered in millimetres) falls back to `DRESS_FORM_HEIGHT_CM`.
- `data/garments.json` has no measurement fields today, so no `height_cm` values are added in this work; every garment uses the fallback until Matthew enters real heights.

### Components
- **`components/garments/ARViewButton.tsx`**: client component. Props: `garment: Garment`. Loaded with `next/dynamic` (`ssr: false`) from the detail page.
- **`components/garments/ARQRCode.tsx`**: renders the QR code as a data-URL image with the `qrcode` package; falls back to showing the URL as text if generation fails.
- **`lib/loadModelViewer.ts`**: injects the vendored model-viewer bundle as a module `<script>` the first time the sheet opens and resolves when the `model-viewer` element is defined. Concurrent calls share one promise; a failed load clears it so "Try again" can retry.
- **`lib/arScale.ts`**: the scale and orientation helpers, the height fallback, and the device heuristic.
- **`types/model-viewer.d.ts`**: JSX typings for the `<model-viewer>` element.

### Dependencies
- **model-viewer is vendored, not installed from npm.** Every recent `@google/model-viewer` release pins a `three` peer that excludes the site's `three@0.181` (4.1.0 wants `^0.172`, 4.2.0 `^0.182`, 4.3.x and 4.4.0 `^0.183`). The self-contained bundle `dist/model-viewer.min.js` from **4.3.1** (released 2026-06-04) carries its own copy of three, so it is copied into `public/vendor/model-viewer-4.3.1.min.js` alongside its Apache-2.0 licence. It is served from the site's own origin. The page CSP (`script-src 'nonce-…' 'strict-dynamic'` in `proxy.ts`) allows it, because a trusted script inserts it. The duplicate three only loads for visitors who open AR.
- `qrcode@1.5.4` (MIT) and `@types/qrcode@1.5.5`.

---

## 4. Placement

- **Garment detail page, 3D tab** (`GarmentDetailClient.tsx`): conservator toggle inside the viewer; AR button below it.
- **Compare page** (`ComparePageClient.tsx`): renders `Garment3DViewer` without a `modelUrl`, so it shows the procedural placeholder and the conservator toggle stays hidden there. Passing the model URL on the compare page is a separate change, outside this spec. The AR button is not shown there.
- **Museum hall:** out of scope.

---

## 5. Error handling

- **GLB fails to load:** unchanged; the existing error boundary handles it. The conservator toggle and AR button hide when there is no model.
- **No `height_cm`:** use `DRESS_FORM_HEIGHT_CM`.
- **`getDimensions()` returns zero height:** skip scaling and show the model at its native size rather than dividing by zero.
- **model-viewer fails to import** (network): the sheet shows "AR couldn't load. Try again." with a retry button.
- **AR session refused** by the device: model-viewer stays open in 3D, so the visitor still sees the garment.

---

## 6. Testing

**Unit (Vitest):**
- `lib/conservatorLight.test.ts`: `lightPosition` at 0°/90°/180° azimuth and 0°/90° elevation; `pointerToAzimuth` covers all four quadrants and wraps to [0, 360); `sweepAzimuth` wraps after one period.
- `lib/arScale.test.ts`: the scale factor for a known model height; the fallback to `DRESS_FORM_HEIGHT_CM` for missing, zero, negative, NaN and out-of-range heights; zero raw height returns 1; the orientation string; the device heuristic.
- `lib/meshNormals.test.ts`: split vertices at the same position get identical normals; a flat quad gets normals along its face normal; a geometry that already has normals is left alone.
- `lib/surfaceMaterial.test.ts`: turning Surface-only on swaps materials and remembers the originals; turning it on twice keeps the real originals; turning it off restores them.

**Manual:**
- Toggle conservator on and off on all 9 garments; check that the facets are gone and folds read clearly.
- Check that Surface-only swaps and restores the materials.
- Turn on reduced motion in the OS and confirm the sweep stays off.
- Check that the dial works with touch on a phone and with the arrow keys.
- AR on an Android phone and an iPhone: check the true-scale placement against a tape measure for one archive piece.
- On desktop, scan the QR code and check that it lands on the same garment page.

---

## Files changed

| File | Change |
|---|---|
| `components/garments/Garment3DViewer.tsx` | Normals fix, `GalleryLighting` extraction, conservator state and toggles |
| `components/garments/ConservatorLighting.tsx` | New |
| `components/garments/LightDial.tsx` | New |
| `components/garments/ARViewButton.tsx` | New |
| `components/garments/ARQRCode.tsx` | New |
| `components/garments/GarmentDetailClient.tsx` | Render `ARViewButton` under the viewer |
| `lib/conservatorLight.ts` + test | New |
| `lib/arScale.ts` + test | New |
| `types/garment.ts` | Add `height_cm?: number` |
| `lib/meshNormals.ts` + test | New: welded normals |
| `lib/surfaceMaterial.ts` + test | New: Surface-only material swap |
| `lib/loadModelViewer.ts` | New |
| `types/model-viewer.d.ts` | New |
| `public/vendor/model-viewer-4.3.1.min.js`, `public/vendor/model-viewer-LICENSE` | New, vendored |
| `package.json` | Add `qrcode`, `@types/qrcode` |
