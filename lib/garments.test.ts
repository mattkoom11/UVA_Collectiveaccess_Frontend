import { describe, it, expect } from "vitest";
import { filterGarments, mergeGarmentImages, searchGarments } from "./garments";
import type { Garment } from "@/types/garment";

function makeGarment(overrides: Partial<Garment>): Garment {
  return {
    id: "1",
    slug: "test-garment",
    label: "Test Garment",
    images: [],
    ...overrides,
  };
}

describe("filterGarments", () => {
  const items: Garment[] = [
    makeGarment({
      id: "1",
      slug: "silk-dress",
      decade: "1960s",
      work_type: "Dress",
      colors: ["Red", "Blue"],
      materials: ["Silk"],
      era: "1950-1980",
      type: "dress",
    }),
    makeGarment({
      id: "2",
      slug: "wool-coat",
      decade: "1930s",
      work_type: "Overcoat",
      colors: ["Black"],
      materials: ["Wool"],
      era: "1920-1950",
      type: "coat",
    }),
  ];

  it("returns all items when no filters are given", () => {
    expect(filterGarments(items, {})).toHaveLength(2);
  });

  it("filters by decade", () => {
    const result = filterGarments(items, { decade: "1960s" });
    expect(result.map((g) => g.id)).toEqual(["1"]);
  });

  it("filters by work_type", () => {
    const result = filterGarments(items, { work_type: "Overcoat" });
    expect(result.map((g) => g.id)).toEqual(["2"]);
  });

  it("filters by color case-insensitively", () => {
    const result = filterGarments(items, { color: "red" });
    expect(result.map((g) => g.id)).toEqual(["1"]);
  });

  it("filters by material case-insensitively", () => {
    const result = filterGarments(items, { material: "wool" });
    expect(result.map((g) => g.id)).toEqual(["2"]);
  });

  it("filters by era", () => {
    const result = filterGarments(items, { era: "1920-1950" });
    expect(result.map((g) => g.id)).toEqual(["2"]);
  });

  it("filters by garment type", () => {
    const result = filterGarments(items, { type: "dress" });
    expect(result.map((g) => g.id)).toEqual(["1"]);
  });

  it("combines multiple filters with AND semantics", () => {
    const result = filterGarments(items, { era: "1950-1980", type: "coat" });
    expect(result).toHaveLength(0);
  });

  it("returns nothing when no items match", () => {
    const result = filterGarments(items, { color: "green" });
    expect(result).toHaveLength(0);
  });
});

describe("searchGarments", () => {
  const items: Garment[] = [
    makeGarment({ id: "1", label: "Velvet Evening Gown", story: "Worn at a 1962 gala." }),
    makeGarment({ id: "2", label: "Denim Work Jacket", materials: ["Denim", "Cotton"] }),
  ];

  it("returns all items for an empty query", () => {
    expect(searchGarments(items, "")).toHaveLength(2);
    expect(searchGarments(items, "   ")).toHaveLength(2);
  });

  it("matches on label", () => {
    const result = searchGarments(items, "gown");
    expect(result.map((g) => g.id)).toEqual(["1"]);
  });

  it("matches on nested text fields like story", () => {
    const result = searchGarments(items, "gala");
    expect(result.map((g) => g.id)).toEqual(["1"]);
  });

  it("matches on materials", () => {
    const result = searchGarments(items, "denim");
    expect(result.map((g) => g.id)).toEqual(["2"]);
  });

  it("requires all terms to match (AND semantics across terms)", () => {
    const result = searchGarments(items, "velvet gala");
    expect(result.map((g) => g.id)).toEqual(["1"]);
  });

  it("returns nothing when no field matches", () => {
    expect(searchGarments(items, "nonexistent-term-xyz")).toHaveLength(0);
  });

  it("is case-insensitive", () => {
    const result = searchGarments(items, "GOWN");
    expect(result.map((g) => g.id)).toEqual(["1"]);
  });
});

describe("mergeGarmentImages", () => {
  const image = (url: string, thumb?: string) => ({ media_id: "m", url, thumbnail_url: thumb });

  it("fills in photos for garments that have none", () => {
    const [g] = mergeGarmentImages(
      [makeGarment({ id: "7" })],
      new Map([["7", [image("https://x.invalid/a.jpg", "https://x.invalid/a-thumb.jpg"), image("https://x.invalid/b.jpg")]]])
    );
    expect(g.images).toEqual(["https://x.invalid/a.jpg", "https://x.invalid/b.jpg"]);
    expect(g.imageUrl).toBe("https://x.invalid/a.jpg");
    expect(g.thumbnailUrl).toBe("https://x.invalid/a-thumb.jpg");
  });

  it("leaves garments that already have images untouched", () => {
    const original = makeGarment({ id: "7", images: ["https://x.invalid/existing.jpg"] });
    const [g] = mergeGarmentImages([original], new Map([["7", [image("https://x.invalid/new.jpg")]]]));
    expect(g).toBe(original);
  });

  it("uses the full image as the thumbnail when CA has no thumbnail", () => {
    const [g] = mergeGarmentImages([makeGarment({ id: "7" })], new Map([["7", [image("https://x.invalid/a.jpg")]]]));
    expect(g.thumbnailUrl).toBe("https://x.invalid/a.jpg");
  });

  it("skips images with no URL and garments with no lookup result", () => {
    const garments = [makeGarment({ id: "7" }), makeGarment({ id: "8" })];
    const result = mergeGarmentImages(garments, new Map([["7", [image("")]]]));
    expect(result[0].images).toEqual([]);
    expect(result[1].images).toEqual([]);
  });
});
