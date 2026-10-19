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
