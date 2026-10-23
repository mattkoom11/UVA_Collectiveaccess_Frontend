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
  // + 0 turns a -0 into 0, so the written JSON never says -0
  return (d > 180 ? d - 360 : d) + 0;
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
