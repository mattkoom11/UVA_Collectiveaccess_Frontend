import { describe, it, expect } from "vitest";
import { loadCollectionWeave, scannedGarments, scannedInDecade } from "./collectionWeave";
import type { Garment } from "@/types/garment";

const decade = (d: number, garments = 3) => ({
  decade: d,
  garments,
  colors: { black: 2, white: 1 },
  materials: { silk: 3 },
  techniques: {},
});

const valid = {
  generated: "2026-10-19",
  source: "ci-fixture",
  rows: 10,
  dated: 6,
  century_only: 2,
  undated: 2,
  decades: [decade(1900), decade(1910, 0)],
  scanned: { "DR.2023.17": { earliest: 1910, latest: 1920 } },
};

describe("loadCollectionWeave", () => {
  it("accepts a valid export", () => {
    const weave = loadCollectionWeave(valid);
    expect(weave?.source).toBe("ci-fixture");
    expect(weave?.decades.map((d) => d.decade)).toEqual([1900, 1910]);
    expect(weave?.scanned).toEqual({ "DR.2023.17": { earliest: 1910, latest: 1920 } });
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "weave"],
    ["an empty object", {}],
    ["no decades", { ...valid, decades: [] }],
    ["decades not an array", { ...valid, decades: {} }],
    ["an unknown source", { ...valid, source: "spreadsheet" }],
    ["a string garment count", { ...valid, decades: [{ ...decade(1900), garments: "3" }] }],
    ["a negative weight", { ...valid, decades: [{ ...decade(1900), colors: { black: -1 } }] }],
    ["a non-integer decade", { ...valid, decades: [{ ...decade(1900), decade: 1900.5 }] }],
  ])("returns null for %s", (_label, raw) => {
    expect(loadCollectionWeave(raw)).toBeNull();
  });

  it("drops malformed scanned entries but keeps the rest", () => {
    const weave = loadCollectionWeave({
      ...valid,
      scanned: {
        "DR.1": { earliest: 1910, latest: 1920 },
        "DR.2": { earliest: "1910", latest: 1920 },
        "DR.3": { earliest: 1930, latest: 1920 },
        "DR.4": null,
      },
    });
    expect(weave?.scanned).toEqual({ "DR.1": { earliest: 1910, latest: 1920 } });
  });

  it("treats a missing scanned map as empty", () => {
    expect(loadCollectionWeave({ ...valid, scanned: undefined })?.scanned).toEqual({});
  });
});

describe("scannedInDecade", () => {
  const scanned = {
    "DR.B": { earliest: 1905, latest: 1921 },
    "DR.A": { earliest: 1910, latest: 1910 },
    "DR.C": { earliest: 1890, latest: 1909 },
  };

  it("lists accessions whose range overlaps the decade, sorted", () => {
    expect(scannedInDecade(scanned, 1910)).toEqual(["DR.A", "DR.B"]);
  });
  it("includes a range that only touches the decade's first or last year", () => {
    expect(scannedInDecade(scanned, 1920)).toEqual(["DR.B"]);
    expect(scannedInDecade(scanned, 1900)).toEqual(["DR.B", "DR.C"]);
  });
  it("excludes decades outside every range", () => {
    expect(scannedInDecade(scanned, 1930)).toEqual([]);
  });
});

describe("scannedGarments", () => {
  const g = (id: string, accessionNumber?: string, model3d_url?: string) =>
    ({ id, slug: id, label: id, images: [], accessionNumber, model3d_url }) as Garment;

  it("keeps only garments with a 3D model whose accession is in the scanned map", () => {
    const garments = [
      g("a", "DR.1", "/models/a.glb"),
      g("b", "DR.2", "/models/b.glb"),
      g("c", "DR.1"),
      g("d", undefined, "/models/d.glb"),
    ];
    const kept = scannedGarments(garments, { "DR.1": { earliest: 1910, latest: 1920 } });
    expect(kept.map((x) => x.id)).toEqual(["a"]);
  });
  it("is empty when nothing is scanned", () => {
    expect(scannedGarments([g("a", "DR.1", "/m.glb")], {})).toEqual([]);
  });
});
