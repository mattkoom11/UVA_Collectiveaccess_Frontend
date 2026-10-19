import { describe, it, expect } from "vitest";
import type { DecadeWeave } from "@/types/collectionWeave";
import { collectionTapestry, decadeSwatch, type Draft } from "./weaveDraft";
import { toWif, type DraftMeta } from "./wif";

const META: DraftMeta = { title: "1910s swatch", source: "ci-fixture", dataDate: "2026-10-19", generated: "2026-10-19" };

function decade(d: number, overrides: Partial<DecadeWeave> = {}): DecadeWeave {
  return { decade: d, garments: 10, colors: { black: 3, white: 1 }, materials: { silk: 1 }, techniques: {}, ...overrides };
}

// A small reader used only to check our own output.
function parseWif(text: string): Map<string, Map<string, string>> {
  const sections = new Map<string, Map<string, string>>();
  let current = new Map<string, string>();
  for (const raw of text.split("\r\n")) {
    const line = raw.trim();
    if (!line) continue;
    const header = line.match(/^\[(.+)\]$/);
    if (header) {
      current = new Map();
      sections.set(header[1], current);
      continue;
    }
    const eq = line.indexOf("=");
    current.set(line.slice(0, eq), line.slice(eq + 1));
  }
  return sections;
}

function rebuild(text: string) {
  const s = parseWif(text);
  const ends = Number(s.get("WARP")!.get("Threads"));
  const picks = Number(s.get("WEFT")!.get("Threads"));
  const threading = s.get("THREADING")!;
  const liftplan = s.get("LIFTPLAN")!;
  const lifted = new Uint8Array(ends * picks);
  for (let y = 0; y < picks; y++) {
    const raised = new Set((liftplan.get(String(y + 1)) ?? "").split(",").filter(Boolean).map(Number));
    for (let x = 0; x < ends; x++) lifted[y * ends + x] = raised.has(Number(threading.get(String(x + 1)))) ? 1 : 0;
  }
  const colors = (section: string, count: number, fallback: number) =>
    Uint8Array.from({ length: count }, (_, i) => Number(s.get(section)!.get(String(i + 1)) ?? fallback) - 1);
  const warpColor = colors("WARP COLORS", ends, Number(s.get("WARP")!.get("Color")));
  const weftColor = colors("WEFT COLORS", picks, Number(s.get("WEFT")!.get("Color")));
  const table = s.get("COLOR TABLE")!;
  const rgb = [...table.entries()].map(([, v]) => v.split(",").map(Number));
  return { ends, picks, lifted, warpColor, weftColor, rgb, sections: s };
}

const drafts: [string, Draft][] = [
  ["a satin swatch", decadeSwatch(decade(1910), "shaft")],
  ["a plain swatch", decadeSwatch(decade(1910, { materials: { cotton: 1 } }), "shaft")],
  [
    "the tapestry",
    collectionTapestry(
      [decade(1900), decade(1910, { garments: 0, colors: {}, materials: {} }), decade(1920, { colors: { red: 1, multi: 1 }, materials: { brocade: 1 } })],
      "shaft",
    ),
  ],
];

describe("toWif", () => {
  it("writes the sections in order with CRLF line endings", () => {
    const text = toWif(drafts[0][1], META);
    const headers = [...text.matchAll(/^\[(.+)\]\r$/gm)].map((m) => m[1]);
    expect(headers).toEqual([
      "WIF",
      "CONTENTS",
      "TEXT",
      "WEAVING",
      "WARP",
      "WEFT",
      "COLOR PALETTE",
      "COLOR TABLE",
      "THREADING",
      "LIFTPLAN",
      "WARP COLORS",
      "WEFT COLORS",
    ]);
    expect(/[^\r]\n/.test(text)).toBe(false);
    expect(parseWif(text).get("WIF")!.get("Version")).toBe("1.1");
  });

  it.each(drafts)("keeps counts consistent and shafts within range for %s", (_label, draft) => {
    const { sections } = rebuild(toWif(draft, META));
    const shafts = Number(sections.get("WEAVING")!.get("Shafts"));
    expect(shafts).toBe(draft.shafts);
    expect(shafts).toBeLessThanOrEqual(8);
    expect(sections.get("THREADING")!.size).toBe(draft.ends);
    expect(sections.get("LIFTPLAN")!.size).toBe(draft.picks);
    expect(Number(sections.get("COLOR PALETTE")!.get("Entries"))).toBe(draft.palette.length);
    for (const v of sections.get("LIFTPLAN")!.values()) {
      for (const shaft of v.split(",").filter(Boolean)) expect(Number(shaft)).toBeLessThanOrEqual(shafts);
    }
  });

  it.each(drafts)("round-trips %s exactly", (_label, draft) => {
    const back = rebuild(toWif(draft, META));
    expect(back.ends).toBe(draft.ends);
    expect(back.picks).toBe(draft.picks);
    expect(back.lifted).toEqual(draft.lifted);
    expect(back.warpColor).toEqual(draft.warpColor);
    expect(back.weftColor).toEqual(draft.weftColor);
    expect(back.rgb).toEqual(draft.palette.map((p) => p.rgb));
  });

  it("refuses a Jacquard draft", () => {
    expect(() => toWif(decadeSwatch(decade(1910), "jacquard", { ends: 220 }), META)).toThrow();
  });
});
