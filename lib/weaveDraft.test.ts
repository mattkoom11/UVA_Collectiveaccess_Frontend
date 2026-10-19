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
