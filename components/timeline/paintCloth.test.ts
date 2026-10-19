import { describe, it, expect } from "vitest";
import { paintCloth } from "./paintCloth";
import { GRID_COLS, initialState, rgbCss, weaveTarget, type WeaveState } from "@/lib/weaveBlend";
import type { DecadeWeave } from "@/types/collectionWeave";

// A canvas stand-in that records the colours the painter uses.
function recorder() {
  const fills = new Set<string>();
  const strokes = new Set<string>();
  let rects = 0;
  const ctx = {
    set fillStyle(v: string) {
      fills.add(v);
    },
    set strokeStyle(v: string) {
      strokes.add(v);
    },
    lineWidth: 1,
    lineCap: "butt",
    fillRect: () => {
      rects += 1;
    },
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, fills, strokes, rects: () => rects };
}

const decade: DecadeWeave = {
  decade: 1910,
  garments: 40,
  colors: { black: 3, white: 2, blue: 2, red: 1, gold: 1 },
  materials: { silk: 2, cotton: 1 },
  techniques: {},
};

const state = (overrides: Partial<WeaveState> = {}): WeaveState => ({
  ...initialState(weaveTarget(decade, 77)),
  ...overrides,
});

// Columns + weft + loom + highlight + 9 shade levels.
const MAX_DISTINCT = GRID_COLS + 1 + 1 + 1 + 9;

describe("paintCloth", () => {
  it.each([
    ["a settled cloth", state()],
    ["a weave change in progress", state({ from: "plain", to: "satin", flip: 0.5 })],
    ["a knitted cloth", state({ from: "knit", to: "knit" })],
    ["a gauze cloth", state({ from: "gauze", to: "gauze" })],
  ])("builds colours per column, not per cell, for %s", (_label, s) => {
    const { ctx, fills, strokes } = recorder();
    paintCloth(ctx, s, 960, 640);
    const used = new Set([...fills, ...strokes]);
    expect(used.size).toBeLessThanOrEqual(MAX_DISTINCT);
    // Knitted warp is stroked, woven warp is filled; either way it's the column colour.
    expect(used.has(rgbCss(s.colors[0]))).toBe(true);
  });

  it("paints nothing for a zero-size container", () => {
    const { ctx, rects } = recorder();
    paintCloth(ctx, state(), 0, 0);
    expect(rects()).toBe(0);
  });
});
