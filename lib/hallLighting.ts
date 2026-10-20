import type { Era } from "@/types/garment";
import type { Vec3 } from "@/lib/hallLayout";

// One stretch of the runway: the New Acquisitions stage or an era wing.
export type SegmentKey = "acquisitions" | Era;

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
