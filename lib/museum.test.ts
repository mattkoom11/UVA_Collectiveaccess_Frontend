import { describe, it, expect } from "vitest";
import {
  WINGS,
  buildMuseumLayout,
  getDetailModelUrl,
  getGarmentYear,
  getPreviewModelUrl,
  getSegmentKey,
  isFlagship,
} from "./museum";
import type { Garment } from "@/types/garment";

function makeGarment(overrides: Partial<Garment>): Garment {
  return {
    id: overrides.id ?? "1",
    slug: overrides.slug ?? `garment-${overrides.id ?? "1"}`,
    label: overrides.label ?? `Garment ${overrides.id ?? "1"}`,
    images: [],
    ...overrides,
  };
}

const PHOTO = { images: ["https://example.invalid/photo.jpg"] };
const MODEL = { model3d_url: "https://example.invalid/dress.glb" };

describe("getPreviewModelUrl", () => {
  it("prefers the file marked web_preview", () => {
    const g = makeGarment({
      models: [
        { url: "https://x/full.glb", role: "full_detail" },
        { url: "https://x/preview.glb", role: "web_preview" },
      ],
    });
    expect(getPreviewModelUrl(g)).toBe("https://x/preview.glb");
  });

  it("uses any non-archival file when none is marked preview", () => {
    const g = makeGarment({
      models: [
        { url: "https://x/master.glb", role: "archival_master" },
        { url: "https://x/unmarked.glb" },
      ],
    });
    expect(getPreviewModelUrl(g)).toBe("https://x/unmarked.glb");
  });

  it("never returns the archival master", () => {
    const g = makeGarment({ models: [{ url: "https://x/master.glb", role: "archival_master" }] });
    expect(getPreviewModelUrl(g)).toBeUndefined();
  });

  it("falls back to the legacy model3d_url and modelUrl fields", () => {
    expect(getPreviewModelUrl(makeGarment({ model3d_url: "/models/a.glb" }))).toBe("/models/a.glb");
    expect(getPreviewModelUrl(makeGarment({ modelUrl: "/models/b.glb" }))).toBe("/models/b.glb");
    expect(getPreviewModelUrl(makeGarment({}))).toBeUndefined();
  });
});

describe("getDetailModelUrl", () => {
  it("prefers the full_detail file", () => {
    const g = makeGarment({
      models: [
        { url: "https://x/preview.glb", role: "web_preview" },
        { url: "https://x/full.glb", role: "full_detail" },
      ],
    });
    expect(getDetailModelUrl(g)).toBe("https://x/full.glb");
  });

  it("falls back to the preview when there is no detail file", () => {
    expect(getDetailModelUrl(makeGarment(MODEL))).toBe(MODEL.model3d_url);
  });
});

describe("isFlagship", () => {
  it("needs both the featured flag and a loadable 3D file", () => {
    expect(isFlagship(makeGarment({ featuredOnRunway: true, ...MODEL }))).toBe(true);
    expect(isFlagship(makeGarment({ featuredOnRunway: true }))).toBe(false);
    expect(isFlagship(makeGarment({ featuredOnRunway: false, ...MODEL }))).toBe(false);
    expect(isFlagship(makeGarment(MODEL))).toBe(false);
  });

  it("keeps an unreviewed orientation off the runway; garments without the flag are unaffected", () => {
    expect(isFlagship(makeGarment({ featuredOnRunway: true, orientationReviewed: false, ...MODEL }))).toBe(false);
    expect(isFlagship(makeGarment({ featuredOnRunway: true, orientationReviewed: true, ...MODEL }))).toBe(true);
    expect(isFlagship(makeGarment({ featuredOnRunway: true, ...MODEL }))).toBe(true);
  });

  it("does not count an archival master as loadable", () => {
    const g = makeGarment({
      featuredOnRunway: true,
      models: [{ url: "https://x/master.glb", role: "archival_master" }],
    });
    expect(isFlagship(g)).toBe(false);
  });
});

describe("getSegmentKey", () => {
  it("uses the garment's era", () => {
    expect(getSegmentKey(makeGarment({ era: "1920-1950" }))).toBe("1920-1950");
    expect(getSegmentKey(makeGarment({ decade: "1890s" }))).toBe("pre-1920");
  });

  it("puts undated garments on the New Acquisitions stage", () => {
    expect(getSegmentKey(makeGarment({}))).toBe("acquisitions");
  });
});

describe("getGarmentYear", () => {
  it("reads yearApprox, then date, then decade", () => {
    expect(getGarmentYear(makeGarment({ yearApprox: 1925, date: "1930" }))).toBe(1925);
    expect(getGarmentYear(makeGarment({ date: "circa 1932–1935" }))).toBe(1932);
    expect(getGarmentYear(makeGarment({ decade: "1960s" }))).toBe(1960);
    expect(getGarmentYear(makeGarment({}))).toBeUndefined();
  });
});

describe("buildMuseumLayout", () => {
  it("always returns all four wings in chronological order", () => {
    const { wings } = buildMuseumLayout([]);
    expect(wings.map((w) => w.era)).toEqual(WINGS.map((w) => w.era));
    expect(wings.map((w) => w.numeral)).toEqual(["I", "II", "III", "IV"]);
    expect(buildMuseumLayout([]).acquisitions).toEqual([]);
  });

  it("puts undated flagships in New Acquisitions", () => {
    const g = makeGarment({ id: "a", featuredOnRunway: true, ...MODEL });
    const { acquisitions, wings, unplaced } = buildMuseumLayout([g]);
    expect(acquisitions.map((x) => x.id)).toEqual(["a"]);
    expect(unplaced).toEqual([]);
    expect(wings.every((w) => w.flagships.length === 0 && w.lightboxes.length === 0)).toBe(true);
  });

  it("keeps an undated flagship awaiting orientation review off the stage", () => {
    const g = makeGarment({ id: "u", featuredOnRunway: true, orientationReviewed: false, ...MODEL });
    const { acquisitions, unplaced } = buildMuseumLayout([g]);
    expect(acquisitions).toEqual([]);
    expect(unplaced.map((x) => x.id)).toEqual(["u"]);
  });

  it("keeps undated photo-only pieces unplaced", () => {
    const g = makeGarment({ id: "p", ...PHOTO });
    const { acquisitions, unplaced } = buildMuseumLayout([g]);
    expect(acquisitions).toEqual([]);
    expect(unplaced.map((x) => x.id)).toEqual(["p"]);
  });

  it("keeps dated flagships in their wing", () => {
    const g = makeGarment({ id: "d", era: "pre-1920", featuredOnRunway: true, ...MODEL });
    const { acquisitions, wings } = buildMuseumLayout([g]);
    expect(acquisitions).toEqual([]);
    expect(wings.find((w) => w.era === "pre-1920")!.flagships.map((x) => x.id)).toEqual(["d"]);
  });

  // Acquisitions are undated by definition, so the fallback order is by label.
  it("orders acquisitions by curator runwayOrder, then label", () => {
    const base = { featuredOnRunway: true, ...MODEL };
    const garments = [
      makeGarment({ id: "late", label: "Zed", ...base }),
      makeGarment({ id: "second", runwayOrder: 2, ...base }),
      makeGarment({ id: "early", label: "Alpha", ...base }),
      makeGarment({ id: "first", runwayOrder: 1, ...base }),
    ];
    expect(buildMuseumLayout(garments).acquisitions.map((g) => g.id)).toEqual(["first", "second", "early", "late"]);
  });

  it("puts flagships on the runway and photo pieces on the walls", () => {
    const flagship = makeGarment({ id: "f", era: "1920-1950", featuredOnRunway: true, ...MODEL });
    const photo = makeGarment({ id: "p", era: "1920-1950", ...PHOTO });
    const { wings } = buildMuseumLayout([flagship, photo]);
    const wing = wings.find((w) => w.era === "1920-1950")!;
    expect(wing.flagships.map((g) => g.id)).toEqual(["f"]);
    expect(wing.lightboxes.map((g) => g.id)).toEqual(["p"]);
  });

  it("hangs a featured garment without a 3D file as a lightbox", () => {
    const g = makeGarment({ id: "x", era: "1980+", featuredOnRunway: true, ...PHOTO });
    const wing = buildMuseumLayout([g]).wings.find((w) => w.era === "1980+")!;
    expect(wing.flagships).toHaveLength(0);
    expect(wing.lightboxes.map((w) => w.id)).toEqual(["x"]);
  });

  it("derives the wing from the date when era is missing", () => {
    const g = makeGarment({ id: "d", decade: "1960s", ...PHOTO });
    const wing = buildMuseumLayout([g]).wings.find((w) => w.era === "1950-1980")!;
    expect(wing.lightboxes.map((w) => w.id)).toEqual(["d"]);
  });

  it("returns undated garments and ones with nothing to show as unplaced", () => {
    const undated = makeGarment({ id: "u", ...PHOTO });
    const nothingToShow = makeGarment({ id: "n", era: "pre-1920" });
    const { wings, unplaced } = buildMuseumLayout([undated, nothingToShow]);
    expect(unplaced.map((g) => g.id).sort()).toEqual(["n", "u"]);
    expect(wings.every((w) => w.flagships.length === 0 && w.lightboxes.length === 0)).toBe(true);
  });

  it("orders flagships by curator runwayOrder, then year", () => {
    const base = { era: "1920-1950" as const, featuredOnRunway: true, ...MODEL };
    const garments = [
      makeGarment({ id: "late", yearApprox: 1945, ...base }),
      makeGarment({ id: "second", runwayOrder: 2, yearApprox: 1921, ...base }),
      makeGarment({ id: "early", yearApprox: 1922, ...base }),
      makeGarment({ id: "first", runwayOrder: 1, yearApprox: 1940, ...base }),
    ];
    const wing = buildMuseumLayout(garments).wings.find((w) => w.era === "1920-1950")!;
    expect(wing.flagships.map((g) => g.id)).toEqual(["first", "second", "early", "late"]);
  });

  it("orders lightboxes by year, with undated ones last", () => {
    const garments = [
      makeGarment({ id: "1970", era: "1950-1980", yearApprox: 1970, ...PHOTO }),
      makeGarment({ id: "undated", era: "1950-1980", ...PHOTO }),
      makeGarment({ id: "1955", era: "1950-1980", yearApprox: 1955, ...PHOTO }),
    ];
    const wing = buildMuseumLayout(garments).wings.find((w) => w.era === "1950-1980")!;
    expect(wing.lightboxes.map((g) => g.id)).toEqual(["1955", "1970", "undated"]);
  });
});
