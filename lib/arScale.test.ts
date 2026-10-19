import { describe, it, expect } from "vitest";
import {
  DRESS_FORM_HEIGHT_CM,
  arScaleFactor,
  modelViewerOrientation,
  prefersARSheet,
  targetHeightCm,
} from "./arScale";

describe("targetHeightCm", () => {
  it("uses the garment's own height when it is plausible", () => {
    expect(targetHeightCm({ height_cm: 132 })).toBe(132);
  });
  it("accepts the range boundaries", () => {
    expect(targetHeightCm({ height_cm: 20 })).toBe(20);
    expect(targetHeightCm({ height_cm: 300 })).toBe(300);
  });
  it.each([
    ["missing", undefined],
    ["zero", 0],
    ["negative", -40],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["entered in millimetres", 1450],
    ["too small to be a garment", 5],
  ])("falls back to the dress form when height is %s", (_label, height) => {
    expect(targetHeightCm({ height_cm: height })).toBe(DRESS_FORM_HEIGHT_CM);
  });
});

describe("arScaleFactor", () => {
  it("scales a 2-unit model to 1.45 m", () => {
    expect(arScaleFactor(2, 145)).toBeCloseTo(0.725, 9);
  });
  it("scales a 30-unit raw scan to 1.2 m", () => {
    expect(arScaleFactor(30, 120)).toBeCloseTo(0.04, 9);
  });
  it.each([0, -1, Number.NaN])("returns 1 when the raw height is %s", (raw) => {
    expect(arScaleFactor(raw, 145)).toBe(1);
  });
});

describe("modelViewerOrientation", () => {
  it("puts the rotation in the yaw slot", () => {
    expect(modelViewerOrientation(135)).toBe("0deg 0deg 135deg");
  });
  it("defaults to no rotation", () => {
    expect(modelViewerOrientation()).toBe("0deg 0deg 0deg");
  });
});

describe("prefersARSheet", () => {
  it("is true for a touch device with a coarse pointer", () => {
    expect(prefersARSheet({ maxTouchPoints: 5, coarsePointer: true })).toBe(true);
  });
  it("is false for a desktop", () => {
    expect(prefersARSheet({ maxTouchPoints: 0, coarsePointer: false })).toBe(false);
  });
  it("is false for a touchscreen laptop driven by a mouse", () => {
    expect(prefersARSheet({ maxTouchPoints: 10, coarsePointer: false })).toBe(false);
  });
});
