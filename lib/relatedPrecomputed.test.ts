import { describe, it, expect, vi } from "vitest";
import type { Garment } from "@/types/garment";

// A tiny stand-in for data/related.json so the tests don't depend on the real export.
vi.mock("@/data/related.json", () => ({
  default: {
    generated: "2026-10-11",
    k: 4,
    related: {
      // Deliberately the reverse of what the weighted score returns for this fixture (b, c, d),
      // so the precedence test can only pass if the re-ranker list is actually used.
      "DR.2023.1": ["DR.2023.4", "DR.2023.9", "DR.2023.3", "DR.2023.2"],
      "ACS.2024.2": ["ACS.2024.1"],
    },
  },
}));

const { getPrecomputedRelated, getPrecomputedRelatedAccessions } = await import("./relatedPrecomputed");
const { getEnhancedRelatedGarments } = await import("./relatedGarments");

function g(id: string, accessionNumber?: string, overrides: Partial<Garment> = {}): Garment {
  return { id, slug: id, label: id, images: [], accessionNumber, ...overrides };
}

const all = [
  g("a", "DR.2023.1"), g("b", "DR.2023.2"), g("c", "DR.2023.3"), g("d", "DR.2023.4"),
  g("fan1", "ACS.2024.1"), g("fan2", "ACS.2024.2"), g("x", undefined),
];

describe("getPrecomputedRelatedAccessions", () => {
  it("returns the re-ranker's list, or [] for unknown or missing accessions", () => {
    expect(getPrecomputedRelatedAccessions("ACS.2024.2")).toEqual(["ACS.2024.1"]);
    expect(getPrecomputedRelatedAccessions("NOPE.1.1")).toEqual([]);
    expect(getPrecomputedRelatedAccessions(undefined)).toEqual([]);
  });
});

describe("getPrecomputedRelated", () => {
  it("keeps the re-ranker's order and skips garments that aren't loaded", () => {
    // DR.2023.9 isn't in `all`, so it's skipped rather than leaving a gap
    expect(getPrecomputedRelated(all[0], all, 4).map((x) => x.id)).toEqual(["d", "c", "b"]);
  });

  it("respects the limit and excluded ids", () => {
    expect(getPrecomputedRelated(all[0], all, 2).map((x) => x.id)).toEqual(["d", "c"]);
    expect(getPrecomputedRelated(all[0], all, 4, new Set(["c"])).map((x) => x.id)).toEqual(["d", "b"]);
  });

  it("returns nothing for garments without an accession number or a precomputed list", () => {
    expect(getPrecomputedRelated(all[6], all, 4)).toEqual([]);
    expect(getPrecomputedRelated(all[1], all, 4)).toEqual([]);
  });
});

describe("getEnhancedRelatedGarments precedence", () => {
  it("puts curator picks first, then the re-ranker's picks, then the weighted score", () => {
    const curated = g("a", "DR.2023.1", { relatedIds: ["fan1"] });
    const result = getEnhancedRelatedGarments(curated, all, 4).map((x) => x.id);
    expect(result[0]).toBe("fan1"); // curator's explicit pick
    expect(result.slice(1, 4)).toEqual(["d", "c", "b"]); // then the re-ranker, in its order
  });

  it("falls back to the weighted score when there's no precomputed list", () => {
    const result = getEnhancedRelatedGarments(all[6], all, 4);
    expect(result.length).toBe(4);
  });
});
