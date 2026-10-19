import { decadeLabel } from "./weave";
import { SEPARATOR_PICKS, TC2_ENDS_PER_MODULE, type Draft, type LoomProfile } from "./weaveDraft";
import { sourceLine, type DraftMeta } from "./wif";

// Plain-text notes a weaver works from: setup, warp, and the weft colour
// sequence (a Jacquard lifts the warp, but the weaver still throws each
// colour), with decade labels so they can find their place in the tapestry.

const TC2_EPI_PER_MODULE = 15;
const TC2_WIDTH_INCHES = 14.5;

function warpLines(draft: Draft): string[] {
  const counts = new Map<number, number>();
  for (const c of draft.warpColor) counts.set(c, (counts.get(c) ?? 0) + 1);
  if (counts.size === 1) return [`Warp: all ${draft.ends} ends ${draft.palette[draft.warpColor[0]].code}.`];
  return [
    "Warp, in repeating colour bands:",
    ...[...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => `  ${draft.palette[c].code}: ${n} ends`),
  ];
}

function weftLines(draft: Draft): string[] {
  const bandOf = (pick: number) => draft.bands.findIndex((b) => pick >= b.firstPick && pick <= b.lastPick);
  const labelFor = (pick: number) => {
    const i = bandOf(pick);
    if (i === -1) return draft.bands.length > 0 ? "closing separator" : "";
    const band = draft.bands[i];
    const name = decadeLabel(band.decade);
    if (pick >= band.firstPick + SEPARATOR_PICKS) return name;
    const empty = band.lastPick - band.firstPick + 1 === SEPARATOR_PICKS;
    return `${name} separator${empty ? " (no catalogued garments)" : ""}`;
  };

  const lines: string[] = [];
  let start = 1;
  for (let pick = 1; pick <= draft.picks; pick++) {
    const next = pick + 1;
    const sameRun =
      next <= draft.picks &&
      draft.weftColor[next - 1] === draft.weftColor[pick - 1] &&
      labelFor(next) === labelFor(pick);
    if (sameRun) continue;
    const label = labelFor(pick);
    const colour = draft.palette[draft.weftColor[pick - 1]].code;
    lines.push(`picks ${start}–${pick}: ${colour}${label ? `, ${label}` : ""}`);
    start = next;
  }
  return lines;
}

export function weavingNotes(draft: Draft, meta: DraftMeta, profile: LoomProfile): string {
  const setup =
    profile === "shaft"
      ? [
          `Loom: ${draft.shafts} shafts, straight draw (end n on shaft ((n - 1) mod ${draft.shafts}) + 1), rising-shed liftplan in the .wif.`,
          "Structures for a shaft loom: satin as 8-shaft satin, figured as a 2/2 broken twill; lace, chiffon and knits as plain weave.",
        ]
      : [
          `Loom: digital Jacquard, ${draft.ends / TC2_ENDS_PER_MODULE} TC2 modules, ${
            (draft.ends / TC2_ENDS_PER_MODULE) * TC2_EPI_PER_MODULE
          } ends per inch on ${TC2_WIDTH_INCHES}-inch cloth.`,
          "Lift plan: the .tif, one pixel per end per pick, black = end lifted. Flip or invert it if your software expects otherwise.",
          "Structures match the screen: 5-end satin and the 16-thread diamond; lace, chiffon and knits as plain weave.",
        ];

  return [
    meta.title,
    sourceLine(meta),
    `Generated ${meta.generated} at uvahcc.org.`,
    "",
    `Size: ${draft.ends} ends × ${draft.picks} picks.`,
    ...setup,
    "Orientation: pick 1 is woven first; pick 1 is the bottom row of the lift-plan image.",
    "",
    ...warpLines(draft),
    "",
    "Weft sequence:",
    ...weftLines(draft),
    "",
  ].join("\n");
}
