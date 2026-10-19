import { describe, it, expect } from "vitest";
import type { DecadeWeave } from "@/types/collectionWeave";
import { collectionTapestry, decadeSwatch } from "./weaveDraft";
import { weavingNotes } from "./weavingNotes";
import type { DraftMeta } from "./wif";

const META: DraftMeta = { title: "The collection", source: "search-index", dataDate: "2026-10-19", generated: "2026-10-19" };

function decade(d: number, overrides: Partial<DecadeWeave> = {}): DecadeWeave {
  return { decade: d, garments: 10, colors: { black: 3, white: 1 }, materials: { silk: 1 }, techniques: {}, ...overrides };
}

const tapestry = collectionTapestry(
  [decade(1900), decade(1910, { garments: 0, colors: {}, materials: {} }), decade(1920, { colors: { red: 1 }, materials: { wool: 1 } })],
  "shaft",
);

function weftRuns(notes: string): [number, number][] {
  return [...notes.matchAll(/^picks (\d+)–(\d+):/gm)].map((m) => [Number(m[1]), Number(m[2])]);
}

describe("weavingNotes", () => {
  it("lists every pick exactly once, in order", () => {
    const runs = weftRuns(weavingNotes(tapestry, META, "shaft"));
    expect(runs[0][0]).toBe(1);
    expect(runs.at(-1)![1]).toBe(tapestry.picks);
    runs.slice(1).forEach(([start], i) => expect(start).toBe(runs[i][1] + 1));
  });

  it("labels each decade's separator on its own line, even back to back", () => {
    const notes = weavingNotes(tapestry, META, "shaft");
    expect(notes).toContain("picks 1–4: undyed (ecru), 1900s separator");
    expect(notes).toContain("picks 5–34: black, 1900s");
    expect(notes).toContain("picks 35–44: white, 1900s");
    expect(notes).toContain("picks 45–48: undyed (ecru), 1910s separator (no catalogued garments)");
    expect(notes).toContain("picks 49–52: undyed (ecru), 1920s separator");
    expect(notes).toContain("picks 53–92: red, 1920s");
    expect(notes).toContain("picks 93–96: undyed (ecru), closing separator");
  });

  it("describes the warp and the loom setup", () => {
    const notes = weavingNotes(tapestry, META, "shaft");
    expect(notes).toContain("Warp: all 240 ends undyed (ecru)");
    expect(notes).toContain("8 shafts, straight draw");
    expect(notes).toContain("pick 1 is the bottom row");
  });

  it("gives TC2 module and density details for a Jacquard draft", () => {
    const notes = weavingNotes(decadeSwatch(decade(1910), "jacquard", { ends: 1320 }), META, "jacquard");
    expect(notes).toContain("6 TC2 modules");
    expect(notes).toContain("90 ends per inch");
  });

  it("summarises a swatch's warp colours and single weft", () => {
    const notes = weavingNotes(decadeSwatch(decade(1910), "shaft"), META, "shaft");
    expect(notes).toContain("Warp: repeat these 24 ends 10 times: 18 black, 6 white");
    expect(notes).toContain("picks 1–240: black weft");
  });

  it("says how to make a tapestry weft-faced, but not for a swatch", () => {
    expect(weavingNotes(tapestry, META, "shaft")).toContain("beat firmly");
    expect(weavingNotes(decadeSwatch(decade(1910), "shaft"), META, "shaft")).not.toContain("beat firmly");
  });

  it("notes a leftover part-repeat at the edge of the warp", () => {
    const notes = weavingNotes(decadeSwatch(decade(1910), "shaft", { ends: 250 }), META, "shaft");
    expect(notes).toContain("Warp: repeat these 24 ends 10 times: 18 black, 6 white, then the first 10 ends once more");
  });

  it("warns about sample data only when it is sample data", () => {
    expect(weavingNotes(tapestry, { ...META, source: "ci-fixture" }, "shaft")).toContain("sample");
    expect(weavingNotes(tapestry, META, "shaft")).not.toContain("sample");
  });
});
