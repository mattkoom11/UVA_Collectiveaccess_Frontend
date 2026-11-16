import { describe, it, expect } from "vitest";
import {
  AR_MODES,
  DRESS_FORM_HEIGHT_CM,
  arScaleFactor,
  modelViewerOrientation,
  needsSafariForAR,
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

describe("AR_MODES", () => {
  // Scene Viewer receives only the raw GLB URL: it ignores model-viewer's
  // runtime scale and orientation, so raw scans (24–46 units tall) would
  // appear tens of metres tall and could not be resized under ar-scale="fixed".
  it("excludes scene-viewer until the GLBs are pre-scaled to metres", () => {
    expect(AR_MODES.split(" ")).not.toContain("scene-viewer");
  });
  it("keeps WebXR and Quick Look, which both apply the runtime transform", () => {
    expect(AR_MODES.split(" ")).toEqual(["webxr", "quick-look"]);
  });
});

describe("needsSafariForAR", () => {
  const iphone = (tail: string) =>
    `Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) ${tail}`;
  const env = (userAgent: string, platform = "iPhone", maxTouchPoints = 5) => ({ userAgent, platform, maxTouchPoints });

  it.each([
    ["Google app", iphone("GSA/350.0.123 Mobile/15E148 Safari/604.1")],
    ["Chrome", iphone("CriOS/131.0.0.0 Mobile/15E148 Safari/604.1")],
    ["Firefox", iphone("FxiOS/133.0 Mobile/15E148 Safari/605.1.15")],
    ["Edge", iphone("EdgiOS/131.0 Mobile/15E148 Safari/605.1.15")],
    ["DuckDuckGo", iphone("Version/18.1 Mobile/15E148 DuckDuckGo/7 Safari/605.1.15")],
  ])("is true in the %s on iOS", (_, ua) => {
    expect(needsSafariForAR(env(ua))).toBe(true);
  });

  it("is false in Safari on iOS", () => {
    expect(needsSafariForAR(env(iphone("Version/18.1 Mobile/15E148 Safari/604.1")))).toBe(false);
  });

  it("treats an iPad reporting as a Mac as iOS", () => {
    const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Safari/604.1";
    expect(needsSafariForAR(env(ua, "MacIntel", 5))).toBe(true);
  });

  it("is false off iOS, even in Chrome", () => {
    const android = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36";
    expect(needsSafariForAR(env(android, "Linux armv8l"))).toBe(false);
  });
});
