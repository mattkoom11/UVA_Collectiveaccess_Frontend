import { describe, it, expect } from "vitest";
import { SEGMENT_PALETTES, assignLights, pickHallQuality, pickLitSlots, type SegmentKey } from "./hallLighting";
import type { Vec3 } from "./hallLayout";
import { WINGS } from "./museum";

describe("SEGMENT_PALETTES", () => {
  it("has a palette for every segment", () => {
    const keys: SegmentKey[] = ["acquisitions", ...WINGS.map((w) => w.era)];
    for (const key of keys) {
      const palette = SEGMENT_PALETTES[key];
      expect(palette).toBeDefined();
      for (const color of [palette.spot, palette.fill, palette.wash, palette.banner]) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });
});

describe("pickLitSlots", () => {
  const at = (id: string, z: number): { id: string; position: Vec3 } => ({ id, position: [0, 0, z] });
  const camera: Vec3 = [0, 0, 0];

  it("returns the nearest slots, nearest first", () => {
    const slots = [at("far", -30), at("near", -2), at("mid", -10), at("farther", -40)];
    expect(pickLitSlots(camera, slots, 2)).toEqual(["near", "mid"]);
  });

  it("breaks distance ties by id, so picks are stable", () => {
    expect(pickLitSlots(camera, [at("b", -5), at("a", 5)], 1)).toEqual(["a"]);
  });

  it("returns every slot when there are fewer than asked for", () => {
    expect(pickLitSlots(camera, [at("y", -8), at("x", -3)], 4)).toEqual(["x", "y"]);
  });

  it("returns nothing for a count of zero or no slots", () => {
    expect(pickLitSlots(camera, [at("a", -1)], 0)).toEqual([]);
    expect(pickLitSlots(camera, [], 3)).toEqual([]);
  });
});

describe("assignLights", () => {
  it("keeps a light on a slot that is still picked", () => {
    expect(assignLights(["a", "b"], ["b", "c"])).toEqual(["c", "b"]);
  });

  it("fills empty lights with newly picked slots", () => {
    expect(assignLights([null, null], ["a"])).toEqual(["a", null]);
  });

  it("clears lights whose slot was dropped", () => {
    expect(assignLights(["a"], [])).toEqual([null]);
  });

  it("never gives two lights the same slot", () => {
    const next = assignLights(["a", null, "c"], ["c", "a", "d"]);
    const ids = next.filter((id) => id !== null);
    expect(new Set(ids).size).toBe(ids.length);
    expect(next).toEqual(["a", "d", "c"]);
  });
});

describe("pickHallQuality", () => {
  const desktop = { coarsePointer: false, viewportWidth: 1280, cores: 8 };

  it("gives a desktop the high tier: 4 spotlights, sharper DPR, glossy runway", () => {
    expect(pickHallQuality(desktop)).toEqual({ tier: "high", spotlights: 4, dpr: [1, 1.75], glossyRunway: true });
  });

  it("gives the low tier to touch devices, narrow viewports and few cores", () => {
    expect(pickHallQuality({ ...desktop, coarsePointer: true }).tier).toBe("low");
    expect(pickHallQuality({ ...desktop, viewportWidth: 767 }).tier).toBe("low");
    expect(pickHallQuality({ ...desktop, viewportWidth: 768 }).tier).toBe("high");
    expect(pickHallQuality({ ...desktop, cores: 4 }).tier).toBe("low");
  });

  it("does not downgrade when the core count is unknown", () => {
    expect(pickHallQuality({ ...desktop, cores: undefined }).tier).toBe("high");
  });

  it("gives the low tier 2 spotlights, a lower DPR and a matte runway", () => {
    expect(pickHallQuality({ ...desktop, coarsePointer: true })).toEqual({
      tier: "low",
      spotlights: 2,
      dpr: [1, 1.25],
      glossyRunway: false,
    });
  });
});
