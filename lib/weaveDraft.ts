import type { DecadeWeave } from "@/types/collectionWeave";
import {
  colorHex,
  colorShares,
  warpOver,
  warpRepeat,
  weaveStructure,
  weftFor,
  type WeaveStructure,
} from "./weave";
import { hexToRgb, type RGB } from "./weaveBlend";

// Loom drafts of the woven timeline. On a real loom the warp is fixed once
// threaded, so a swatch keeps the on-screen warp colour bands, while the
// collection tapestry uses one undyed warp and carries each decade's colours
// in the weft, band by band along the length.
//
// Two profiles: "shaft" keeps every weave on 8 shafts or fewer (a common
// hand loom) for the WIF; "jacquard" reproduces the screen exactly for a
// lift-plan image (a digital Jacquard has no shaft limit).

export type LoomProfile = "shaft" | "jacquard";
export type Facing = "warp" | "weft";
export type DraftWeave = "plain" | "twill" | "satin" | "figured";

export interface PaletteEntry {
  code: string; // what the weaver reads in the notes, e.g. "black", "undyed (ecru)"
  rgb: RGB;
}

export interface DraftBand {
  decade: number;
  firstPick: number; // 1-based, inclusive; the decade's separator starts here
  lastPick: number;
}

export interface Draft {
  ends: number;
  picks: number; // pick 1 is woven first
  lifted: Uint8Array; // ends × picks, row-major by pick: 1 = warp end raised
  warpColor: Uint8Array; // per end: palette index
  weftColor: Uint8Array; // per pick: palette index
  palette: PaletteEntry[];
  shafts: number; // straight-draw shafts for the shaft profile; 0 for jacquard
  bands: DraftBand[]; // tapestry only
}

export const ECRU = "#e8e0cf";
export const SHAFT_ENDS = 240;
export const TC2_ENDS_PER_MODULE = 220;
export const DEFAULT_MODULES = 6;
export const BAND_PICKS = 40;
export const SEPARATOR_PICKS = 4;
export const MAX_CELLS = 4_000_000;
const MIN_ENDS = 8; // at least one full repeat of the widest shaft weave

const mod = (n: number, m: number) => ((n % m) + m) % m;

export function draftWeave(s: WeaveStructure): DraftWeave {
  return s === "gauze" || s === "knit" ? "plain" : s;
}

export function repeatOf(weave: DraftWeave, profile: LoomProfile): number {
  switch (weave) {
    case "plain":
      return 2;
    case "twill":
      return 4;
    case "satin":
      return profile === "shaft" ? 8 : 5;
    case "figured":
      return profile === "shaft" ? 8 : 16;
  }
}

// Broken twill: the 2/2 diagonal reverses every 4 ends (with an offset, so
// no point forms), giving the figured decades a pattern on 8 shafts.
const brokenTwillD = (x: number) => (mod(x, 8) < 4 ? mod(x, 4) : 5 - mod(x, 4));

export function liftsAt(weave: DraftWeave, profile: LoomProfile, facing: Facing, x: number, y: number): boolean {
  const warpFaced = facing === "warp";
  switch (weave) {
    case "plain":
      return mod(x + y, 2) === 0;
    case "twill":
      return warpFaced ? mod(x + y, 4) < 2 : mod(x + y, 4) === 0;
    case "satin": {
      const sink = mod(3 * x + y, profile === "shaft" ? 8 : 5) === 0;
      return warpFaced ? !sink : sink;
    }
    case "figured": {
      if (profile === "shaft") {
        const v = mod(brokenTwillD(x) + y, 4);
        return warpFaced ? v < 2 : v === 0;
      }
      if (warpFaced) return warpOver("figured", x, y);
      const inMotif = Math.abs(mod(x, 16) - 8) + Math.abs(mod(y, 16) - 8) < 6;
      return inMotif ? !(mod(x + y, 4) < 2) : mod(x + y, 4) === 0;
    }
  }
}

class Palette {
  readonly entries: PaletteEntry[] = [];
  private readonly index = new Map<string, number>();

  add(code: string, hex: string): number {
    const key = `${code}|${hex}`;
    let i = this.index.get(key);
    if (i === undefined) {
      i = this.entries.length;
      this.entries.push({ code, rgb: hexToRgb(hex) });
      this.index.set(key, i);
    }
    return i;
  }
}

function checkSize(ends: number, picks: number): void {
  if (ends < MIN_ENDS) throw new RangeError(`A draft needs at least ${MIN_ENDS} ends`);
  if (ends * picks > MAX_CELLS) throw new RangeError("This draft is too large to generate");
}

const defaultEnds = (profile: LoomProfile) =>
  profile === "shaft" ? SHAFT_ENDS : TC2_ENDS_PER_MODULE * DEFAULT_MODULES;

export function decadeSwatch(
  decade: DecadeWeave,
  profile: LoomProfile,
  opts: { ends?: number; picks?: number } = {},
): Draft {
  const ends = opts.ends ?? defaultEnds(profile);
  const picks = opts.picks ?? ends;
  checkSize(ends, picks);

  const palette = new Palette();
  const repeat = warpRepeat(colorShares(decade));
  const warpColor = Uint8Array.from({ length: ends }, (_, x) => {
    const code = repeat[x % repeat.length];
    return palette.add(code, colorHex(code, x));
  });
  const lead = repeat[0];
  const weft = palette.add(`${lead} weft`, weftFor(colorHex(lead)));
  const weftColor = new Uint8Array(picks).fill(weft);

  const weave = draftWeave(weaveStructure(decade.materials));
  const lifted = new Uint8Array(ends * picks);
  for (let y = 0; y < picks; y++) {
    for (let x = 0; x < ends; x++) lifted[y * ends + x] = liftsAt(weave, profile, "warp", x, y) ? 1 : 0;
  }

  return {
    ends,
    picks,
    lifted,
    warpColor,
    weftColor,
    palette: palette.entries,
    shafts: profile === "shaft" ? repeatOf(weave, "shaft") : 0,
    bands: [],
  };
}

interface PickSpec {
  weave: DraftWeave;
  facing: Facing;
  color: number;
}

export function collectionTapestry(
  decades: DecadeWeave[],
  profile: LoomProfile,
  opts: { ends?: number } = {},
): Draft {
  const ends = opts.ends ?? defaultEnds(profile);
  const palette = new Palette();
  const ecru = palette.add("undyed (ecru)", ECRU);
  const separator: PickSpec = { weave: "plain", facing: "weft", color: ecru };

  const rows: PickSpec[] = [];
  const bands: DraftBand[] = [];
  let widest = repeatOf("plain", "shaft");

  for (const d of decades) {
    const firstPick = rows.length + 1;
    for (let i = 0; i < SEPARATOR_PICKS; i++) rows.push(separator);
    if (d.garments > 0) {
      const weave = draftWeave(weaveStructure(d.materials));
      widest = Math.max(widest, repeatOf(weave, "shaft"));
      const stripes = warpRepeat(colorShares(d), BAND_PICKS);
      for (const code of stripes) {
        const pick = rows.length;
        rows.push({ weave, facing: "weft", color: palette.add(code, colorHex(code, pick)) });
      }
    }
    bands.push({ decade: d.decade, firstPick, lastPick: rows.length });
  }
  for (let i = 0; i < SEPARATOR_PICKS; i++) rows.push(separator);

  const picks = rows.length;
  checkSize(ends, picks);

  const lifted = new Uint8Array(ends * picks);
  rows.forEach((row, y) => {
    for (let x = 0; x < ends; x++) lifted[y * ends + x] = liftsAt(row.weave, profile, row.facing, x, y) ? 1 : 0;
  });

  return {
    ends,
    picks,
    lifted,
    warpColor: new Uint8Array(ends).fill(ecru),
    weftColor: Uint8Array.from(rows, (r) => r.color),
    palette: palette.entries,
    shafts: profile === "shaft" ? widest : 0,
    bands,
  };
}

