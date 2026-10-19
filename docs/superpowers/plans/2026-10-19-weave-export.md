# Loom Draft Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors download the woven timeline as loom-ready drafts: an 8-shaft WIF, a 1-bit Jacquard lift-plan TIFF, a PNG preview and weaving notes, for a single decade or the whole collection tapestry.

**Architecture:** A pure draft model (`lib/weaveDraft.ts`) turns the same per-decade data the cloth uses into a `Draft` (lift grid, warp and weft colours, palette, shafts, decade bands) under one of two loom profiles. Three pure writers serialise a draft (`lib/wif.ts`, `lib/tiff.ts`, `lib/weavingNotes.ts`). A small client component builds files on demand and triggers downloads.

**Tech Stack:** TypeScript 5.9 strict, React 19 / Next 16, Vitest 4 (node environment), browser Blob/canvas APIs. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-19-weave-export-design.md`

## Global Constraints

- No new dependencies and no server route. Everything is generated in the browser, on demand.
- Every WIF draft uses **at most 8 shafts** with a straight draw (end `x` on shaft `mod(x, shafts) + 1`).
- Shaft-profile structures: plain `mod(x+y,2)===0`; 2/2 twill `mod(x+y,4)<2`; 8-end satin with counter 3, warp-faced `mod(3x+y,8)!==0`; figured becomes a 2/2 broken twill `mod(d+y,4)<2` with `d = mod(x,8)<4 ? mod(x,4) : 5-mod(x,4)`; gauze and knit become plain.
- The Jacquard profile reproduces the screen: `warpOver` for plain, twill, 5-end satin and the 16-thread diamond.
- Weft-faced (tapestry): plain unchanged; twill `mod(x+y,4)===0`; satin `mod(3x+y,n)===0`; figured on the shaft profile `mod(d+y,4)===0`; figured on Jacquard has a 1/3 twill ground with the 2/2 twill inverted inside the diamond.
- Tapestry layout: an ecru warp (`#e8e0cf`) on every end; per decade, oldest first, a 4-pick ecru plain separator, then, if it has garments, a 40-pick weft-faced band of stripes from `warpRepeat(colorShares(decade), 40)`; then a final 4-pick separator.
- Default sizes: shaft profile 240 ends (swatch 240 × 240); Jacquard `220 × modules` ends, with modules 1–12, default 6. A swatch's picks equal its ends.
- Safety cap: refuse drafts over **4,000,000** cells with a `RangeError`.
- WIF: version 1.1, CRLF line endings, sections in this order: WIF, CONTENTS, TEXT, WEAVING, WARP, WEFT, COLOR PALETTE, COLOR TABLE, THREADING, LIFTPLAN, WARP COLORS, WEFT COLORS. Colour indices are 1-based.
- TIFF: little-endian baseline, one uncompressed strip, PhotometricInterpretation 0 (a 1 bit is black, meaning lifted), rows packed MSB-first, **pick 1 is the bottom row**.
- File names: `uvahcc-weave-<1910s|collection>-<shaft|jacquard-Nmod>.<wif|tif|png|txt>`.
- Lint `--max-warnings=0`; Vitest picks up `**/*.test.ts` only, in the node environment (no DOM).

## Review Focus

1. **A decade with "multi", unknown or no colour codes** in a draft. Expected: a valid draft with neutral or alternating threads, and no crash or empty palette. Pinned in Task 1.
2. **A tiny or oversized draft** (ends below the shaft repeat, or over the cell cap). Expected: a clear `RangeError`, never a malformed WIF or a frozen tab. Pinned in Task 1.
3. **A third-party WIF reader** depending on consistent counts and 1-based indices. Expected: our file parses back to exactly the same cloth. Pinned in Task 2 (round trip).
4. **Weft sequence in the notes merging across decades** (empty decades put separators back to back). Expected: each decade's separator listed on its own line, so a weaver can find their place. Pinned in Task 4.
5. **The largest real tapestry** (12 modules, every decade populated). Expected: it builds under the cap with the documented pick count. Pinned in Task 1.

---

### Task 1: Draft model and builders

**Files:**
- Create: `lib/weaveDraft.ts`
- Test: `lib/weaveDraft.test.ts`

**Interfaces:**
- Consumes: `colorHex`, `colorShares`, `warpOver`, `warpRepeat`, `weaveStructure`, `weftFor`, `type WeaveStructure` from `@/lib/weave`; `hexToRgb`, `type RGB` from `@/lib/weaveBlend`; `DecadeWeave` from `@/types/collectionWeave`.
- Produces (from `@/lib/weaveDraft`):
  - `type LoomProfile = "shaft" | "jacquard"`, `type Facing = "warp" | "weft"`, `type DraftWeave = "plain" | "twill" | "satin" | "figured"`
  - `interface PaletteEntry { code: string; rgb: RGB }`
  - `interface DraftBand { decade: number; firstPick: number; lastPick: number }` (1-based, inclusive; covers the decade's separator and band)
  - `interface Draft { ends: number; picks: number; lifted: Uint8Array; warpColor: Uint8Array; weftColor: Uint8Array; palette: PaletteEntry[]; shafts: number; bands: DraftBand[] }`
  - constants `ECRU = "#e8e0cf"`, `SHAFT_ENDS = 240`, `TC2_ENDS_PER_MODULE = 220`, `DEFAULT_MODULES = 6`, `BAND_PICKS = 40`, `SEPARATOR_PICKS = 4`, `MAX_CELLS = 4_000_000`
  - `draftWeave(s: WeaveStructure): DraftWeave`
  - `repeatOf(weave: DraftWeave, profile: LoomProfile): number`
  - `liftsAt(weave: DraftWeave, profile: LoomProfile, facing: Facing, x: number, y: number): boolean`
  - `decadeSwatch(decade: DecadeWeave, profile: LoomProfile, opts?: { ends?: number; picks?: number }): Draft`
  - `collectionTapestry(decades: DecadeWeave[], profile: LoomProfile, opts?: { ends?: number }): Draft`

- [ ] **Step 1: Branch and commit the docs**

```bash
cd ~/Documents/GitHub/UVA_Collectiveaccess_Frontend
git checkout main && git pull --ff-only
git checkout -b feature/weave-export
git add docs/superpowers/specs/2026-10-19-weave-export-design.md docs/superpowers/plans/2026-10-19-weave-export.md
git commit -m "docs: loom draft export spec and plan"
```

- [ ] **Step 2: Write the failing tests**

Create `lib/weaveDraft.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { DecadeWeave } from "@/types/collectionWeave";
import { warpOver } from "./weave";
import { hexToRgb } from "./weaveBlend";
import {
  BAND_PICKS,
  ECRU,
  SEPARATOR_PICKS,
  collectionTapestry,
  decadeSwatch,
  draftWeave,
  liftsAt,
  repeatOf,
  type Draft,
  type DraftWeave,
} from "./weaveDraft";

function decade(d: number, overrides: Partial<DecadeWeave> = {}): DecadeWeave {
  return { decade: d, garments: 10, colors: { black: 3, white: 1 }, materials: { silk: 1 }, techniques: {}, ...overrides };
}

const lifted = (draft: Draft, x: number, y: number) => draft.lifted[y * draft.ends + x] === 1;
const weftCode = (draft: Draft, pick1: number) => draft.palette[draft.weftColor[pick1 - 1]].code;
const WEAVES: DraftWeave[] = ["plain", "twill", "satin", "figured"];

describe("draftWeave", () => {
  it("weaves gauze and knit as plain and keeps the rest", () => {
    expect(draftWeave("gauze")).toBe("plain");
    expect(draftWeave("knit")).toBe("plain");
    expect(draftWeave("satin")).toBe("satin");
    expect(draftWeave("figured")).toBe("figured");
  });
});

describe("liftsAt, shaft profile", () => {
  it("repeats every weave within 8 ends and 8 picks", () => {
    for (const weave of WEAVES) {
      const r = repeatOf(weave, "shaft");
      expect(r).toBeLessThanOrEqual(8);
      for (const facing of ["warp", "weft"] as const) {
        for (let x = 0; x < 16; x++) {
          for (let y = 0; y < 16; y++) {
            expect(liftsAt(weave, "shaft", facing, x + r, y)).toBe(liftsAt(weave, "shaft", facing, x, y));
            expect(liftsAt(weave, "shaft", facing, x, y + 8)).toBe(liftsAt(weave, "shaft", facing, x, y));
          }
        }
      }
    }
  });

  it("sinks exactly one end in eight on every pick of warp-faced 8-shaft satin", () => {
    for (let y = 0; y < 8; y++) {
      const sunk = [0, 1, 2, 3, 4, 5, 6, 7].filter((x) => !liftsAt("satin", "shaft", "warp", x, y));
      expect(sunk).toHaveLength(1);
    }
  });

  it("makes warp- and weft-faced satin exact complements", () => {
    for (const profile of ["shaft", "jacquard"] as const) {
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          expect(liftsAt("satin", profile, "warp", x, y)).toBe(!liftsAt("satin", profile, "weft", x, y));
        }
      }
    }
  });

  it("reverses the broken twill's diagonal on ends 4-7", () => {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) expect(liftsAt("figured", "shaft", "warp", x, y)).toBe(liftsAt("twill", "shaft", "warp", x, y));
    }
    const differs = [4, 5, 6, 7].some((x) =>
      [0, 1, 2, 3].some((y) => liftsAt("figured", "shaft", "warp", x, y) !== liftsAt("twill", "shaft", "warp", x, y)),
    );
    expect(differs).toBe(true);
  });
});

describe("liftsAt, jacquard profile", () => {
  it("reproduces the on-screen weaves exactly", () => {
    for (const s of ["plain", "twill", "satin", "figured"] as const) {
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) expect(liftsAt(s, "jacquard", "warp", x, y)).toBe(warpOver(s, x, y));
      }
    }
  });
});

describe("decadeSwatch", () => {
  it("defaults to 240 x 240 on 8 shafts for a satin decade", () => {
    const d = decadeSwatch(decade(1910), "shaft");
    expect([d.ends, d.picks, d.shafts]).toEqual([240, 240, 8]);
    expect(d.lifted).toHaveLength(240 * 240);
    expect(d.bands).toEqual([]);
  });

  it("uses 2 shafts for a plain decade", () => {
    expect(decadeSwatch(decade(1910, { materials: { cotton: 1 } }), "shaft").shafts).toBe(2);
  });

  it("lays the warp in the on-screen colour bands", () => {
    const d = decadeSwatch(decade(1910), "shaft");
    const code = (x: number) => d.palette[d.warpColor[x]].code;
    expect(code(0)).toBe("black");
    expect(code(17)).toBe("black");
    expect(code(18)).toBe("white");
    expect(code(24)).toBe("black");
    expect(weftCode(d, 1)).toBe("black weft");
  });

  it("sizes a Jacquard swatch in TC2 modules with no shafts", () => {
    const d = decadeSwatch(decade(1910), "jacquard", { ends: 220 * 6 });
    expect([d.ends, d.picks, d.shafts]).toEqual([1320, 1320, 0]);
  });

  it("weaves unknown colours as neutral thread and alternates multi", () => {
    const d = decadeSwatch(decade(1910, { colors: { chartreuse: 1 } }), "shaft");
    expect(d.palette[d.warpColor[0]].rgb).toEqual(hexToRgb("#8a8278"));
    const multi = decadeSwatch(decade(1910, { colors: { multi: 1 } }), "shaft");
    expect(multi.palette[multi.warpColor[0]].rgb).not.toEqual(multi.palette[multi.warpColor[1]].rgb);
  });

  it("weaves an uncoloured decade undyed", () => {
    const d = decadeSwatch(decade(1910, { colors: {} }), "shaft");
    expect(d.palette[d.warpColor[0]].code).toBe("undyed");
  });

  it("refuses drafts too small for the shafts or too large to build", () => {
    expect(() => decadeSwatch(decade(1910), "shaft", { ends: 4 })).toThrow(RangeError);
    expect(() => decadeSwatch(decade(1910), "jacquard", { ends: 4000, picks: 1001 })).toThrow(RangeError);
  });
});

describe("collectionTapestry", () => {
  const decades = [
    decade(1900),
    decade(1910, { garments: 0, colors: {}, materials: {} }),
    decade(1920, { colors: { red: 1 }, materials: { wool: 1 } }),
  ];

  it("lays decades along the length, oldest first, with separators", () => {
    const t = collectionTapestry(decades, "shaft");
    expect(t.picks).toBe(4 + 40 + 4 + 4 + 40 + 4);
    expect(t.bands).toEqual([
      { decade: 1900, firstPick: 1, lastPick: 44 },
      { decade: 1910, firstPick: 45, lastPick: 48 },
      { decade: 1920, firstPick: 49, lastPick: 92 },
    ]);
  });

  it("uses one undyed warp", () => {
    const t = collectionTapestry(decades, "shaft");
    expect(new Set(t.warpColor)).toEqual(new Set([t.warpColor[0]]));
    expect(t.palette[t.warpColor[0]].rgb).toEqual(hexToRgb(ECRU));
  });

  it("weaves separators in ecru and stripes bands by colour share", () => {
    const t = collectionTapestry(decades, "shaft");
    for (const p of [1, 4, 45, 48, 49, 52, 93, 96]) expect(weftCode(t, p)).toBe("undyed (ecru)");
    expect(weftCode(t, 5)).toBe("black");
    expect(weftCode(t, 34)).toBe("black");
    expect(weftCode(t, 35)).toBe("white");
    expect(weftCode(t, 44)).toBe("white");
    expect(weftCode(t, 53)).toBe("red");
  });

  it("weaves bands weft-faced so the colour shows", () => {
    const t = collectionTapestry(decades, "shaft");
    const y = 10; // inside the 1900s satin band
    const up = Array.from({ length: t.ends }, (_, x) => lifted(t, x, y)).filter(Boolean).length;
    expect(up).toBe(t.ends / 8);
  });

  it("needs 8 shafts when a band is satin, none on Jacquard", () => {
    expect(collectionTapestry(decades, "shaft").shafts).toBe(8);
    expect(collectionTapestry(decades, "jacquard").shafts).toBe(0);
  });

  it("builds the largest real tapestry under the cap", () => {
    const all = Array.from({ length: 26 }, (_, i) => decade(1770 + i * 10));
    const t = collectionTapestry(all, "jacquard", { ends: 220 * 12 });
    expect(t.picks).toBe(26 * (SEPARATOR_PICKS + BAND_PICKS) + SEPARATOR_PICKS);
    expect(t.lifted).toHaveLength(2640 * t.picks);
  });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `npx vitest run lib/weaveDraft.test.ts`
Expected: FAIL, "Failed to resolve import "./weaveDraft"".

- [ ] **Step 4: Write the implementation**

Create `lib/weaveDraft.ts`:

```ts
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

```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run lib/weaveDraft.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/weaveDraft.ts lib/weaveDraft.test.ts
git commit -m "feat: loom draft model with shaft and jacquard profiles"
```

---

### Task 2: WIF writer

**Files:**
- Create: `lib/wif.ts`
- Test: `lib/wif.test.ts`

**Interfaces:**
- Consumes: `Draft` and the builders from `@/lib/weaveDraft` (Task 1).
- Produces:
  - `interface DraftMeta { title: string; source: "search-index" | "ci-fixture"; dataDate: string; generated: string }` from `@/lib/wif`
  - `toWif(draft: Draft, meta: DraftMeta): string`

- [ ] **Step 1: Write the failing tests**

Create `lib/wif.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { DecadeWeave } from "@/types/collectionWeave";
import { collectionTapestry, decadeSwatch, type Draft } from "./weaveDraft";
import { toWif, type DraftMeta } from "./wif";

const META: DraftMeta = { title: "1910s swatch", source: "ci-fixture", dataDate: "2026-10-19", generated: "2026-10-19" };

function decade(d: number, overrides: Partial<DecadeWeave> = {}): DecadeWeave {
  return { decade: d, garments: 10, colors: { black: 3, white: 1 }, materials: { silk: 1 }, techniques: {}, ...overrides };
}

// A small reader used only to check our own output.
function parseWif(text: string): Map<string, Map<string, string>> {
  const sections = new Map<string, Map<string, string>>();
  let current = new Map<string, string>();
  for (const raw of text.split("\r\n")) {
    const line = raw.trim();
    if (!line) continue;
    const header = line.match(/^\[(.+)\]$/);
    if (header) {
      current = new Map();
      sections.set(header[1], current);
      continue;
    }
    const eq = line.indexOf("=");
    current.set(line.slice(0, eq), line.slice(eq + 1));
  }
  return sections;
}

function rebuild(text: string) {
  const s = parseWif(text);
  const ends = Number(s.get("WARP")!.get("Threads"));
  const picks = Number(s.get("WEFT")!.get("Threads"));
  const threading = s.get("THREADING")!;
  const liftplan = s.get("LIFTPLAN")!;
  const lifted = new Uint8Array(ends * picks);
  for (let y = 0; y < picks; y++) {
    const raised = new Set((liftplan.get(String(y + 1)) ?? "").split(",").filter(Boolean).map(Number));
    for (let x = 0; x < ends; x++) lifted[y * ends + x] = raised.has(Number(threading.get(String(x + 1)))) ? 1 : 0;
  }
  const colors = (section: string, count: number, fallback: number) =>
    Uint8Array.from({ length: count }, (_, i) => Number(s.get(section)!.get(String(i + 1)) ?? fallback) - 1);
  const warpColor = colors("WARP COLORS", ends, Number(s.get("WARP")!.get("Color")));
  const weftColor = colors("WEFT COLORS", picks, Number(s.get("WEFT")!.get("Color")));
  const table = s.get("COLOR TABLE")!;
  const rgb = [...table.entries()].map(([, v]) => v.split(",").map(Number));
  return { ends, picks, lifted, warpColor, weftColor, rgb, sections: s };
}

const drafts: [string, Draft][] = [
  ["a satin swatch", decadeSwatch(decade(1910), "shaft")],
  ["a plain swatch", decadeSwatch(decade(1910, { materials: { cotton: 1 } }), "shaft")],
  [
    "the tapestry",
    collectionTapestry(
      [decade(1900), decade(1910, { garments: 0, colors: {}, materials: {} }), decade(1920, { colors: { red: 1, multi: 1 }, materials: { brocade: 1 } })],
      "shaft",
    ),
  ],
];

describe("toWif", () => {
  it("writes the sections in order with CRLF line endings", () => {
    const text = toWif(drafts[0][1], META);
    const headers = [...text.matchAll(/^\[(.+)\]\r$/gm)].map((m) => m[1]);
    expect(headers).toEqual([
      "WIF",
      "CONTENTS",
      "TEXT",
      "WEAVING",
      "WARP",
      "WEFT",
      "COLOR PALETTE",
      "COLOR TABLE",
      "THREADING",
      "LIFTPLAN",
      "WARP COLORS",
      "WEFT COLORS",
    ]);
    expect(/[^\r]\n/.test(text)).toBe(false);
    expect(parseWif(text).get("WIF")!.get("Version")).toBe("1.1");
  });

  it.each(drafts)("keeps counts consistent and shafts within range for %s", (_label, draft) => {
    const { sections } = rebuild(toWif(draft, META));
    const shafts = Number(sections.get("WEAVING")!.get("Shafts"));
    expect(shafts).toBe(draft.shafts);
    expect(shafts).toBeLessThanOrEqual(8);
    expect(sections.get("THREADING")!.size).toBe(draft.ends);
    expect(sections.get("LIFTPLAN")!.size).toBe(draft.picks);
    expect(Number(sections.get("COLOR PALETTE")!.get("Entries"))).toBe(draft.palette.length);
    for (const v of sections.get("LIFTPLAN")!.values()) {
      for (const shaft of v.split(",").filter(Boolean)) expect(Number(shaft)).toBeLessThanOrEqual(shafts);
    }
  });

  it.each(drafts)("round-trips %s exactly", (_label, draft) => {
    const back = rebuild(toWif(draft, META));
    expect(back.ends).toBe(draft.ends);
    expect(back.picks).toBe(draft.picks);
    expect(back.lifted).toEqual(draft.lifted);
    expect(back.warpColor).toEqual(draft.warpColor);
    expect(back.weftColor).toEqual(draft.weftColor);
    expect(back.rgb).toEqual(draft.palette.map((p) => p.rgb));
  });

  it("refuses a Jacquard draft", () => {
    expect(() => toWif(decadeSwatch(decade(1910), "jacquard", { ends: 220 }), META)).toThrow();
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run lib/wif.test.ts`
Expected: FAIL, "Failed to resolve import "./wif"".

- [ ] **Step 3: Write the writer**

Create `lib/wif.ts`:

```ts
import type { Draft } from "./weaveDraft";

// WIF 1.1 (Weaving Information File), the INI-style format weaving software
// reads. Drafts use a straight draw and a rising-shed liftplan, which
// describes any shaft weave without a tie-up. Colour indices are 1-based.

export interface DraftMeta {
  title: string;
  source: "search-index" | "ci-fixture";
  dataDate: string; // when the collection data was exported
  generated: string; // when this file was made, YYYY-MM-DD
}

function mostCommon(values: Uint8Array): number {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = values[0] ?? 0;
  for (const [v, c] of counts) if (c > (counts.get(best) ?? 0)) best = v;
  return best;
}

export function sourceLine(meta: DraftMeta): string {
  return meta.source === "ci-fixture"
    ? `Built from a sample of the UVA Historic Clothing Collection (data ${meta.dataDate}), not the full catalog.`
    : `Built from the UVA Historic Clothing Collection catalog (data ${meta.dataDate}).`;
}

export function toWif(draft: Draft, meta: DraftMeta): string {
  if (draft.shafts <= 0) throw new Error("toWif needs a shaft-profile draft");
  if (draft.ends < draft.shafts) throw new RangeError("A WIF draft needs at least one end per shaft");

  const lines: string[] = [];
  const section = (name: string, entries: [string | number, string | number][]) => {
    lines.push(`[${name}]`);
    for (const [k, v] of entries) lines.push(`${k}=${v}`);
    lines.push("");
  };

  const warpMain = mostCommon(draft.warpColor);
  const weftMain = mostCommon(draft.weftColor);

  section("WIF", [
    ["Version", "1.1"],
    ["Date", meta.generated],
    ["Developers", "uvahcc.org"],
    ["Source Program", "UVA Historic Clothing Collection woven timeline"],
    ["Source Version", "1"],
  ]);
  section("CONTENTS", [
    ["WEAVING", "true"],
    ["WARP", "true"],
    ["WEFT", "true"],
    ["COLOR PALETTE", "true"],
    ["COLOR TABLE", "true"],
    ["THREADING", "true"],
    ["LIFTPLAN", "true"],
    ["WARP COLORS", "true"],
    ["WEFT COLORS", "true"],
    ["TEXT", "true"],
  ]);
  section("TEXT", [
    ["Title", meta.title],
    ["Notes", sourceLine(meta)],
  ]);
  section("WEAVING", [
    ["Shafts", draft.shafts],
    ["Treadles", 0],
    ["Rising Shed", "true"],
  ]);
  section("WARP", [
    ["Threads", draft.ends],
    ["Color", warpMain + 1],
  ]);
  section("WEFT", [
    ["Threads", draft.picks],
    ["Color", weftMain + 1],
  ]);
  section("COLOR PALETTE", [
    ["Entries", draft.palette.length],
    ["Range", "0,255"],
  ]);
  section(
    "COLOR TABLE",
    draft.palette.map((p, i) => [i + 1, p.rgb.join(",")]),
  );
  section(
    "THREADING",
    Array.from({ length: draft.ends }, (_, x) => [x + 1, (x % draft.shafts) + 1]),
  );
  // With a straight draw, end s-1 sits on shaft s, and every end on a shaft
  // lifts the same way, so reading the first `shafts` ends gives each pick's
  // raised shafts exactly.
  section(
    "LIFTPLAN",
    Array.from({ length: draft.picks }, (_, y) => {
      const raised: number[] = [];
      for (let s = 0; s < draft.shafts; s++) if (draft.lifted[y * draft.ends + s]) raised.push(s + 1);
      return [y + 1, raised.join(",")];
    }),
  );
  section(
    "WARP COLORS",
    [...draft.warpColor].flatMap((c, x) => (c === warpMain ? [] : [[x + 1, c + 1] as [number, number]])),
  );
  section(
    "WEFT COLORS",
    [...draft.weftColor].flatMap((c, y) => (c === weftMain ? [] : [[y + 1, c + 1] as [number, number]])),
  );

  return lines.join("\r\n");
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run lib/wif.test.ts`
Expected: PASS. The round trip proves the straight-draw liftplan reproduces every draft, including the tapestry whose picks mix plain, satin and broken twill.

- [ ] **Step 5: Commit**

```bash
git add lib/wif.ts lib/wif.test.ts
git commit -m "feat: WIF 1.1 writer for shaft-loom drafts"
```

---

### Task 3: Lift-plan TIFF encoder

**Files:**
- Create: `lib/tiff.ts`
- Test: `lib/tiff.test.ts`

**Interfaces:**
- Consumes: `Draft` (Task 1), only `ends`, `picks` and `lifted`.
- Produces: `toBilevelTiff(draft: Pick<Draft, "ends" | "picks" | "lifted">): Uint8Array<ArrayBuffer>` from `@/lib/tiff`.

- [ ] **Step 1: Write the failing tests**

Create `lib/tiff.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { toBilevelTiff } from "./tiff";

// 10 ends × 3 picks. Pick 1: 1010101011, pick 2: blank, pick 3: only end 10.
const ends = 10;
const picks = 3;
const lifted = Uint8Array.from([
  1, 0, 1, 0, 1, 0, 1, 0, 1, 1,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
]);

function tags(bytes: Uint8Array) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ifd = dv.getUint32(4, true);
  const count = dv.getUint16(ifd, true);
  const out = new Map<number, { type: number; count: number; value: number }>();
  for (let i = 0; i < count; i++) {
    const at = ifd + 2 + i * 12;
    const type = dv.getUint16(at + 2, true);
    out.set(dv.getUint16(at, true), {
      type,
      count: dv.getUint32(at + 4, true),
      value: type === 3 ? dv.getUint16(at + 8, true) : dv.getUint32(at + 8, true),
    });
  }
  return { dv, ifd, count, out };
}

describe("toBilevelTiff", () => {
  const tiff = toBilevelTiff({ ends, picks, lifted });

  it("writes a little-endian TIFF header", () => {
    expect([...tiff.slice(0, 4)]).toEqual([0x49, 0x49, 0x2a, 0x00]);
  });

  it("describes a 1-bit, uncompressed, black-is-lifted image", () => {
    const { out, count } = tags(tiff);
    expect(count).toBe(12);
    const keys = [...out.keys()];
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
    expect(out.get(256)!.value).toBe(10); // ImageWidth
    expect(out.get(257)!.value).toBe(3); // ImageLength
    expect(out.get(258)!.value).toBe(1); // BitsPerSample
    expect(out.get(259)!.value).toBe(1); // Compression: none
    expect(out.get(262)!.value).toBe(0); // WhiteIsZero
    expect(out.get(277)!.value).toBe(1); // SamplesPerPixel
    expect(out.get(278)!.value).toBe(3); // RowsPerStrip
    expect(out.get(279)!.value).toBe(6); // StripByteCounts = ceil(10/8) * 3
    expect(out.get(296)!.value).toBe(2); // ResolutionUnit: inch
  });

  it("stores 72 dpi resolutions as rationals", () => {
    const { dv, out } = tags(tiff);
    for (const tag of [282, 283]) {
      const at = out.get(tag)!.value;
      expect(out.get(tag)!.type).toBe(5);
      expect([dv.getUint32(at, true), dv.getUint32(at + 4, true)]).toEqual([72, 1]);
    }
  });

  it("packs bits MSB-first with pick 1 on the bottom row", () => {
    const { out } = tags(tiff);
    const strip = tiff.slice(out.get(273)!.value, out.get(273)!.value + 6);
    expect([...strip]).toEqual([0x00, 0x40, 0x00, 0x00, 0xaa, 0xc0]);
    expect(tiff.length).toBe(out.get(273)!.value + 6);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run lib/tiff.test.ts`
Expected: FAIL, "Failed to resolve import "./tiff"".

- [ ] **Step 3: Write the encoder**

Create `lib/tiff.ts`:

```ts
import type { Draft } from "./weaveDraft";

// A baseline bilevel TIFF of a draft's lift plan, for digital Jacquard
// software (e.g. the TC2's): one pixel per warp end per pick, black where the
// end is lifted, uncompressed, one strip. Pick 1 is the bottom row, so the
// image reads like the finished cloth with its first-woven end at the bottom.

const SHORT = 3;
const LONG = 4;
const RATIONAL = 5;
const HEADER = 8;
const TAG_COUNT = 12;
const IFD_SIZE = 2 + TAG_COUNT * 12 + 4;
const X_RES_AT = HEADER + IFD_SIZE;
const Y_RES_AT = X_RES_AT + 8;
const STRIP_AT = Y_RES_AT + 8;

// Typed on ArrayBuffer (not ArrayBufferLike) so it can go straight into a Blob.
export function toBilevelTiff(draft: Pick<Draft, "ends" | "picks" | "lifted">): Uint8Array<ArrayBuffer> {
  const { ends: width, picks: height, lifted } = draft;
  const rowBytes = Math.ceil(width / 8);
  const stripBytes = rowBytes * height;
  const bytes = new Uint8Array(STRIP_AT + stripBytes);
  const dv = new DataView(bytes.buffer);

  // Header: "II", 42, offset of the first IFD.
  bytes.set([0x49, 0x49, 0x2a, 0x00]);
  dv.setUint32(4, HEADER, true);

  // IFD entries, in ascending tag order as TIFF requires.
  const entries: [tag: number, type: number, value: number][] = [
    [256, LONG, width], // ImageWidth
    [257, LONG, height], // ImageLength
    [258, SHORT, 1], // BitsPerSample
    [259, SHORT, 1], // Compression: none
    [262, SHORT, 0], // PhotometricInterpretation: WhiteIsZero (1 = black)
    [273, LONG, STRIP_AT], // StripOffsets
    [277, SHORT, 1], // SamplesPerPixel
    [278, LONG, height], // RowsPerStrip
    [279, LONG, stripBytes], // StripByteCounts
    [282, RATIONAL, X_RES_AT], // XResolution
    [283, RATIONAL, Y_RES_AT], // YResolution
    [296, SHORT, 2], // ResolutionUnit: inch
  ];
  dv.setUint16(HEADER, TAG_COUNT, true);
  entries.forEach(([tag, type, value], i) => {
    const at = HEADER + 2 + i * 12;
    dv.setUint16(at, tag, true);
    dv.setUint16(at + 2, type, true);
    dv.setUint32(at + 4, 1, true);
    if (type === SHORT) dv.setUint16(at + 8, value, true);
    else dv.setUint32(at + 8, value, true);
  });
  dv.setUint32(HEADER + 2 + TAG_COUNT * 12, 0, true); // no further IFDs

  for (const at of [X_RES_AT, Y_RES_AT]) {
    dv.setUint32(at, 72, true);
    dv.setUint32(at + 4, 1, true);
  }

  for (let row = 0; row < height; row++) {
    const pick = height - 1 - row;
    const base = STRIP_AT + row * rowBytes;
    for (let x = 0; x < width; x++) {
      if (lifted[pick * width + x]) bytes[base + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return bytes;
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run lib/tiff.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tiff.ts lib/tiff.test.ts
git commit -m "feat: 1-bit TIFF lift-plan encoder for Jacquard looms"
```

---

### Task 4: Weaving notes

**Files:**
- Create: `lib/weavingNotes.ts`
- Test: `lib/weavingNotes.test.ts`

**Interfaces:**
- Consumes: `Draft`, `SEPARATOR_PICKS`, `TC2_ENDS_PER_MODULE`, `LoomProfile` (Task 1); `DraftMeta`, `sourceLine` (Task 2); `decadeLabel` from `@/lib/weave`.
- Produces: `weavingNotes(draft: Draft, meta: DraftMeta, profile: LoomProfile): string` from `@/lib/weavingNotes`.

- [ ] **Step 1: Write the failing tests**

Create `lib/weavingNotes.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { DecadeWeave } from "@/types/collectionWeave";
import { collectionTapestry, decadeSwatch } from "./weaveDraft";
import { weavingNotes } from "./weavingNotes";
import type { DraftMeta } from "./wif";

const META: DraftMeta = { title: "The collection", source: "search-index", dataDate: "2026-10-19", generated: "2026-10-19" };

function decade(d: number, overrides: Partial<DecadeWeave> = {}): DecadeWeave {
  return { decade: d, garments: 10, colors: { black: 3, white: 1 }, materials: { silk: 1 }, techniques: {}, ...overrides };
}

const tapestry = collectionTapestry(
  [decade(1900), decade(1910, { garments: 0, colors: {}, materials: {} }), decade(1920, { colors: { red: 1 }, materials: { wool: 1 } })],
  "shaft",
);

function weftRuns(notes: string): [number, number][] {
  return [...notes.matchAll(/^picks (\d+)–(\d+):/gm)].map((m) => [Number(m[1]), Number(m[2])]);
}

describe("weavingNotes", () => {
  it("lists every pick exactly once, in order", () => {
    const runs = weftRuns(weavingNotes(tapestry, META, "shaft"));
    expect(runs[0][0]).toBe(1);
    expect(runs.at(-1)![1]).toBe(tapestry.picks);
    runs.slice(1).forEach(([start], i) => expect(start).toBe(runs[i][1] + 1));
  });

  it("labels each decade's separator on its own line, even back to back", () => {
    const notes = weavingNotes(tapestry, META, "shaft");
    expect(notes).toContain("picks 1–4: undyed (ecru), 1900s separator");
    expect(notes).toContain("picks 5–34: black, 1900s");
    expect(notes).toContain("picks 35–44: white, 1900s");
    expect(notes).toContain("picks 45–48: undyed (ecru), 1910s separator (no catalogued garments)");
    expect(notes).toContain("picks 49–52: undyed (ecru), 1920s separator");
    expect(notes).toContain("picks 53–92: red, 1920s");
    expect(notes).toContain("picks 93–96: undyed (ecru), closing separator");
  });

  it("describes the warp and the loom setup", () => {
    const notes = weavingNotes(tapestry, META, "shaft");
    expect(notes).toContain("Warp: all 240 ends undyed (ecru)");
    expect(notes).toContain("8 shafts, straight draw");
    expect(notes).toContain("pick 1 is the bottom row");
  });

  it("gives TC2 module and density details for a Jacquard draft", () => {
    const notes = weavingNotes(decadeSwatch(decade(1910), "jacquard", { ends: 1320 }), META, "jacquard");
    expect(notes).toContain("6 TC2 modules");
    expect(notes).toContain("90 ends per inch");
  });

  it("summarises a swatch's warp colours and single weft", () => {
    const notes = weavingNotes(decadeSwatch(decade(1910), "shaft"), META, "shaft");
    expect(notes).toContain("black: 180 ends");
    expect(notes).toContain("white: 60 ends");
    expect(notes).toContain("picks 1–240: black weft");
  });

  it("warns about sample data only when it is sample data", () => {
    expect(weavingNotes(tapestry, { ...META, source: "ci-fixture" }, "shaft")).toContain("sample");
    expect(weavingNotes(tapestry, META, "shaft")).not.toContain("sample");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run lib/weavingNotes.test.ts`
Expected: FAIL, "Failed to resolve import "./weavingNotes"".

- [ ] **Step 3: Write the notes**

Create `lib/weavingNotes.ts`:

```ts
import { decadeLabel } from "./weave";
import { SEPARATOR_PICKS, TC2_ENDS_PER_MODULE, type Draft, type LoomProfile } from "./weaveDraft";
import { sourceLine, type DraftMeta } from "./wif";

// Plain-text notes a weaver works from: setup, warp, and the weft colour
// sequence (a Jacquard lifts the warp, but the weaver still throws each
// colour), with decade labels so they can find their place in the tapestry.

const TC2_EPI_PER_MODULE = 15;
const TC2_WIDTH_INCHES = 14.5;

function warpLines(draft: Draft): string[] {
  const counts = new Map<number, number>();
  for (const c of draft.warpColor) counts.set(c, (counts.get(c) ?? 0) + 1);
  if (counts.size === 1) return [`Warp: all ${draft.ends} ends ${draft.palette[draft.warpColor[0]].code}.`];
  return [
    "Warp, in repeating colour bands:",
    ...[...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => `  ${draft.palette[c].code}: ${n} ends`),
  ];
}

function weftLines(draft: Draft): string[] {
  const bandOf = (pick: number) => draft.bands.findIndex((b) => pick >= b.firstPick && pick <= b.lastPick);
  const labelFor = (pick: number) => {
    const i = bandOf(pick);
    if (i === -1) return draft.bands.length > 0 ? "closing separator" : "";
    const band = draft.bands[i];
    const name = decadeLabel(band.decade);
    if (pick >= band.firstPick + SEPARATOR_PICKS) return name;
    const empty = band.lastPick - band.firstPick + 1 === SEPARATOR_PICKS;
    return `${name} separator${empty ? " (no catalogued garments)" : ""}`;
  };

  const lines: string[] = [];
  let start = 1;
  for (let pick = 1; pick <= draft.picks; pick++) {
    const next = pick + 1;
    const sameRun =
      next <= draft.picks &&
      draft.weftColor[next - 1] === draft.weftColor[pick - 1] &&
      labelFor(next) === labelFor(pick);
    if (sameRun) continue;
    const label = labelFor(pick);
    const colour = draft.palette[draft.weftColor[pick - 1]].code;
    lines.push(`picks ${start}–${pick}: ${colour}${label ? `, ${label}` : ""}`);
    start = next;
  }
  return lines;
}

export function weavingNotes(draft: Draft, meta: DraftMeta, profile: LoomProfile): string {
  const setup =
    profile === "shaft"
      ? [
          `Loom: ${draft.shafts} shafts, straight draw (end n on shaft ((n - 1) mod ${draft.shafts}) + 1), rising-shed liftplan in the .wif.`,
          "Structures for a shaft loom: satin as 8-shaft satin, figured as a 2/2 broken twill; lace, chiffon and knits as plain weave.",
        ]
      : [
          `Loom: digital Jacquard, ${draft.ends / TC2_ENDS_PER_MODULE} TC2 modules, ${
            (draft.ends / TC2_ENDS_PER_MODULE) * TC2_EPI_PER_MODULE
          } ends per inch on ${TC2_WIDTH_INCHES}-inch cloth.`,
          "Lift plan: the .tif, one pixel per end per pick, black = end lifted. Flip or invert it if your software expects otherwise.",
          "Structures match the screen: 5-end satin and the 16-thread diamond; lace, chiffon and knits as plain weave.",
        ];

  return [
    meta.title,
    sourceLine(meta),
    `Generated ${meta.generated} at uvahcc.org.`,
    "",
    `Size: ${draft.ends} ends × ${draft.picks} picks.`,
    ...setup,
    "Orientation: pick 1 is woven first; pick 1 is the bottom row of the lift-plan image.",
    "",
    ...warpLines(draft),
    "",
    "Weft sequence:",
    ...weftLines(draft),
    "",
  ].join("\n");
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run lib/weavingNotes.test.ts`
Expected: PASS. Check the swatch case if it fails: 0.75 × 24 = 18 black of every 24 ends, which is 180 of 240, and white is 60.

- [ ] **Step 5: Commit**

```bash
git add lib/weavingNotes.ts lib/weavingNotes.test.ts
git commit -m "feat: weaving notes with decade-labelled weft sequence"
```

---

### Task 5: Export panel on the timeline

**Files:**
- Create: `components/timeline/WeaveExport.tsx`
- Modify: `components/timeline/CollectionWeaveView.tsx` (imports at the top; the scrubber block at about lines 69–76; the aside's structure line at about line 102)

**Interfaces:**
- Consumes: `decadeSwatch`, `collectionTapestry`, `TC2_ENDS_PER_MODULE`, `DEFAULT_MODULES`, `type Draft`, `type LoomProfile` (Task 1); `toWif`, `type DraftMeta` (Task 2); `toBilevelTiff` (Task 3); `weavingNotes` (Task 4); `decadeLabel` from `@/lib/weave`; `CollectionWeave`, `DecadeWeave` types.
- Produces: `WeaveExport`, with props `({ mode: "decade"; decade: DecadeWeave } | { mode: "collection"; decades: DecadeWeave[] }) & { source: CollectionWeave["source"]; dataDate: string }`.

- [ ] **Step 1: Create the component**

Create `components/timeline/WeaveExport.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { CollectionWeave, DecadeWeave } from "@/types/collectionWeave";
import { decadeLabel } from "@/lib/weave";
import {
  DEFAULT_MODULES,
  TC2_ENDS_PER_MODULE,
  collectionTapestry,
  decadeSwatch,
  type Draft,
  type LoomProfile,
} from "@/lib/weaveDraft";
import { toWif, type DraftMeta } from "@/lib/wif";
import { toBilevelTiff } from "@/lib/tiff";
import { weavingNotes } from "@/lib/weavingNotes";

type Props = ({ mode: "decade"; decade: DecadeWeave } | { mode: "collection"; decades: DecadeWeave[] }) & {
  source: CollectionWeave["source"];
  dataDate: string;
};

type Kind = "wif" | "tif" | "png" | "txt";

const MODULE_CHOICES = Array.from({ length: 12 }, (_, i) => i + 1);

function save(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function pngOf(draft: Draft): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = draft.ends;
  canvas.height = draft.picks;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("no canvas"));
  const image = ctx.createImageData(draft.ends, draft.picks);
  for (let row = 0; row < draft.picks; row++) {
    const pick = draft.picks - 1 - row; // pick 1 on the bottom row, as in the TIFF
    for (let x = 0; x < draft.ends; x++) {
      const v = draft.lifted[pick * draft.ends + x] ? 0 : 255;
      const at = (row * draft.ends + x) * 4;
      image.data[at] = v;
      image.data[at + 1] = v;
      image.data[at + 2] = v;
      image.data[at + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png"),
  );
}

// "Weave this decade" / "Weave the whole collection": loom-ready downloads,
// built only when a button is pressed.
export default function WeaveExport(props: Props) {
  const [open, setOpen] = useState(false);
  const [modules, setModules] = useState(DEFAULT_MODULES);
  const [error, setError] = useState<string | null>(null);

  const slug = props.mode === "decade" ? decadeLabel(props.decade.decade) : "collection";
  const title =
    props.mode === "decade" ? `UVA Historic Clothing Collection, ${slug}` : "UVA Historic Clothing Collection, woven by decade";

  const build = (profile: LoomProfile): Draft => {
    const ends = profile === "jacquard" ? TC2_ENDS_PER_MODULE * modules : undefined;
    return props.mode === "decade"
      ? decadeSwatch(props.decade, profile, { ends })
      : collectionTapestry(props.decades, profile, { ends });
  };

  const meta = (): DraftMeta => ({
    title,
    source: props.source,
    dataDate: props.dataDate,
    generated: new Date().toISOString().slice(0, 10),
  });

  const download = async (kind: Kind) => {
    setError(null);
    try {
      const jacquardTag = `jacquard-${modules}mod`;
      if (kind === "wif") {
        save(new Blob([toWif(build("shaft"), meta())], { type: "text/plain" }), `uvahcc-weave-${slug}-shaft.wif`);
      } else if (kind === "tif") {
        save(new Blob([toBilevelTiff(build("jacquard"))], { type: "image/tiff" }), `uvahcc-weave-${slug}-${jacquardTag}.tif`);
      } else if (kind === "png") {
        save(await pngOf(build("jacquard")), `uvahcc-weave-${slug}-${jacquardTag}.png`);
      } else {
        const m = meta();
        const text = [
          "=== Shaft loom (.wif) ===",
          weavingNotes(build("shaft"), m, "shaft"),
          `=== Digital Jacquard (.tif, ${modules} modules) ===`,
          weavingNotes(build("jacquard"), m, "jacquard"),
        ].join("\n");
        save(new Blob([text], { type: "text/plain" }), `uvahcc-weave-${slug}-notes.txt`);
      }
    } catch (e) {
      setError(e instanceof RangeError ? e.message : "Couldn't create the file. Try again.");
    }
  };

  const button =
    "px-3 py-2 border border-archive-border text-xs uppercase tracking-[0.2em] text-archive-fg hover:border-archive-border-hover transition-colors";

  return (
    <div className="text-sm text-archive-muted">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={button}>
        {props.mode === "decade" ? "Weave this decade" : "Weave the whole collection"}
      </button>
      {open && (
        <div className="mt-3 space-y-3 border border-archive-border p-4">
          <p>
            {props.mode === "decade"
              ? "A swatch of this decade's cloth as a loom draft."
              : "The whole collection as one tapestry: an undyed warp, each decade a band of weft stripes, oldest first."}
          </p>
          {props.source === "ci-fixture" && (
            <p className="text-xs uppercase tracking-[0.2em] text-archive-muted-subtle">Preview data from a sample of the collection.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={button} onClick={() => download("wif")}>
              WIF (shaft loom)
            </button>
            <button type="button" className={button} onClick={() => download("tif")}>
              TIFF (Jacquard)
            </button>
            <button type="button" className={button} onClick={() => download("png")}>
              PNG preview
            </button>
            <button type="button" className={button} onClick={() => download("txt")}>
              Weaving notes
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <span>Jacquard width</span>
            <select
              value={modules}
              onChange={(e) => setModules(Number(e.target.value))}
              className="bg-archive-bg border border-archive-border px-2 py-1 text-archive-fg"
            >
              {MODULE_CHOICES.map((m) => (
                <option key={m} value={m}>
                  {m} TC2 {m === 1 ? "module" : "modules"} ({m * TC2_ENDS_PER_MODULE} ends)
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs">
            WIF opens in weaving software and fits an 8-shaft loom. TIFF is the lift plan for a digital Jacquard
            (black = lifted, first pick at the bottom). The notes list each weft colour change.
          </p>
          {error && (
            <p role="alert" className="text-xs text-archive-signal">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Place it in the view**

In `components/timeline/CollectionWeaveView.tsx`:
1. Add the import after `import DecadeScrubber from "./DecadeScrubber";`:

```tsx
import WeaveExport from "./WeaveExport";
```

2. After the `<div className="mt-4">…<DecadeScrubber …/></div>` block (the one ending `onCommit={setPosition}\n            />\n          </div>`), insert:

```tsx
          <div className="mt-6">
            <WeaveExport mode="collection" decades={weave.decades} source={weave.source} dataDate={weave.generated} />
          </div>
```

3. Replace the aside line `{decade.garments > 0 && <p>{structureLabel(weaveStructure(decade.materials))}</p>}` with:

```tsx
          {decade.garments > 0 && <p>{structureLabel(weaveStructure(decade.materials))}</p>}
          <WeaveExport mode="decade" decade={decade} source={weave.source} dataDate={weave.generated} />
```

- [ ] **Step 3: Typecheck, lint and test**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: clean, with all tests passing.

- [ ] **Step 4: Check it in the browser**

Run `npm run dev` (if routes 404, delete `.next/dev` and restart). On `/timeline`:
- Open "Weave this decade" and download all four files. Then open "Weave the whole collection" and download all four with the width set to 12 modules.
- The `.wif` opens as text with the expected sections. Parse it back with the test's `rebuild` logic (or a WIF viewer such as an online WIF preview, or `pip install pyweaving` and `pyweaving.wif.WIFReader`).
- The `.tif` and `.png` open in an image viewer as black-and-white lift plans. For the tapestry, the bands of the different weaves are visible, with separators between them.
- The notes list the weft sequence by decade, and the sample-data line appears with the fixture data.
- No console errors, and the buttons work by keyboard.

- [ ] **Step 5: Commit**

```bash
git add components/timeline/WeaveExport.tsx components/timeline/CollectionWeaveView.tsx
git commit -m "feat: download the woven timeline as loom drafts"
```

---

### Task 6: Full verification

- [ ] **Step 1:** `npm test && npx tsc --noEmit && npm run lint && npm run build`. Expected: all pass, and `/timeline` is in the build output. If the build fails inside `next/font/google` while a dev server is running, stop the dev server and rebuild (seen on 2026-10-19).
- [ ] **Step 2:** In the final report, note the open items from the spec: confirm with a TC2 user whether the bottom row is woven first, whether black means lifted, and the preferred file type; and remember the drafts follow the sample data until the real export runs.
