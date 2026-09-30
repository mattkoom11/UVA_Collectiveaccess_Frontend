import { describe, it, expect } from "vitest";
import {
  AISLE_MAX_X,
  AISLE_MIN_X,
  ENTRANCE_DEPTH,
  LEFT_WALL_X,
  PLATFORM_BASE_HEIGHT,
  PLATFORM_STEP,
  RIGHT_WALL_X,
  buildHallLayout,
  clampToBounds,
  fitToHeight,
  wingIndexAt,
} from "./hallLayout";
import { buildMuseumLayout } from "./museum";
import type { Era, Garment } from "@/types/garment";

let nextId = 0;
function garment(era: Era, kind: "flagship" | "photo", overrides: Partial<Garment> = {}): Garment {
  const id = String(++nextId);
  return {
    id,
    slug: `g-${id}`,
    label: `Garment ${id}`,
    era,
    images: kind === "photo" ? ["https://x.invalid/p.jpg"] : [],
    ...(kind === "flagship" ? { featuredOnRunway: true, model3d_url: "/models/x.glb" } : {}),
    ...overrides,
  };
}

function layoutFor(garments: Garment[]) {
  return buildHallLayout(buildMuseumLayout(garments));
}

describe("buildHallLayout", () => {
  it("lays the four wings end to end, stepping the runway up each era", () => {
    const { wings, hallEndZ } = layoutFor([]);
    expect(wings).toHaveLength(4);
    expect(wings[0].zStart).toBe(0);
    for (let i = 1; i < wings.length; i++) {
      expect(wings[i].zStart).toBeLessThan(wings[i - 1].zEnd);
      expect(wings[i].platformHeight).toBeCloseTo(PLATFORM_BASE_HEIGHT + i * PLATFORM_STEP);
    }
    expect(hallEndZ).toBeLessThan(wings[3].zEnd);
  });

  it("keeps empty wings short and wings with garments at a minimum walkable length", () => {
    const { wings } = layoutFor([garment("1950-1980", "photo")]);
    expect(wings[0].zStart - wings[0].zEnd).toBe(6);
    expect(wings[2].zStart - wings[2].zEnd).toBeGreaterThanOrEqual(14);
  });

  it("stands flagships on the runway, facing the aisle, spread along the wing", () => {
    const { wings } = layoutFor([garment("1920-1950", "flagship"), garment("1920-1950", "flagship")]);
    const wing = wings[1];
    expect(wing.flagshipSlots).toHaveLength(2);
    for (const slot of wing.flagshipSlots) {
      expect(slot.position[0]).toBe(0);
      expect(slot.position[1]).toBe(wing.platformHeight);
      expect(slot.position[2]).toBeLessThan(wing.zStart);
      expect(slot.position[2]).toBeGreaterThan(wing.zEnd);
      expect(slot.rotationY).toBeCloseTo(Math.PI / 2);
    }
    const [a, b] = wing.flagshipSlots;
    expect(a.position[2]).toBeGreaterThan(b.position[2]);
  });

  it("puts the inspection viewpoint in the aisle, aimed at the garment", () => {
    const { wings } = layoutFor([garment("pre-1920", "flagship")]);
    const { position, inspect } = wings[0].flagshipSlots[0];
    expect(inspect.position[0]).toBeGreaterThanOrEqual(AISLE_MIN_X);
    expect(inspect.position[2]).toBe(position[2]);
    expect(inspect.target[0]).toBe(0);
    expect(inspect.target[1]).toBeGreaterThan(position[1]);
  });

  it("hangs lightboxes on both walls, facing into the hall", () => {
    const photos = Array.from({ length: 4 }, () => garment("1950-1980", "photo"));
    const slots = layoutFor(photos).wings[2].lightboxSlots;
    expect(slots.map((s) => s.wall)).toEqual(["right", "right", "left", "left"]);
    for (const s of slots) {
      if (s.wall === "right") {
        expect(s.position[0]).toBeLessThan(RIGHT_WALL_X);
        expect(s.rotationY).toBeCloseTo(-Math.PI / 2);
      } else {
        expect(s.position[0]).toBeGreaterThan(LEFT_WALL_X);
        expect(s.rotationY).toBeCloseTo(Math.PI / 2);
      }
    }
  });

  it("keeps lightboxes in collection order, advancing along the wing", () => {
    const photos = Array.from({ length: 9 }, (_, i) => garment("1980+", "photo", { yearApprox: 1980 + i }));
    const slots = layoutFor(photos).wings[3].lightboxSlots;
    expect(slots.map((s) => s.garment.yearApprox)).toEqual(photos.map((p) => p.yearApprox));
    expect(slots[4].position[2]).toBeLessThan(slots[0].position[2]);
  });

  it("lengthens a wing to fit a large wall of photos", () => {
    const photos = Array.from({ length: 200 }, () => garment("1920-1950", "photo"));
    const wing = layoutFor(photos).wings[1];
    const lastZ = Math.min(...wing.lightboxSlots.map((s) => s.position[2]));
    expect(lastZ).toBeGreaterThan(wing.zEnd);
  });

  it("starts the visitor in the entrance lobby, in the aisle, looking down the hall", () => {
    const { start, bounds } = layoutFor([]);
    const [x, , z] = start.position;
    expect(x).toBeGreaterThanOrEqual(AISLE_MIN_X);
    expect(x).toBeLessThanOrEqual(AISLE_MAX_X);
    expect(z).toBeGreaterThan(0);
    expect(z).toBeLessThanOrEqual(bounds.maxZ);
    expect(bounds.maxZ).toBeLessThan(ENTRANCE_DEPTH);
    expect(start.yaw).toBe(0);
  });
});

describe("wingIndexAt", () => {
  const layout = layoutFor([]);

  it("is -1 in the entrance lobby", () => {
    expect(wingIndexAt(layout, 3)).toBe(-1);
  });

  it("finds the wing the visitor is standing in", () => {
    for (const w of layout.wings) {
      expect(wingIndexAt(layout, (w.zStart + w.zEnd) / 2)).toBe(w.index);
    }
  });

  it("stays in the wing being left while crossing the gap to the next", () => {
    const gapZ = (layout.wings[0].zEnd + layout.wings[1].zStart) / 2;
    expect(wingIndexAt(layout, gapZ)).toBe(0);
  });
});

describe("clampToBounds", () => {
  const layout = layoutFor([]);

  it("keeps the visitor in the aisle and inside the hall", () => {
    expect(clampToBounds(layout, 0, 0)).toEqual([AISLE_MIN_X, 0]);
    expect(clampToBounds(layout, 99, 99)).toEqual([AISLE_MAX_X, layout.bounds.maxZ]);
    expect(clampToBounds(layout, 4, -9999)).toEqual([4, layout.bounds.minZ]);
  });
});

describe("fitToHeight", () => {
  it("scales a model to the target height and stands it on the floor", () => {
    const box = { min: { x: 10, y: 5, z: -2 }, max: { x: 14, y: 25, z: 2 } };
    const { scale, offset } = fitToHeight(box, 2);
    expect(scale).toBeCloseTo(0.1);
    expect(offset[0]).toBeCloseTo(-1.2);
    expect(offset[1]).toBeCloseTo(-0.5);
    expect(offset[2]).toBeCloseTo(0);
  });

  it("leaves a flat model unscaled", () => {
    const box = { min: { x: 0, y: 1, z: 0 }, max: { x: 1, y: 1, z: 1 } };
    expect(fitToHeight(box, 2).scale).toBe(1);
  });
});
