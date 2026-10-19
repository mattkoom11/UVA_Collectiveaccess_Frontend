import type { Draft } from "./weaveDraft";

// WIF 1.1 (Weaving Information File), the INI-style format weaving software
// reads. Drafts use a straight draw and a rising-shed liftplan, which
// describes any shaft weave without a tie-up. Colour indices are 1-based.

export interface DraftMeta {
  title: string;
  source: "search-index" | "ci-fixture";
  dataDate: string; // when the collection data was exported
  generated: string; // when this file was made, YYYY-MM-DD
}

function mostCommon(values: Uint8Array): number {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = values[0] ?? 0;
  for (const [v, c] of counts) if (c > (counts.get(best) ?? 0)) best = v;
  return best;
}

export function sourceLine(meta: DraftMeta): string {
  return meta.source === "ci-fixture"
    ? `Built from a sample of the UVA Historic Clothing Collection (data ${meta.dataDate}), not the full catalog.`
    : `Built from the UVA Historic Clothing Collection catalog (data ${meta.dataDate}).`;
}

export function toWif(draft: Draft, meta: DraftMeta): string {
  if (draft.shafts <= 0) throw new Error("toWif needs a shaft-profile draft");
  if (draft.ends < draft.shafts) throw new RangeError("A WIF draft needs at least one end per shaft");

  const lines: string[] = [];
  const section = (name: string, entries: [string | number, string | number][]) => {
    lines.push(`[${name}]`);
    for (const [k, v] of entries) lines.push(`${k}=${v}`);
    lines.push("");
  };

  const warpMain = mostCommon(draft.warpColor);
  const weftMain = mostCommon(draft.weftColor);

  section("WIF", [
    ["Version", "1.1"],
    ["Date", meta.generated],
    ["Developers", "uvahcc.org"],
    ["Source Program", "UVA Historic Clothing Collection woven timeline"],
    ["Source Version", "1"],
  ]);
  section("CONTENTS", [
    ["WEAVING", "true"],
    ["WARP", "true"],
    ["WEFT", "true"],
    ["COLOR PALETTE", "true"],
    ["COLOR TABLE", "true"],
    ["THREADING", "true"],
    ["LIFTPLAN", "true"],
    ["WARP COLORS", "true"],
    ["WEFT COLORS", "true"],
    ["TEXT", "true"],
  ]);
  section("TEXT", [
    ["Title", meta.title],
    ["Notes", sourceLine(meta)],
  ]);
  section("WEAVING", [
    ["Shafts", draft.shafts],
    ["Treadles", 0],
    ["Rising Shed", "true"],
  ]);
  section("WARP", [
    ["Threads", draft.ends],
    ["Color", warpMain + 1],
  ]);
  section("WEFT", [
    ["Threads", draft.picks],
    ["Color", weftMain + 1],
  ]);
  section("COLOR PALETTE", [
    ["Entries", draft.palette.length],
    ["Range", "0,255"],
  ]);
  section(
    "COLOR TABLE",
    draft.palette.map((p, i) => [i + 1, p.rgb.join(",")]),
  );
  section(
    "THREADING",
    Array.from({ length: draft.ends }, (_, x) => [x + 1, (x % draft.shafts) + 1]),
  );
  // With a straight draw, end s-1 sits on shaft s, and every end on a shaft
  // lifts the same way, so reading the first `shafts` ends gives each pick's
  // raised shafts exactly.
  section(
    "LIFTPLAN",
    Array.from({ length: draft.picks }, (_, y) => {
      const raised: number[] = [];
      for (let s = 0; s < draft.shafts; s++) if (draft.lifted[y * draft.ends + s]) raised.push(s + 1);
      return [y + 1, raised.join(",")];
    }),
  );
  section(
    "WARP COLORS",
    [...draft.warpColor].flatMap((c, x) => (c === warpMain ? [] : [[x + 1, c + 1] as [number, number]])),
  );
  section(
    "WEFT COLORS",
    [...draft.weftColor].flatMap((c, y) => (c === weftMain ? [] : [[y + 1, c + 1] as [number, number]])),
  );

  return lines.join("\r\n");
}
