import type { DecadeWeave, WeightMap } from "@/types/collectionWeave";

// The woven timeline: one decade of the collection becomes a piece of cloth.
// Warp colours come from the decade's colour mix, the weave structure from its
// dominant material family, and the thread density from its garment count.

export type WeaveStructure = "satin" | "twill" | "plain" | "gauze" | "knit" | "figured";

export interface Share {
  code: string;
  share: number;
}

export interface ClothPlan {
  cols: number; // warp threads across the width
  rows: number; // weft rows needed to fill the height
  cell: number; // CSS pixels per thread
  warp: string[]; // colour code per column
  weftHex: string;
  structure: WeaveStructure;
  seed: number;
}

export const UNDYED = "undyed";
export const NEUTRAL_HEX = "#8a8278";
export const MULTI_HEXES = ["#b5523b", "#3c6e8f"] as const;
export const MIN_DENSITY = 24;
export const MAX_DENSITY = 96;
const REPEAT_WIDTH = 24;
const WEFT_DARKEN = -0.35;

// One fixed shade per code in hfa-ml's colour vocabulary ("multi" is drawn
// as alternating MULTI_HEXES).
const PALETTE: Record<string, string> = {
  beige: "#d8c3a0",
  black: "#1f1d1b",
  blue: "#3f5f9a",
  brown: "#6b4a32",
  burgundy: "#6d1f2f",
  coral: "#e07a5f",
  cream: "#efe6d0",
  fuchsia: "#c2387a",
  gold: "#c9a227",
  gray: "#8d8d8a",
  green: "#4f7a4a",
  lavender: "#a99bc9",
  maroon: "#5c1a1b",
  navy: "#1f2f4f",
  orange: "#d9822b",
  pink: "#e8a6b8",
  purple: "#5e3f7a",
  red: "#a8322d",
  rust: "#a5532a",
  tan: "#c2a27c",
  teal: "#2f7c7a",
  turquoise: "#3fb0ac",
  white: "#f4f1ea",
  yellow: "#e3c34a",
};

// Material code -> the weave its fabrics are usually made with. felt,
// leather, glass and metal are non-woven and don't vote.
const FAMILY: Record<string, WeaveStructure> = {
  satin: "satin",
  silk: "satin",
  rayon: "satin",
  acetate: "satin",
  velvet: "satin",
  wool: "twill",
  cashmere: "twill",
  cotton: "plain",
  linen: "plain",
  hemp: "plain",
  taffeta: "plain",
  crepe: "plain",
  nylon: "plain",
  polyester: "plain",
  lace: "gauze",
  chiffon: "gauze",
  georgette: "gauze",
  spandex: "knit",
  elastic: "knit",
  angora: "knit",
  acrylic: "knit",
  brocade: "figured",
  damask: "figured",
};

const STRUCTURE_LABELS: Record<WeaveStructure, string> = {
  satin: "Woven as satin",
  twill: "Woven as twill",
  plain: "Woven as plain cloth",
  gauze: "Woven as open gauze",
  knit: "Knitted",
  figured: "Woven with a figured motif",
};

const mod = (n: number, m: number) => ((n % m) + m) % m;

function sharesOf(map: WeightMap): Share[] {
  const entries = Object.entries(map).filter(([, w]) => w > 0);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return [];
  return entries
    .map(([code, w]) => ({ code, share: w / total }))
    .sort((a, b) => b.share - a.share || a.code.localeCompare(b.code));
}

export function colorShares(decade: DecadeWeave): Share[] {
  return sharesOf(decade.colors);
}

export function materialShares(decade: DecadeWeave): Share[] {
  return sharesOf(decade.materials);
}

// One pattern repeat of warp colours, in contiguous bands. Counts use the
// largest-remainder method so they always sum to repeatWidth.
export function warpRepeat(shares: Share[], repeatWidth = REPEAT_WIDTH): string[] {
  if (shares.length === 0) return Array(repeatWidth).fill(UNDYED);
  const exact = shares.map((s) => s.share * repeatWidth);
  const counts = exact.map(Math.floor);
  let remaining = repeatWidth - counts.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of byRemainder) {
    if (remaining <= 0) break;
    counts[i] += 1;
    remaining -= 1;
  }
  return shares.flatMap((s, i) => Array<string>(counts[i]).fill(s.code));
}

export function weaveStructure(materials: WeightMap): WeaveStructure {
  const votes = new Map<WeaveStructure, number>();
  for (const [code, weight] of Object.entries(materials)) {
    const family = FAMILY[code];
    if (family && weight > 0) votes.set(family, (votes.get(family) ?? 0) + weight);
  }
  const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return "plain";
  if (ranked.length > 1 && Math.abs(ranked[0][1] - ranked[1][1]) < 1e-9) return "plain";
  return ranked[0][0];
}

// Whether the warp (vertical) thread shows at cell (x, y). Knit is drawn by
// its own stitch routine; it falls back to plain here.
export function warpOver(structure: WeaveStructure, x: number, y: number): boolean {
  switch (structure) {
    case "twill":
      return mod(x + y, 4) < 2;
    case "satin":
      return mod(3 * x + y, 5) !== 0;
    case "figured": {
      const twill = mod(x + y, 4) < 2;
      const inMotif = Math.abs(mod(x, 16) - 8) + Math.abs(mod(y, 16) - 8) < 6;
      return inMotif ? !twill : twill;
    }
    default:
      return mod(x + y, 2) === 0;
  }
}

export function threadDensity(garments: number, maxGarments: number): number {
  if (garments <= 0 || maxGarments <= 0) return MIN_DENSITY;
  const t = Math.log1p(Math.min(garments, maxGarments)) / Math.log1p(maxGarments);
  return Math.round(MIN_DENSITY + (MAX_DENSITY - MIN_DENSITY) * t);
}

export function colorHex(code: string, cell = 0): string {
  if (code === "multi") return MULTI_HEXES[mod(cell, 2)];
  return PALETTE[code] ?? NEUTRAL_HEX;
}

export function shadeHex(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = amount >= 0 ? c + (255 - c) * amount : c * (1 + amount);
    return Math.max(0, Math.min(255, Math.round(v)));
  });
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

// Small deterministic brightness variation per thread cell, so the cloth
// reads as threads, not flat pixels.
export function cellJitter(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) / 4294967295 - 0.5) * 0.12;
}

// Whole garments for display. A decade holding only a fraction of one
// garment's date range still shows "1 garment", never "0 garments".
export function garmentCount(decade: DecadeWeave): number {
  if (decade.garments <= 0) return 0;
  return Math.max(1, Math.round(decade.garments));
}

export function decadeLabel(decade: number): string {
  return `${decade}s`;
}

const percent = (share: number) => `${Math.round(share * 100)}%`;

export function decadeSummary(decade: DecadeWeave): string {
  const label = decadeLabel(decade.decade);
  const count = garmentCount(decade);
  if (count === 0) return `No catalogued garments from the ${label}`;
  const parts = [label, `${count} ${count === 1 ? "garment" : "garments"}`];
  const colours = colorShares(decade)
    .slice(0, 3)
    .map((s) => `${s.code} ${percent(s.share)}`);
  if (colours.length > 0) parts.push(colours.join(", "));
  const materials = materialShares(decade)
    .slice(0, 2)
    .map((s) => s.code);
  if (materials.length > 0) parts.push(`mostly ${materials.join(", ")}`);
  return parts.join(" · ");
}

export function structureLabel(structure: WeaveStructure): string {
  return STRUCTURE_LABELS[structure];
}

export function defaultDecadeIndex(decades: DecadeWeave[]): number {
  let best = 0;
  decades.forEach((d, i) => {
    if (d.garments > decades[best].garments) best = i;
  });
  return best;
}

export function clothPlan(decade: DecadeWeave, maxGarments: number, width: number, height: number): ClothPlan {
  const cols = threadDensity(decade.garments, maxGarments);
  const cell = width > 0 ? width / cols : 1;
  const rows = width > 0 && height > 0 ? Math.ceil(height / cell) : 0;
  const repeat = warpRepeat(colorShares(decade));
  return {
    cols,
    rows,
    cell,
    warp: Array.from({ length: cols }, (_, x) => repeat[x % repeat.length]),
    weftHex: shadeHex(colorHex(repeat[0]), WEFT_DARKEN),
    structure: weaveStructure(decade.materials),
    seed: decade.decade,
  };
}
