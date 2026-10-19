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

// AR modes handed to model-viewer. Scene Viewer is left out: it receives only
// the raw GLB URL, so it ignores the runtime scale and orientation above and
// would show a raw scan (24–46 units tall) tens of metres high, unresizable
// under ar-scale="fixed". Add it back once the GLBs are exported in metres.
export const AR_MODES = "webxr quick-look";
