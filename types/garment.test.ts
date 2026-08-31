import { describe, it, expect } from "vitest";
import { getEraFromDecade, normalizeMaterials, getGarmentTypeFromWorkType } from "./garment";

describe("getEraFromDecade", () => {
  it("prefers an explicit era when given", () => {
    expect(getEraFromDecade("1900s", 1975, "1975", "1980+")).toBe("1980+");
  });

  it("derives era from yearApprox", () => {
    expect(getEraFromDecade(undefined, 1915)).toBe("pre-1920");
    expect(getEraFromDecade(undefined, 1935)).toBe("1920-1950");
    expect(getEraFromDecade(undefined, 1965)).toBe("1950-1980");
    expect(getEraFromDecade(undefined, 1995)).toBe("1980+");
  });

  it("derives era from a parseable date string", () => {
    expect(getEraFromDecade(undefined, undefined, "1945")).toBe("1920-1950");
  });

  it("derives era from a decade string like '1960s'", () => {
    expect(getEraFromDecade("1960s")).toBe("1950-1980");
  });

  it("returns undefined when no usable date info is present", () => {
    expect(getEraFromDecade()).toBeUndefined();
    expect(getEraFromDecade(undefined, undefined, "not-a-date")).toBeUndefined();
  });

  it("handles boundary years correctly", () => {
    expect(getEraFromDecade(undefined, 1920)).toBe("1920-1950");
    expect(getEraFromDecade(undefined, 1950)).toBe("1950-1980");
    expect(getEraFromDecade(undefined, 1980)).toBe("1980+");
  });
});

describe("normalizeMaterials", () => {
  it("returns an empty array for undefined", () => {
    expect(normalizeMaterials(undefined)).toEqual([]);
  });

  it("wraps a single string in an array", () => {
    expect(normalizeMaterials("Silk")).toEqual(["Silk"]);
  });

  it("passes through an existing array unchanged", () => {
    expect(normalizeMaterials(["Silk", "Cotton"])).toEqual(["Silk", "Cotton"]);
  });
});

describe("getGarmentTypeFromWorkType", () => {
  it("returns 'other' when work_type is missing", () => {
    expect(getGarmentTypeFromWorkType(undefined)).toBe("other");
  });

  it("maps exact known labels", () => {
    expect(getGarmentTypeFromWorkType("Dress")).toBe("dress");
    expect(getGarmentTypeFromWorkType("blue jeans")).toBe("pants-trousers");
    expect(getGarmentTypeFromWorkType("Overcoat")).toBe("coat");
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(getGarmentTypeFromWorkType("  DRESS  ")).toBe("dress");
  });

  it("falls back to substring matching for unlisted labels", () => {
    expect(getGarmentTypeFromWorkType("Evening Gown")).toBe("dress");
    expect(getGarmentTypeFromWorkType("Leather Boot")).toBe("footwear");
  });

  it("falls back to 'other' for unrecognized labels", () => {
    expect(getGarmentTypeFromWorkType("mystery-object")).toBe("other");
  });
});
