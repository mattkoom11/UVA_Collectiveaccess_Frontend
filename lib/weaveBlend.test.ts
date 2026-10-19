import { describe, it, expect } from "vitest";
import type { DecadeWeave } from "@/types/collectionWeave";
import {
  GRID_COLS,
  MAX_THICKNESS,
  MIN_THICKNESS,
  blendDecades,
  cellStructure,
  clothRows,
  commitPosition,
  hexToRgb,
  initialState,
  nudgePosition,
  rgbCss,
  shadeRgb,
  stepToward,
  threadThickness,
  weaveTarget,
  type WeaveState,
} from "./weaveBlend";

function decade(d: number, overrides: Partial<DecadeWeave> = {}): DecadeWeave {
  return { decade: d, garments: 10, colors: { black: 1 }, materials: { cotton: 1 }, techniques: {}, ...overrides };
}

const DECADES = [
  decade(1900, { garments: 2, colors: { black: 2 }, materials: { cotton: 1 } }),
  decade(1910, { garments: 10, colors: { white: 10 }, materials: { silk: 1 } }),
  decade(1920, { garments: 4, colors: { red: 1 }, materials: { wool: 1 } }),
];

const settle = (state: WeaveState, target: ReturnType<typeof weaveTarget>, seconds: number, fps = 60) => {
  let s = state;
  let settled = false;
  for (let i = 0; i < seconds * fps; i++) ({ state: s, settled } = stepToward(s, target, 1 / fps));
  return { state: s, settled };
};

describe("blendDecades", () => {
  it("returns the decade itself at a whole position", () => {
    expect(blendDecades(DECADES, 1)).toEqual(DECADES[1]);
  });

  it("mixes garment counts linearly and colour shares evenly halfway", () => {
    const mid = blendDecades(DECADES, 0.5);
    expect(mid.garments).toBeCloseTo(6, 9);
    expect(mid.colors.black).toBeCloseTo(0.5, 9);
    expect(mid.colors.white).toBeCloseTo(0.5, 9);
  });

  it("weights shares by position, not by the decades' sizes", () => {
    const quarter = blendDecades(DECADES, 0.25);
    expect(quarter.colors.black).toBeCloseTo(0.75, 9);
    expect(quarter.colors.white).toBeCloseTo(0.25, 9);
  });

  it("names the nearest decade", () => {
    expect(blendDecades(DECADES, 0.4).decade).toBe(1900);
    expect(blendDecades(DECADES, 0.6).decade).toBe(1910);
  });

  it("clamps positions outside the range", () => {
    expect(blendDecades(DECADES, -3)).toEqual(DECADES[0]);
    expect(blendDecades(DECADES, 9)).toEqual(DECADES[2]);
  });
});

describe("threadThickness", () => {
  it("runs from thin for an empty decade to full for the busiest", () => {
    expect(threadThickness(0, 77)).toBe(MIN_THICKNESS);
    expect(threadThickness(77, 77)).toBeCloseTo(MAX_THICKNESS, 9);
    const a = threadThickness(5, 77);
    const b = threadThickness(30, 77);
    expect(a).toBeGreaterThan(MIN_THICKNESS);
    expect(b).toBeGreaterThan(a);
    expect(b).toBeLessThan(MAX_THICKNESS);
  });
});

describe("weaveTarget", () => {
  it("gives every column of the fixed grid a colour", () => {
    const target = weaveTarget(DECADES[1], 10);
    expect(target.colors).toHaveLength(GRID_COLS);
    expect(target.colors[0]).toEqual(hexToRgb("#f4f1ea"));
    expect(target.structure).toBe("satin");
    expect(target.thickness).toBeCloseTo(MAX_THICKNESS, 9);
  });
});

describe("stepToward", () => {
  const from = weaveTarget(DECADES[0], 10);
  const to = weaveTarget(DECADES[1], 10);

  it("does nothing with no elapsed time", () => {
    const start = initialState(from);
    const { state } = stepToward(start, to, 0);
    expect(state.colors[0]).toEqual(start.colors[0]);
    expect(state.thickness).toBe(start.thickness);
  });

  it("eases toward the target without overshooting", () => {
    let s = initialState(from);
    let previous = s.colors[10][0];
    for (let i = 0; i < 120; i++) {
      ({ state: s } = stepToward(s, to, 1 / 60));
      const r = s.colors[10][0];
      expect(r).toBeGreaterThanOrEqual(previous - 1e-9);
      expect(r).toBeLessThanOrEqual(to.colors[10][0] + 1e-9);
      previous = r;
    }
  });

  it("is still changing after a short time, so the change is gradual", () => {
    const { state, settled } = settle(initialState(from), to, 0.2);
    expect(settled).toBe(false);
    expect(state.colors[0][0]).toBeGreaterThan(from.colors[0][0]);
    expect(state.colors[0][0]).toBeLessThan(to.colors[0][0]);
  });

  it("re-dyes as a wave: left columns move ahead of right ones", () => {
    const { state } = stepToward(initialState(from), to, 0.1);
    const progress = (x: number) => (state.colors[x][0] - from.colors[x][0]) / (to.colors[x][0] - from.colors[x][0]);
    expect(progress(0)).toBeGreaterThan(progress(GRID_COLS - 1));
  });

  it("settles exactly on the target", () => {
    const { state, settled } = settle(initialState(from), to, 6);
    expect(settled).toBe(true);
    expect(state.colors).toEqual(to.colors);
    expect(state.thickness).toBe(to.thickness);
    expect(state.to).toBe(to.structure);
    expect(state.flip).toBe(1);
  });

  it("starts a structure change from the pattern currently showing", () => {
    const { state } = stepToward(initialState(from), to, 1 / 60);
    expect(state.from).toBe("plain");
    expect(state.to).toBe("satin");
    expect(state.flip).toBeGreaterThan(0);
    expect(state.flip).toBeLessThan(1);
  });

  it("caps a huge frame gap so a returning tab doesn't jump", () => {
    const { state } = stepToward(initialState(from), to, 30);
    expect(state.colors[0][0]).toBeLessThan(to.colors[0][0]);
  });
});

describe("cellStructure", () => {
  const state = (flip: number): WeaveState => ({ ...initialState(weaveTarget(DECADES[0], 10)), from: "plain", to: "satin", flip });
  const cells = (flip: number) =>
    Array.from({ length: 400 }, (_, i) => cellStructure(state(flip), i % 20, Math.floor(i / 20), 7));

  it("shows the old pattern before the change and the new one after", () => {
    expect(new Set(cells(0))).toEqual(new Set(["plain"]));
    expect(new Set(cells(1))).toEqual(new Set(["satin"]));
  });

  it("mixes both patterns partway through", () => {
    expect(new Set(cells(0.5))).toEqual(new Set(["plain", "satin"]));
  });

  it("never switches a cell back as the change progresses", () => {
    const early = cells(0.4);
    const later = cells(0.6);
    early.forEach((s, i) => {
      if (s === "satin") expect(later[i]).toBe("satin");
    });
  });
});

describe("clothRows", () => {
  it("sizes cells from the fixed grid", () => {
    expect(clothRows(960, 320)).toEqual({ cell: 10, rows: 32 });
  });
  it("draws nothing for a zero-size container", () => {
    expect(clothRows(0, 0).rows).toBe(0);
    expect(clothRows(0, 0).cell).toBeGreaterThan(0);
  });
});

describe("colour helpers", () => {
  it("converts and shades", () => {
    expect(hexToRgb("#ff8000")).toEqual([255, 128, 0]);
    expect(rgbCss([255, 128, 0])).toBe("rgb(255,128,0)");
    expect(rgbCss([10.6, 0.2, 254.9])).toBe("rgb(11,0,255)");
    expect(shadeRgb([128, 128, 128], -1)).toEqual([0, 0, 0]);
    expect(shadeRgb([128, 128, 128], 1)).toEqual([255, 255, 255]);
    expect(shadeRgb([200, 100, 0], 0)).toEqual([200, 100, 0]);
  });
});

describe("nudgePosition", () => {
  it("moves a whole decade from the nearest one with arrows", () => {
    expect(nudgePosition("ArrowRight", 3.4, 10)).toBe(4);
    expect(nudgePosition("ArrowUp", 3.6, 10)).toBe(5);
    expect(nudgePosition("ArrowLeft", 3.4, 10)).toBe(2);
    expect(nudgePosition("ArrowDown", 3, 10)).toBe(2);
  });
  it("jumps five decades with PageUp/PageDown and to the ends with Home/End", () => {
    expect(nudgePosition("PageUp", 2, 10)).toBe(7);
    expect(nudgePosition("PageDown", 2, 10)).toBe(0);
    expect(nudgePosition("Home", 6.2, 10)).toBe(0);
    expect(nudgePosition("End", 1, 10)).toBe(10);
  });
  it("clamps at the ends", () => {
    expect(nudgePosition("ArrowRight", 10, 10)).toBe(10);
    expect(nudgePosition("ArrowLeft", 0, 10)).toBe(0);
  });
  it("ignores other keys", () => {
    expect(nudgePosition("a", 3, 10)).toBeNull();
    expect(nudgePosition("Tab", 3, 10)).toBeNull();
  });
});

describe("commitPosition", () => {
  it("snaps a small nudge one whole decade in its direction (screen-reader swipes)", () => {
    expect(commitPosition(13, 13.01, 25)).toBe(14);
    expect(commitPosition(13, 12.99, 25)).toBe(12);
  });
  it("rounds a longer drag to the nearest decade", () => {
    expect(commitPosition(13, 15.2, 25)).toBe(15);
    expect(commitPosition(13, 10.6, 25)).toBe(11);
  });
  it("keeps a whole decade and clamps at the ends", () => {
    expect(commitPosition(13, 13, 25)).toBe(13);
    expect(commitPosition(25, 25.004, 25)).toBe(25);
    expect(commitPosition(0, -0.01, 25)).toBe(0);
  });
});

describe("reversing a weave change", () => {
  const plain = weaveTarget(decade(1900, { materials: { cotton: 1 } }), 10);
  const satin = weaveTarget(decade(1900, { materials: { silk: 1 } }), 10);
  const grid = (s: WeaveState) =>
    Array.from({ length: 400 }, (_, i) => cellStructure(s, i % 20, Math.floor(i / 20), 7));

  it("runs the change backwards instead of popping cells", () => {
    const mid: WeaveState = { ...initialState(plain), from: "plain", to: "satin", flip: 0.5 };
    const before = grid(mid);
    const { state } = stepToward(mid, plain, 1 / 60);
    const after = grid(state);
    // Going back to plain, cells may only return to plain; none may newly show satin.
    after.forEach((s, i) => {
      if (s === "satin") expect(before[i]).toBe("satin");
    });
    const changed = after.filter((s, i) => s !== before[i]).length;
    expect(changed).toBeLessThan(20);
  });

  it("finishes a reversal on the original pattern", () => {
    let s: WeaveState = { ...initialState(plain), from: "plain", to: "satin", flip: 0.5 };
    let settled = false;
    for (let i = 0; i < 600 && !settled; i++) ({ state: s, settled } = stepToward(s, plain, 1 / 60));
    expect(settled).toBe(true);
    expect(new Set(grid(s))).toEqual(new Set(["plain"]));
  });

  it("still starts a fresh change for a third pattern from what is showing", () => {
    const wool = weaveTarget(decade(1900, { materials: { wool: 1 } }), 10);
    const mid: WeaveState = { ...initialState(plain), from: "plain", to: "satin", flip: 0.7 };
    const { state } = stepToward(mid, wool, 1 / 60);
    expect(state.from).toBe("satin");
    expect(state.to).toBe("twill");
  });
});
