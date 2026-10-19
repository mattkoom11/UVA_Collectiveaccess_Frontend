import { decadeLabel } from "./weave";
import { SEPARATOR_PICKS, TC2_ENDS_PER_MODULE, type Draft, type LoomProfile } from "./weaveDraft";
import { sourceLine, type DraftMeta } from "./wif";

// Plain-text notes a weaver works from: setup, warp, and the weft colour
// sequence (a Jacquard lifts the warp, but the weaver still throws each
// colour), with decade labels so they can find their place in the tapestry.

const TC2_EPI_PER_MODULE = 15;
const TC2_WIDTH_INCHES = 14.5;

// The shortest run of ends the warp repeats, so the notes can give the
// stripe order a weaver threads, not just colour totals.
function warpPeriod(warp: Uint8Array): number {
  for (let p = 1; p < warp.length; p++) {
    let repeats = true;
    for (let x = p; x < warp.length && repeats; x++) repeats = warp[x] === warp[x % p];
    if (repeats) return p;
  }
  return warp.length;
}

function warpLines(draft: Draft): string[] {
  const warp = draft.warpColor;
  if (warp.every((c) => c === warp[0])) return [`Warp: all ${draft.ends} ends ${draft.palette[warp[0]].code}.`];
  const period = warpPeriod(warp);
  const runs: string[] = [];
  let start = 0;
  for (let x = 1; x <= period; x++) {
    if (x < period && warp[x] === warp[start]) continue;
    runs.push(`${x - start} ${draft.palette[warp[start]].code}`);
    start = x;
  }
  const times = Math.floor(draft.ends / period);
  const rest = draft.ends % period;
  return [
    `Warp: repeat these ${period} ends ${times} ${times === 1 ? "time" : "times"}: ${runs.join(", ")}${
      rest ? `, then the first ${rest} ends once more` : ""
    }.`,
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
    ...(draft.bands.length > 0
      ? [
          "Tapestry: sett the warp open and beat firmly so the weft covers it. The colour bands are weft-faced; plain-weave decades show the ecru warp unless packed this way.",
        ]
      : []),
    "",
    ...warpLines(draft),
    "",
    "Weft sequence:",
    ...weftLines(draft),
    "",
  ].join("\n");
}
