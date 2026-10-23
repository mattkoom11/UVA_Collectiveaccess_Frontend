# Garment Orientation Review Implementation Plan

## Overview

This plan adds an admin-only `/admin/orientation` page that works on the dev server only. An admin turns each garment until both of its presentation poses look right: the runway pose (front at 4:30) and the item-page pose (front at 7:30). Clicking Approve writes `model3d_rotationY` and `orientationReviewed: true` to `data/garments.json`. Static garments marked `orientationReviewed: false` stay off the runway. All 12 existing garments start unreviewed.

## Current State Analysis

Full detail is in [the research doc](../research/2026-10-23-garment-orientation-flow.md). In short:

- `model3d_rotationY` is a yaw in degrees. It is calibrated so that a scan's front faces +z.
  - The runway shows it at `π/4 + rotationY` ([FlagshipGarment.tsx:56-58](../../../components/museum/FlagshipGarment.tsx), [hallLayout.ts:127](../../../lib/hallLayout.ts)).
  - The item page shows it at `rotationY − 45°` ([Garment3DViewer.tsx:43,213-216](../../../components/garments/Garment3DViewer.tsx)).
  - AR uses the raw value.
- `isFlagship()` ([museum.ts:58-60](../../../lib/museum.ts)) is the single runway gate: `featuredOnRunway === true` plus a preview model.
- `data/garments.json` is a build-time import ([garments.ts:1](../../../lib/garments.ts)).
  - It holds 12 records, all `featuredOnRunway: true`.
  - None of them has an era, date or photo.
  - The file uses 2-space indentation and ends with a newline.
  - No code writes it today.
- CA-sourced garments carry neither `model3d_rotationY` nor any review flag.
- Admin pages are client pages wrapped in `AdminAuthGate`. Authorization is enforced per API route by `verifyAdminSession(req)`, and the session cookie is scoped to `Path=/api/admin` ([adminAuth.ts:101-105](../../../lib/adminAuth.ts)).
- The only existing file-write pattern is the atomic tmp-and-rename write in `saveDiskCache` ([garments.ts:36-52](../../../lib/garments.ts)).

## Desired End State

- `Garment.orientationReviewed?: boolean` exists.
- `isFlagship()` returns false when `orientationReviewed === false`. A garment without the field (any CA garment) behaves as it does today.
- All 12 records in `data/garments.json` carry `"orientationReviewed": false`. Their existing `model3d_rotationY` values are unchanged and serve as the starting point for review.
- **`/admin/orientation`**, behind `AdminAuthGate`:
  - A list of garments with a reviewed or unreviewed marker.
  - Selecting a garment (kept in `?id=`) shows two canvases: "Runway (4:30)" and "Item page (7:30)".
  - Buttons for −45°, −5°, +5° and +45°, a readout of the draft angle, and Approve.
- **`POST /api/admin/orientation`** takes `{ id, rotationY }`.
  - It returns 404 in production and 401 without a session.
  - It returns 400 for a bad body or an unknown id.
  - Otherwise it rewrites `data/garments.json` atomically and returns `{ ok: true, garment: { id, model3d_rotationY, orientationReviewed } }`.
- After approval, the garment stands on the homepage runway (New Acquisitions stage) at the approved angle.

### Key Discoveries:
- Both poses are fixed offsets from the stored value: `+45°` on the runway and `−45°` on the item page. A single preview component with a `yawDeg` prop and a fixed camera on +z reproduces both poses. Seen from that camera, front-at-+z is 6:00, so +45° puts the front at 4:30 and −45° puts it at 7:30.
- `fitToHeight` ([hallLayout.ts:240-246](../../../lib/hallLayout.ts)) is pure and exported. The preview can reuse it and rotate an enclosing group, which is the same order the hall and the viewer use.
- Every review garment is undated with no photo, so an unreviewed one becomes `unplaced` in `buildMuseumLayout`. With zero reviewed garments, `stage` is `null` and the hall shows four "Coming soon" stubs. This is expected.
- Saving `garments.json` triggers a dev-server hot reload of every importer. Keeping the selection in `?id=` makes the page land back on the same garment.
- Two live canvases at a time keeps the page well under the browser's WebGL context limit (around 16).

## What We're NOT Doing

- No CA write-back, and no reading of `model3d_rotationY` or `orientationReviewed` from CA.
- No writes in production. The endpoint returns 404 there and the page shows a notice.
- No "Unapprove" button. Re-approving overwrites the stored angle.
- No changes to the item-page or AR angle offsets.
- No free-drag or orbit rotation in the previews (buttons only), and no lighting fidelity with the hall.
- No change to how unreviewed garments appear in `/collection` or on their item pages (both unchanged).

## Implementation Approach

The work runs bottom-up: pure logic with tests first, then the write endpoint, then the UI. Each phase leaves the app working.

---

## Phase 1: Data Model and Runway Gate

### Overview
Add the flag, gate the runway on it, mark all 12 garments unreviewed, and add pure orientation helpers with tests.

### Changes Required:

#### 1. Type
**File**: `types/garment.ts`
**Changes**: Add the following after `model3d_rotationY` (line 65):

```ts
  orientationReviewed?: boolean; // Set true from /admin/orientation once both poses look right. false keeps a static-data garment off the runway; CA garments omit it
```

#### 2. Runway gate
**File**: `lib/museum.ts`
**Changes**: Extend `isFlagship` and its doc comment.

```ts
/**
 * A flagship stands on the runway: a curator marked it featured_on_runway in
 * CollectiveAccess, and it has a 3D file the site can load. A flagged record
 * with no usable file stays off the runway rather than leaving an empty spot.
 * A static garment whose orientation hasn't been approved yet
 * (orientationReviewed: false) also stays off, so it never faces the wrong way.
 */
export function isFlagship(garment: Garment): boolean {
  return (
    garment.featuredOnRunway === true &&
    garment.orientationReviewed !== false &&
    getPreviewModelUrl(garment) !== undefined
  );
}
```

#### 3. Orientation helpers
**File**: `lib/orientation.ts` (new)

```ts
import type { Garment } from "@/types/garment";

// The presentation turns each view adds on top of a garment's calibrated
// front (model3d_rotationY, front facing +z). Seen from a camera on +z:
// the runway faces 4:30 (hallLayout's π/4 slot), the item page 7:30
// (Garment3DViewer's VIEWER_INITIAL_ANGLE_OFFSET_DEGREES).
export const RUNWAY_OFFSET_DEGREES = 45;
export const ITEM_PAGE_OFFSET_DEGREES = -45;

/** Maps any angle to (-180, 180]. */
export function normalizeDegrees(deg: number): number {
  const d = ((deg % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
}

export function runwayYawDeg(rotationY = 0): number {
  return rotationY + RUNWAY_OFFSET_DEGREES;
}

export function itemPageYawDeg(rotationY = 0): number {
  return rotationY + ITEM_PAGE_OFFSET_DEGREES;
}

/**
 * Returns the records with garment `id` set to the approved angle and marked
 * reviewed, or null if no record has that id. Other records and key order are
 * untouched, so the rewritten JSON diffs cleanly.
 */
export function applyOrientationReview<T extends Pick<Garment, "id">>(
  records: T[],
  id: string,
  rotationY: number,
): T[] | null {
  if (!records.some((r) => r.id === id)) return null;
  return records.map((r) =>
    r.id === id ? { ...r, model3d_rotationY: normalizeDegrees(rotationY), orientationReviewed: true } : r,
  );
}
```

Note: spreading keeps existing keys in place. `orientationReviewed` already sits right after `model3d_rotationY` in every record (change 4), so its position is kept too.

#### 4. Data
**File**: `data/garments.json`
**Changes**: In all 12 records, insert `"orientationReviewed": false` directly after `"model3d_rotationY"`. Do this with a one-off Node script that preserves key order, then rewrites with `JSON.stringify(data, null, 2) + "\n"`. Leave the existing `model3d_rotationY` values as they are.

#### 5. Tests
**File**: `lib/museum.test.ts`, in `describe("isFlagship")`:

```ts
  it("keeps an unreviewed orientation off the runway; garments without the flag are unaffected", () => {
    expect(isFlagship(makeGarment({ featuredOnRunway: true, orientationReviewed: false, ...MODEL }))).toBe(false);
    expect(isFlagship(makeGarment({ featuredOnRunway: true, orientationReviewed: true, ...MODEL }))).toBe(true);
    expect(isFlagship(makeGarment({ featuredOnRunway: true, ...MODEL }))).toBe(true);
  });
```

Also add a `buildMuseumLayout` case: an undated, unreviewed flagship lands in `unplaced`, not in `acquisitions`.

**File**: `lib/orientation.test.ts` (new):
- `normalizeDegrees`:
  - 270 → −90, −90 → −90, 180 → 180, −180 → 180, 360 → 0, 405 → 45.
  - −0 maps to 0: use `toBe(0)` after `+ 0`, or assert `Object.is(x, -0) === false`.
- The two pose helpers: `runwayYawDeg(135) === 180` and `itemPageYawDeg(135) === 90`. Each defaults to 0 when the argument is undefined.
- `applyOrientationReview`:
  - It returns null for an unknown id.
  - It sets the angle (normalized) and the flag on the target only.
  - It leaves other records identical (same object references).
  - It does not mutate the input.

### Success Criteria:

#### Automated Verification:
- [x] Tests pass: `npm test`
- [x] Type check passes: `npx tsc --noEmit`
- [x] Lint passes: `npm run lint`
- [x] Build passes: `npm run build`
- [x] Every record has the flag: `node -e 'const g=require("./data/garments.json");process.exit(g.length===12&&g.every(x=>x.orientationReviewed===false)?0:1)'`
- [x] The only change to `garments.json` is the 12 inserted lines: `git diff --stat data/garments.json` shows `12 insertions(+)` and 0 deletions

#### Manual Verification:
- [x] The homepage hall loads with no errors and no flagships (four "Coming soon" stubs, no New Acquisitions stage)
- [x] `/collection` and `/garments/test-dress-0` still show the garments and the 3D viewer as before

**Implementation Note**: After automated verification passes, pause for manual confirmation before Phase 2.

---

## Phase 2: Write Endpoint

### Overview
Add a dev-only, session-gated route that approves one garment's orientation in `data/garments.json`.

### Changes Required:

#### 1. File write helper
**File**: `lib/garmentsFile.ts` (new, server-only)

```ts
import fs from "fs";
import path from "path";

// The checked-in static garment data. Written only by the dev-only
// /api/admin/orientation route; production never writes it.
const GARMENTS_FILE = path.join(process.cwd(), "data", "garments.json");

export function readGarmentsFile(): Record<string, unknown>[] {
  return JSON.parse(fs.readFileSync(GARMENTS_FILE, "utf-8"));
}

// Same tmp-and-rename as saveDiskCache, so a crash mid-write never leaves a
// half-written file. 2-space indent + trailing newline match the checked-in format.
export function writeGarmentsFile(records: unknown[]): void {
  const tmp = `${GARMENTS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(records, null, 2) + "\n", "utf-8");
  fs.renameSync(tmp, GARMENTS_FILE);
}
```

The route reads the file fresh from disk instead of using the imported module, because a hot reload may lag behind the file.

#### 2. Route
**File**: `app/api/admin/orientation/route.ts` (new)

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/adminAuth";
import { applyOrientationReview } from "@/lib/orientation";
import { readGarmentsFile, writeGarmentsFile } from "@/lib/garmentsFile";

// Approves a garment's model3d_rotationY by rewriting data/garments.json.
// Dev server only: production serves a built bundle that never re-reads the
// file, and its filesystem may be read-only.
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Not available in production" }, { status: 404 });
  }
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let id: unknown;
  let rotationY: unknown;
  try {
    ({ id, rotationY } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof id !== "string" || typeof rotationY !== "number" || !Number.isFinite(rotationY)) {
    return NextResponse.json({ ok: false, error: "Expected { id: string, rotationY: number }" }, { status: 400 });
  }

  try {
    const updated = applyOrientationReview(readGarmentsFile() as { id: string }[], id, rotationY);
    if (!updated) {
      return NextResponse.json({ ok: false, error: `No garment with id ${id}` }, { status: 400 });
    }
    writeGarmentsFile(updated);
    const garment = updated.find((g) => g.id === id) as { id: string; model3d_rotationY: number; orientationReviewed: boolean };
    return NextResponse.json({
      ok: true,
      garment: { id, model3d_rotationY: garment.model3d_rotationY, orientationReviewed: garment.orientationReviewed },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Write failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
```

### Success Criteria:

#### Automated Verification:
- [x] Tests, type check, lint and build pass (as in Phase 1)
- [x] Requests without a session get 401. With `npm run dev` running, this should print `401`: `curl -s -o /dev/null -w '%{http_code}' -X POST localhost:3000/api/admin/orientation -H 'Content-Type: application/json' -d '{"id":"dr-2023-17","rotationY":0}'`
- [x] With a session cookie from `POST /api/admin/auth` (dev default password):
  - Unknown id → 400
  - `rotationY: "x"` → 400
  - A valid body → 200, and `git diff data/garments.json` shows only that record's `orientationReviewed` (and, if changed, `model3d_rotationY`)
- [x] Revert the curl test write: `git checkout data/garments.json`, then re-apply the Phase 1 data change. Alternatively, run the curl test before committing Phase 1 data and restore afterwards.

#### Manual Verification:
- [x] After the approve call, the dev server hot-reloads and that garment appears on the homepage New Acquisitions stage, facing 4:30
- [x] No leftover `data/garments.json.*.tmp` files

**Implementation Note**: Pause for manual confirmation before Phase 3.

---

## Phase 3: Review Page

### Overview
Build the admin UI: a garment list, two pose previews, angle controls and Approve.

### Changes Required:

#### 1. Preview canvas
**File**: `components/admin/OrientationPreview.tsx` (new, `"use client"`)

- Props: `{ url: string; yawDeg: number; label: string }`.
- It renders an R3F `<Canvas>` (fixed height, `dpr={[1, 1.5]}`) containing:
  - A `PerspectiveCamera` at `[0, 1.1, 3.6]` looking at `[0, 0.85, 0]`, with fov 40.
  - `ambientLight` plus one `directionalLight`, and a floor disc for grounding.
  - A small marker on the floor at +z labelled "visitor / camera", so "front toward camera" is readable.
  - `<group rotation={[0, yawDeg * Math.PI / 180, 0]}>` wrapping a fitted model. The model uses `useGLTF(url)`, `scene.clone(true)` and `fitToHeight(box, 1.7)`, the same as `FittedModel` in `FlagshipGarment`.
  - A Suspense fallback, wrapped in the existing `components/garments/ErrorBoundary`.
- A caption shows `label` and the absolute yaw.
- Model loading is shared, because `useGLTF` caches by URL, so two canvases cost one fetch.

#### 2. Page
**File**: `app/admin/orientation/page.tsx` (new, `"use client"`)

- `AdminOrientationPage` returns `<AdminAuthGate><OrientationReview /></AdminAuthGate>`, wrapped in `PageLayout` the same way `/admin` is.
- `OrientationReview`:
  - **Garment list.** `getAllGarments().filter(g => getPreviewModelUrl(g) && g.featuredOnRunway)` gives the 12 today. It renders as a side list showing label, id, a ✓ or ○ marker for `orientationReviewed`, and the stored angle.
  - **Selection.** The selected garment comes from `useSearchParams().get("id")` and defaults to the first unreviewed garment. Clicking a list item calls `router.replace("?id=…")`. Wrap the content that reads search params in `<Suspense>`, as Next requires.
  - **Draft angle.** `useState`, reset to the stored `model3d_rotationY ?? 0` whenever the selected id or the stored value changes (key the panel by `${id}:${stored}`).
  - **Controls.** Buttons for −45°, −5°, +5° and +45° adjust the draft, using the same `archive-*` button classes as `/admin`. A readout shows "Stored N° → Draft M°" with `normalizeDegrees` applied. A Reset button returns the draft to the stored value.
  - **Front preview** (added during implementation): `<OrientationPreview yawDeg={draft} targetDeg={0} label="Front (6:00)" />`, first in a three-column row. It shows the calibrated angle with no offset, so a correct angle shows the front head-on.
  - **Previews.** `<OrientationPreview yawDeg={runwayYawDeg(draft)} label="Runway (4:30)" />` and `<OrientationPreview yawDeg={itemPageYawDeg(draft)} label="Item page (7:30)" />`, side by side on md+ screens and stacked on mobile. A one-line hint underneath: "Front should face toward the camera's right (runway) and left (item page)."
  - **Approve.**
    - It POSTs `{ id, rotationY: draft }` to `/api/admin/orientation` with `credentials: "same-origin"`, showing a status line ("Saving…", "Approved — reloading data…" or "Error: …").
    - It is disabled while saving.
    - When `process.env.NODE_ENV === "production"`, the page shows "Orientation review runs on the dev server only" and Approve is disabled. The API's 404 enforces the same rule regardless.
  - After a successful save, the dev server's hot reload re-imports `garments.json`. The list's ✓ updates and the selection survives because of `?id=`. If hot reload doesn't re-render the data, call `router.refresh()` as a fallback.

#### 3. Dashboard link
**File**: `app/admin/page.tsx`
**Changes**: In the Actions grid, add a third card titled "Garment Orientation" with the text "Review each scan's runway and item-page pose", linking with `next/link` to `/admin/orientation`. Use the same card classes as the existing cards.

### Success Criteria:

#### Automated Verification:
- [x] Tests, type check, lint and build pass
- [x] `curl -s -o /dev/null -w '%{http_code}' localhost:3000/admin/orientation` → `200` (the page shell is public; the gate is client-side)

#### Manual Verification (Playwright or by hand on `npm run dev`):
- [x] Log in at `/admin/orientation`. The list shows 12 garments, all ○.
- [x] Selecting a garment updates `?id=` and shows two canvases with the model, turned 90° from each other.
- [x] +45°, −45°, +5° and −5° visibly turn both previews and update the draft readout. Reset restores the stored angle.
- [x] For `dr-2026-118` (stored 135, confirmed earlier), the runway preview's front faces camera-right and the item-page preview's front faces camera-left.
- [x] Approve: the status shows success, `git diff data/garments.json` shows only that record changed, the page stays on the same garment, and its marker becomes ✓.
- [x] Homepage: the approved garment stands on New Acquisitions. Its 4:30 facing matches the runway preview, and the item page `/garments/<slug>` matches the item-page preview.
- [x] Re-approve at a different angle overwrites the stored value.
- [x] No WebGL context-lost warnings in the console while switching through all 12 garments.
- [x] `/admin` shows the new "Garment Orientation" card linking to the page.

**Implementation Note**: Approvals made during manual testing are kept in `data/garments.json` (Matthew's decision, 2026-10-23); no restore step.

---

## Testing Strategy

### Unit Tests:
- `lib/orientation.test.ts`: normalization edge cases, pose offsets, and `applyOrientationReview` (unknown id, targeted update, immutability).
- `lib/museum.test.ts`: the `isFlagship` review gate (false, true and missing), and an unreviewed undated flagship landing in `unplaced`.

### Integration Tests:
- The project has no route-test harness (Vitest `node` env, `*.test.ts` only). The endpoint is verified with `curl` in Phase 2.

### Manual Testing Steps:
1. `npm run dev`, then visit `/` and confirm an empty runway.
2. Approve one garment at `/admin/orientation`, then confirm it appears on `/` facing correctly.
3. Compare `/garments/<slug>` against the item-page preview.

## Performance Considerations

- Only two canvases are ever mounted, and `useGLTF` caches each model so the two canvases share one fetch.
- Switching garments loads a new model of about 10 MB. That's acceptable for an admin tool.
- `isFlagship` gains one comparison, with no measurable cost.

## Migration Notes

- All 12 records gain `orientationReviewed: false`. The homepage runway is empty until garments are approved. This is intended.
- CA garments are unaffected (the field is absent).
- Rollback: revert the commits. Removing the field from the data also restores all 12 to the runway.

## References

- Research: `docs/agents/research/2026-10-23-garment-orientation-flow.md`
- Related plan: `docs/agents/plans/2026-10-19-hall-first-visit.md`
- Atomic write pattern: `lib/garments.ts:36-52`
- Admin route pattern: `app/api/admin/sync/route.ts`
- Fitted model pattern: `components/museum/FlagshipGarment.tsx:14-19`
