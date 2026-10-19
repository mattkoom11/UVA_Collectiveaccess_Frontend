import { describe, it, expect } from "vitest";
import {
  DEFAULT_AZIMUTH_DEG,
  DEFAULT_ELEVATION_DEG,
  MAX_ELEVATION_DEG,
  MIN_ELEVATION_DEG,
  advanceAzimuth,
  clampElevation,
  initialLightState,
  lightPosition,
  normalizeDeg,
  pointerToAzimuth,
  shouldSweep,
} from "./conservatorLight";

function expectVec(actual: [number, number, number], expected: [number, number, number]) {
  actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 6));
}

describe("normalizeDeg", () => {
  it("wraps into [0, 360)", () => {
    expect(normalizeDeg(0)).toBe(0);
    expect(normalizeDeg(360)).toBe(0);
    expect(normalizeDeg(370)).toBe(10);
    expect(normalizeDeg(-10)).toBe(350);
    expect(normalizeDeg(-720)).toBe(0);
  });
});

describe("lightPosition", () => {
  it("puts azimuth 0 on the far side of the garment (-z)", () => {
    expectVec(lightPosition(0, 0, 6), [0, 0, -6]);
  });
  it("puts azimuth 90 on the right (+x)", () => {
    expectVec(lightPosition(90, 0, 6), [6, 0, 0]);
  });
  it("puts azimuth 180 on the camera side (+z)", () => {
    expectVec(lightPosition(180, 0, 6), [0, 0, 6]);
  });
  it("puts elevation 90 straight overhead regardless of azimuth", () => {
    expectVec(lightPosition(45, 90, 6), [0, 6, 0]);
  });
  it("keeps the light on a sphere of the given radius", () => {
    const [x, y, z] = lightPosition(123, 12, 6);
    expect(Math.hypot(x, y, z)).toBeCloseTo(6, 6);
  });
});

describe("pointerToAzimuth", () => {
  // Screen coordinates: +dx is right, +dy is DOWN.
  it("maps the four dial directions", () => {
    expect(pointerToAzimuth(0, -10)).toBeCloseTo(0, 6);
    expect(pointerToAzimuth(10, 0)).toBeCloseTo(90, 6);
    expect(pointerToAzimuth(0, 10)).toBeCloseTo(180, 6);
    expect(pointerToAzimuth(-10, 0)).toBeCloseTo(270, 6);
  });
  it("returns values in [0, 360)", () => {
    const az = pointerToAzimuth(-1, -1)!;
    expect(az).toBeCloseTo(315, 6);
    expect(az).toBeGreaterThanOrEqual(0);
    expect(az).toBeLessThan(360);
  });
  it("returns null at the exact centre so the light does not jump", () => {
    expect(pointerToAzimuth(0, 0)).toBeNull();
  });
});

describe("advanceAzimuth", () => {
  it("moves a quarter turn in a quarter period", () => {
    expect(advanceAzimuth(0, 5, 20)).toBeCloseTo(90, 6);
  });
  it("wraps past 360", () => {
    expect(advanceAzimuth(350, 1, 20)).toBeCloseTo(8, 6);
  });
  it("stays in range after a huge delta (tab was hidden for minutes)", () => {
    const az = advanceAzimuth(10, 1000.5, 20);
    expect(az).toBeGreaterThanOrEqual(0);
    expect(az).toBeLessThan(360);
    expect(az).toBeCloseTo(19, 6);
  });
});

describe("shouldSweep", () => {
  it("sweeps when nobody has touched the dial yet", () => {
    expect(shouldSweep(1000, -Infinity, false)).toBe(true);
  });
  it("pauses within 5 s of the last interaction", () => {
    expect(shouldSweep(10_000, 6_000, false)).toBe(false);
  });
  it("resumes 5 s after the last interaction", () => {
    expect(shouldSweep(11_000, 6_000, false)).toBe(true);
  });
  it("never sweeps under reduced motion", () => {
    expect(shouldSweep(1_000_000, -Infinity, true)).toBe(false);
  });
});

describe("clampElevation", () => {
  it("clamps to the allowed range", () => {
    expect(clampElevation(0)).toBe(MIN_ELEVATION_DEG);
    expect(clampElevation(90)).toBe(MAX_ELEVATION_DEG);
    expect(clampElevation(20)).toBe(20);
  });
});

describe("initialLightState", () => {
  it("starts at the defaults with no interaction recorded", () => {
    expect(initialLightState()).toEqual({
      azimuthDeg: DEFAULT_AZIMUTH_DEG,
      elevationDeg: DEFAULT_ELEVATION_DEG,
      lastInteractAtMs: -Infinity,
    });
  });
  it("returns a fresh object each call", () => {
    expect(initialLightState()).not.toBe(initialLightState());
  });
});
