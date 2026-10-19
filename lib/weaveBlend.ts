import type { DecadeWeave, WeightMap } from "@/types/collectionWeave";
import { cellJitter, colorHex, colorShares, warpRepeat, weaveStructure, weftFor, type WeaveStructure } from "./weave";

// Smooth scrubbing for the woven timeline. Instead of redrawing the cloth for
// each decade, the canvas holds a display state that eases toward a target:
// threads re-dye gradually (left columns slightly ahead, so the change sweeps
// across like a dye wave), thread thickness grows or shrinks with the number
// of garments, and a change of weave structure flips cells one at a time in
// a scattered order, like a loom being re-threaded.

export type RGB = [number, number, number];

export const GRID_COLS = 96;
export const MIN_THICKNESS = 0.35; // share of a cell a thread fills in an empty decade
export const MAX_THICKNESS = 0.92; // ...and in the busiest decade
const SETTLE_SECONDS = 0.8; // easing time constant at the left edge
const WAVE_SPREAD = 0.3; // right edge eases 30% slower than the left
const FLIP_SECONDS = 1.2; // a weave-structure change completes in this long
const MIN_COLOUR_SPEED = 30; // channel units/s, so the exponential tail ends cleanly
const MIN_THICKNESS_SPEED = 0.05; // thickness units/s, likewise
const MAX_FRAME_SECONDS = 0.1; // a returning background tab doesn't jump

export interface WeaveTarget {
  colors: RGB[]; // one warp colour per grid column
  weft: RGB;
  thickness: number;
  structure: WeaveStructure;
}

export interface WeaveState {
  colors: RGB[];
  weft: RGB;
  thickness: number;
  from: WeaveStructure; // pattern being replaced
  to: WeaveStructure; // pattern being woven in
  flip: number; // 0..1 progress of from -> to
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbCss([r, g, b]: RGB): string {
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

// amount in [-1, 1]: negative darkens toward black, positive lightens toward white.
export function shadeRgb([r, g, b]: RGB, amount: number): RGB {
  const shade = (c: number) => clamp(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount), 0, 255);
  return [shade(r), shade(g), shade(b)];
}

function normalized(map: WeightMap): WeightMap {
  const total = Object.values(map).reduce((sum, w) => sum + (w > 0 ? w : 0), 0);
  if (total <= 0) return {};
  return Object.fromEntries(Object.entries(map).filter(([, w]) => w > 0).map(([k, w]) => [k, w / total]));
}

// Mixes two weight maps by share, so a big decade doesn't swamp a small one
// halfway between them.
function mixShares(a: WeightMap, b: WeightMap, t: number): WeightMap {
  const na = normalized(a);
  const nb = normalized(b);
  const mixed: WeightMap = {};
  for (const key of new Set([...Object.keys(na), ...Object.keys(nb)])) {
    const w = (1 - t) * (na[key] ?? 0) + t * (nb[key] ?? 0);
    if (w > 0) mixed[key] = w;
  }
  return mixed;
}

// A fractional slider position (13.3 = 70% of decade 13, 30% of decade 14)
// as one blended decade. Whole positions return the decade unchanged.
export function blendDecades(decades: DecadeWeave[], position: number): DecadeWeave {
  const last = decades.length - 1;
  const p = clamp(position, 0, last);
  const i = Math.floor(p);
  const t = p - i;
  if (i >= last || t < 1e-9) return decades[Math.min(i, last)];
  const a = decades[i];
  const b = decades[i + 1];
  return {
    decade: t < 0.5 ? a.decade : b.decade,
    garments: a.garments + (b.garments - a.garments) * t,
    colors: mixShares(a.colors, b.colors, t),
    materials: mixShares(a.materials, b.materials, t),
    techniques: mixShares(a.techniques, b.techniques, t),
  };
}

// Density shown as thread thickness on a fixed grid (log-scaled, like the
// count bars), so it can change smoothly instead of re-flowing the threads.
export function threadThickness(garments: number, maxGarments: number): number {
  if (garments <= 0 || maxGarments <= 0) return MIN_THICKNESS;
  const t = Math.log1p(Math.min(garments, maxGarments)) / Math.log1p(maxGarments);
  return MIN_THICKNESS + (MAX_THICKNESS - MIN_THICKNESS) * t;
}

export function weaveTarget(decade: DecadeWeave, maxGarments: number): WeaveTarget {
  const repeat = warpRepeat(colorShares(decade));
  return {
    colors: Array.from({ length: GRID_COLS }, (_, x) => hexToRgb(colorHex(repeat[x % repeat.length], x))),
    weft: hexToRgb(weftFor(colorHex(repeat[0]))),
    thickness: threadThickness(decade.garments, maxGarments),
    structure: weaveStructure(decade.materials),
  };
}

export function initialState(target: WeaveTarget): WeaveState {
  return {
    colors: target.colors.map((c) => [...c] as RGB),
    weft: [...target.weft] as RGB,
    thickness: target.thickness,
    from: target.structure,
    to: target.structure,
    flip: 1,
  };
}

// Exponential approach with a minimum speed, so it never overshoots and lands
// exactly on the target instead of creeping forever.
function approach(current: number, target: number, alpha: number, minStep: number): number {
  const d = target - current;
  if (d === 0) return target;
  const step = Math.abs(d * alpha) >= minStep ? d * alpha : Math.sign(d) * Math.min(Math.abs(d), minStep);
  return current + step;
}

const approachRgb = (c: RGB, t: RGB, alpha: number, minStep: number): RGB => [
  approach(c[0], t[0], alpha, minStep),
  approach(c[1], t[1], alpha, minStep),
  approach(c[2], t[2], alpha, minStep),
];

const sameRgb = (a: RGB, b: RGB) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

export function stepToward(
  state: WeaveState,
  target: WeaveTarget,
  dtSeconds: number,
): { state: WeaveState; settled: boolean } {
  const dt = clamp(dtSeconds, 0, MAX_FRAME_SECONDS);
  if (dt === 0) return { state, settled: false };

  const minColour = MIN_COLOUR_SPEED * dt;
  const last = Math.max(1, target.colors.length - 1);
  const colors = state.colors.map((c, x) => {
    const tau = SETTLE_SECONDS * (1 + (WAVE_SPREAD * x) / last);
    return approachRgb(c, target.colors[x], 1 - Math.exp(-dt / tau), minColour);
  });
  const alpha = 1 - Math.exp(-dt / SETTLE_SECONDS);
  const weft = approachRgb(state.weft, target.weft, alpha, minColour);
  const thickness = approach(state.thickness, target.thickness, alpha, MIN_THICKNESS_SPEED * dt);

  let { from, to, flip } = state;
  let direction = 1;
  if (target.structure === to) {
    direction = 1;
  } else if (target.structure === from && flip < 1) {
    // Scrubbed back mid-change: run the same change backwards, so cells
    // return in reverse order instead of popping.
    direction = -1;
  } else {
    // A new pattern: start from whichever pattern is mostly showing now.
    from = flip >= 0.5 ? to : from;
    to = target.structure;
    flip = 0;
  }
  flip = clamp(flip + (direction * dt) / FLIP_SECONDS, 0, 1);
  if (flip === 0) {
    // A reversal finished: the original pattern is fully back.
    to = from;
    flip = 1;
  }

  const next: WeaveState = { colors, weft, thickness, from, to, flip };
  const settled =
    flip === 1 &&
    thickness === target.thickness &&
    sameRgb(weft, target.weft) &&
    colors.every((c, x) => sameRgb(c, target.colors[x]));
  return { state: next, settled };
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

// Which pattern a cell shows mid-change: each cell switches once the eased
// progress passes its own scattered threshold, and never switches back.
export function cellStructure(state: WeaveState, x: number, y: number, seed: number): WeaveStructure {
  if (state.flip >= 1) return state.to;
  if (state.flip <= 0) return state.from;
  const threshold = cellJitter(x, y, seed) / 0.12 + 0.5;
  return threshold < smoothstep(state.flip) ? state.to : state.from;
}

export function clothRows(width: number, height: number): { cell: number; rows: number } {
  const cell = width > 0 ? width / GRID_COLS : 1;
  const rows = width > 0 && height > 0 ? Math.ceil(height / cell) : 0;
  return { cell, rows };
}

const KEY_STEPS: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 };

// Keyboard on the continuous slider: keys move whole decades from the
// nearest one (the native step of 0.01 would be uselessly small).
export function nudgePosition(key: string, position: number, last: number): number | null {
  if (key === "Home") return 0;
  if (key === "End") return last;
  const step = KEY_STEPS[key];
  if (step === undefined) return null;
  return clamp(Math.round(position) + step, 0, last);
}

// Where the slider settles when a value is committed (pointer released, or a
// screen reader's increment). A nudge smaller than half a decade moves one
// whole decade in its direction, so assistive-tech swipes of one native step
// (0.01) still change decade; a longer drag rounds to the nearest.
export function commitPosition(lastWhole: number, value: number, last: number): number {
  const v = clamp(value, 0, last);
  const d = v - lastWhole;
  if (d !== 0 && Math.abs(d) < 0.5) return clamp(lastWhole + Math.sign(d), 0, last);
  return Math.round(v);
}
