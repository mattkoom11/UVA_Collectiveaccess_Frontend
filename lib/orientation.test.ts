import { describe, it, expect } from "vitest";
import { applyOrientationReview, itemPageYawDeg, normalizeDegrees, runwayYawDeg } from "./orientation";

describe("normalizeDegrees", () => {
  it("maps any angle into (-180, 180]", () => {
    expect(normalizeDegrees(270)).toBe(-90);
    expect(normalizeDegrees(-90)).toBe(-90);
    expect(normalizeDegrees(180)).toBe(180);
    expect(normalizeDegrees(-180)).toBe(180);
    expect(normalizeDegrees(405)).toBe(45);
    expect(normalizeDegrees(-405)).toBe(-45);
  });

  it("never returns -0", () => {
    expect(Object.is(normalizeDegrees(360), 0)).toBe(true);
    expect(Object.is(normalizeDegrees(-360), 0)).toBe(true);
    expect(Object.is(normalizeDegrees(-0), 0)).toBe(true);
  });
});

describe("pose yaws", () => {
  it("turns the runway 45° one way and the item page 45° the other", () => {
    expect(runwayYawDeg(135)).toBe(180);
    expect(itemPageYawDeg(135)).toBe(90);
  });

  it("treats a missing angle as 0", () => {
    expect(runwayYawDeg(undefined)).toBe(45);
    expect(itemPageYawDeg(undefined)).toBe(-45);
  });
});

describe("applyOrientationReview", () => {
  const records = [
    { id: "a", model3d_rotationY: 0, orientationReviewed: false },
    { id: "b", model3d_rotationY: 90, orientationReviewed: false },
  ];

  it("returns null for an unknown id", () => {
    expect(applyOrientationReview(records, "zzz", 45)).toBeNull();
  });

  it("sets the normalized angle and the reviewed flag on the target only", () => {
    const updated = applyOrientationReview(records, "b", 270)!;
    expect(updated[1]).toEqual({ id: "b", model3d_rotationY: -90, orientationReviewed: true });
    expect(updated[0]).toBe(records[0]);
  });

  it("keeps the key order of the target record", () => {
    const updated = applyOrientationReview([{ id: "a", label: "A", model3d_rotationY: 0, orientationReviewed: false, x: 1 }], "a", 5)!;
    expect(Object.keys(updated[0])).toEqual(["id", "label", "model3d_rotationY", "orientationReviewed", "x"]);
  });

  it("does not mutate its input", () => {
    applyOrientationReview(records, "a", 45);
    expect(records[0]).toEqual({ id: "a", model3d_rotationY: 0, orientationReviewed: false });
  });
});
