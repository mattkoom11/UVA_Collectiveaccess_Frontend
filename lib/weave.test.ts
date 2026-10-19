import { describe, it, expect } from "vitest";
import type { DecadeWeave } from "@/types/collectionWeave";
import {
  MAX_DENSITY,
  MIN_DENSITY,
  MULTI_HEXES,
  NEUTRAL_HEX,
  UNDYED,
  cellJitter,
  clothPlan,
  colorHex,
  colorShares,
  decadeLabel,
  decadeSummary,
  defaultDecadeIndex,
  garmentCount,
  shadeHex,
  structureLabel,
  threadDensity,
  warpOver,
  warpRepeat,
  weaveStructure,
} from "./weave";

function decade(overrides: Partial<DecadeWeave> = {}): DecadeWeave {
  return {
    decade: 1910,
    garments: 63,
    colors: { black: 31, white: 24, cream: 12, blue: 33 },
    materials: { silk: 40, cotton: 20 },
    techniques: {},
    ...overrides,
  };
}

describe("colorShares", () => {
  it("returns shares in descending order, ties alphabetical", () => {
    const shares = colorShares(decade({ colors: { white: 1, black: 1, blue: 2 } }));
    expect(shares.map((s) => s.code)).toEqual(["blue", "black", "white"]);
    expect(shares[0].share).toBeCloseTo(0.5, 9);
  });
  it("is empty when there are no colours", () => {
    expect(colorShares(decade({ colors: {} }))).toEqual([]);
  });
});

describe("warpRepeat", () => {
  it("fills exactly the repeat width, in share order", () => {
    const repeat = warpRepeat([
      { code: "black", share: 0.5 },
      { code: "white", share: 0.3 },
      { code: "blue", share: 0.2 },
    ]);
    expect(repeat).toHaveLength(24);
    expect(repeat.filter((c) => c === "black")).toHaveLength(12);
    expect(repeat.filter((c) => c === "white")).toHaveLength(7);
    expect(repeat.filter((c) => c === "blue")).toHaveLength(5);
    expect(repeat.indexOf("white")).toBeGreaterThan(repeat.lastIndexOf("black"));
  });
  it("uses the largest remainder so counts always sum to the width", () => {
    const thirds = warpRepeat(
      [
        { code: "a", share: 1 / 3 },
        { code: "b", share: 1 / 3 },
        { code: "c", share: 1 / 3 },
      ],
      10,
    );
    expect(thirds).toHaveLength(10);
  });
  it("drops colours too small for a single thread", () => {
    const repeat = warpRepeat([
      { code: "black", share: 0.99 },
      { code: "gold", share: 0.01 },
    ]);
    expect(repeat).not.toContain("gold");
  });
  it("is undyed when there are no colours", () => {
    expect(warpRepeat([])).toEqual(Array(24).fill(UNDYED));
  });
});

describe("weaveStructure", () => {
  it.each([
    [{ silk: 3, cotton: 1 }, "satin"],
    [{ wool: 2 }, "twill"],
    [{ cotton: 1, linen: 1 }, "plain"],
    [{ lace: 2, cotton: 1 }, "gauze"],
    [{ spandex: 1 }, "knit"],
    [{ brocade: 2, cotton: 1 }, "figured"],
  ])("%j weaves as %s", (materials, structure) => {
    expect(weaveStructure(materials)).toBe(structure);
  });
  it("lets families pool their materials", () => {
    expect(weaveStructure({ cotton: 3, silk: 2, rayon: 2 })).toBe("satin");
  });
  it("falls back to plain when only non-woven materials are present", () => {
    expect(weaveStructure({ felt: 5, leather: 2, glass: 1, metal: 1 })).toBe("plain");
  });
  it("falls back to plain on a tie between families", () => {
    expect(weaveStructure({ silk: 2, wool: 2 })).toBe("plain");
  });
  it("falls back to plain with no materials or unknown codes", () => {
    expect(weaveStructure({})).toBe("plain");
    expect(weaveStructure({ mystery: 4 })).toBe("plain");
  });
});

describe("warpOver", () => {
  it("draws plain weave as a checkerboard", () => {
    expect([0, 1, 2, 3].map((x) => warpOver("plain", x, 0))).toEqual([true, false, true, false]);
    expect(warpOver("plain", 0, 1)).toBe(false);
  });
  it("draws 2/2 twill as a diagonal that shifts one thread per row", () => {
    expect([0, 1, 2, 3].map((x) => warpOver("twill", x, 0))).toEqual([true, true, false, false]);
    expect([0, 1, 2, 3].map((x) => warpOver("twill", x, 1))).toEqual([true, false, false, true]);
  });
  it("draws warp-faced satin with one weft float in five", () => {
    const row = [0, 1, 2, 3, 4].map((x) => warpOver("satin", x, 0));
    expect(row.filter((v) => !v)).toHaveLength(1);
  });
  it("inverts the twill inside the figured diamond motif", () => {
    expect(warpOver("figured", 8, 8)).toBe(!warpOver("twill", 8, 8));
    expect(warpOver("figured", 0, 0)).toBe(warpOver("twill", 0, 0));
  });
  it("handles negative coordinates", () => {
    expect(typeof warpOver("satin", -3, -7)).toBe("boolean");
  });
});

describe("threadDensity", () => {
  it("is the minimum for an empty decade", () => {
    expect(threadDensity(0, 100)).toBe(MIN_DENSITY);
  });
  it("is the maximum for the busiest decade", () => {
    expect(threadDensity(100, 100)).toBe(MAX_DENSITY);
  });
  it("grows on a log scale", () => {
    const low = threadDensity(5, 100);
    const mid = threadDensity(30, 100);
    expect(low).toBeGreaterThan(MIN_DENSITY);
    expect(mid).toBeGreaterThan(low);
    expect(mid).toBeLessThan(MAX_DENSITY);
  });
});

describe("colorHex and shadeHex", () => {
  it("maps vocabulary colours and falls back to neutral", () => {
    expect(colorHex("black")).toMatch(/^#[0-9a-f]{6}$/);
    expect(colorHex(UNDYED)).toBe(NEUTRAL_HEX);
    expect(colorHex("chartreuse")).toBe(NEUTRAL_HEX);
  });
  it("alternates multi-coloured thread by cell", () => {
    expect(colorHex("multi", 0)).toBe(MULTI_HEXES[0]);
    expect(colorHex("multi", 1)).toBe(MULTI_HEXES[1]);
    expect(colorHex("multi", -1)).toBe(MULTI_HEXES[1]);
  });
  it("darkens and lightens", () => {
    expect(shadeHex("#808080", 0)).toBe("#808080");
    expect(shadeHex("#808080", -1)).toBe("#000000");
    expect(shadeHex("#808080", 1)).toBe("#ffffff");
    expect(shadeHex("#ff0000", -0.5)).toBe("#800000");
  });
});

describe("cellJitter", () => {
  it("is deterministic and small", () => {
    const values = Array.from({ length: 200 }, (_, i) => cellJitter(i % 17, Math.floor(i / 17), 1910));
    expect(values.every((v) => v >= -0.06 && v <= 0.06)).toBe(true);
    expect(cellJitter(3, 4, 1910)).toBe(cellJitter(3, 4, 1910));
    expect(new Set(values.map((v) => v.toFixed(4))).size).toBeGreaterThan(50);
  });
});

describe("garmentCount and decadeSummary", () => {
  it("never shows 0 garments for a decade that has some weight", () => {
    expect(garmentCount(decade({ garments: 0.3 }))).toBe(1);
    expect(decadeSummary(decade({ garments: 0.3, colors: {}, materials: {} }))).toBe("1910s · 1 garment");
  });
  it("rounds larger counts", () => {
    expect(garmentCount(decade({ garments: 62.6 }))).toBe(63);
  });
  it("summarises colours and materials", () => {
    expect(decadeSummary(decade())).toBe("1910s · 63 garments · blue 33%, black 31%, white 24% · mostly silk, cotton");
  });
  it("describes an empty decade", () => {
    expect(decadeSummary(decade({ decade: 1830, garments: 0, colors: {}, materials: {} }))).toBe(
      "No catalogued garments from the 1830s",
    );
    expect(garmentCount(decade({ garments: 0 }))).toBe(0);
  });
  it("labels decades", () => {
    expect(decadeLabel(1910)).toBe("1910s");
  });
});

describe("structureLabel", () => {
  it("names every structure", () => {
    for (const s of ["satin", "twill", "plain", "gauze", "knit", "figured"] as const) {
      expect(structureLabel(s).length).toBeGreaterThan(0);
    }
    expect(structureLabel("satin")).toBe("Woven as satin");
  });
});

describe("defaultDecadeIndex", () => {
  it("picks the busiest decade, first on a tie", () => {
    expect(
      defaultDecadeIndex([decade({ garments: 2 }), decade({ garments: 9 }), decade({ garments: 9 })]),
    ).toBe(1);
  });
  it("is 0 for an empty list", () => {
    expect(defaultDecadeIndex([])).toBe(0);
  });
});

describe("clothPlan", () => {
  it("lays out warp threads by colour and sizes rows to fill the height", () => {
    const plan = clothPlan(decade(), 63, 960, 320);
    expect(plan.cols).toBe(MAX_DENSITY);
    expect(plan.cell).toBeCloseTo(10, 9);
    expect(plan.rows).toBe(32);
    expect(plan.warp).toHaveLength(plan.cols);
    expect(plan.structure).toBe("satin");
    expect(plan.weftHex).toMatch(/^#[0-9a-f]{6}$/);
    expect(plan.seed).toBe(1910);
  });
  it("keeps the weft visible against a dark leading colour", () => {
    const lum = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
    };
    const dark = clothPlan(decade({ colors: { black: 10 } }), 63, 960, 320);
    expect(lum(dark.weftHex) - lum(colorHex("black"))).toBeGreaterThan(60);
    const light = clothPlan(decade({ colors: { white: 10 } }), 63, 960, 320);
    expect(lum(colorHex("white")) - lum(light.weftHex)).toBeGreaterThan(60);
  });
  it("draws nothing for a zero-size container instead of infinite rows", () => {
    const plan = clothPlan(decade(), 63, 0, 0);
    expect(plan.rows).toBe(0);
    expect(Number.isFinite(plan.cell)).toBe(true);
  });
  it("weaves undyed thread for a decade without colours", () => {
    const plan = clothPlan(decade({ garments: 0, colors: {}, materials: {} }), 63, 480, 160);
    expect(plan.cols).toBe(MIN_DENSITY);
    expect(new Set(plan.warp)).toEqual(new Set([UNDYED]));
  });
});
