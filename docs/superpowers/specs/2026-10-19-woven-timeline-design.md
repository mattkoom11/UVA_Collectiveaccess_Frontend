# Woven Collection Timeline Design
**Date:** 2026-10-19
**Status:** Draft, awaiting review

## Overview

Replace the `/timeline` page's lead with a **woven collection timeline**: a generative piece of cloth that shows what the Historic Clothing Collection looks like in any decade, re-woven as the visitor scrubs through time. A decade's colour mix sets the warp threads, its dominant material family sets the weave structure, and its number of garments sets the thread density. Scanned garments from the selected decade can be opened in 3D.

This merges two ideas from the 2026-10-19 frontend brainstorm: **#5 timeline scrubber** and **#12 collection fingerprint**. Photo search (#1) and the cloth-physics runway (#10) are separate.

### Why it needs a new data export

The site serves 9 garments from `data/garments.json`, all marked with the placeholder era `1980+` and empty `colors` and `materials`. The real dates and attributes for about 1,200 photographed garments live in the private `hfa-ml` repo, in the donor-free search index it already deploys behind search.uvahcc.org. No public photo host exists yet, so the design uses no photos.

### Constraints

- Free and open-source tooling only; no new frontend dependencies.
- **Only aggregated per-decade totals reach the public frontend repo.** No per-garment records, titles or descriptions.
- The export reads only hfa-ml's donor-free search index and clean catalog table, and asserts against hfa-ml's existing personal-data column guard.
- Respect `prefers-reduced-motion: reduce`.
- The page works, minus the weave, when the export file is missing.

### Success criteria

- `/timeline` shows a woven cloth for any decade in the collection's range; scrubbing re-weaves it.
- The cloth's colours, structure and density visibly differ between decades whose data differ.
- Every visual fact has a text equivalent (the summary panel and the scrubber's spoken value).
- Scanned garments whose catalog dates overlap the selected decade appear as cards that open the 3D viewer.

---

## 1. Export (`hfa-ml`)

### Input
- `data/exports/search_index/garments.csv`: one row per photographed garment, with `accession, ca_type, date_earliest, date_latest, material, color, technique` among its columns. `material`, `color` and `technique` hold semicolon-separated codes from `hfa/vocab.json` (27 materials, 25 colours, 14 techniques) or are blank.
- `data/processed/garments.parquet`: the clean catalog table, used only to look up dates for scanned accessions.
- The frontend's `data/garments.json`, used only to list the accessions that have a `model3d_url`.

### Decade spreading
A garment dated `earliest`–`latest` (inclusive years) contributes weight 1 in total, split across decades by **year overlap**: the decade `d` (years `d`..`d+9`) gets `overlap_years / (latest − earliest + 1)`. Examples:
- 1890–1920 (31 years): 1890s and 1900s and 1910s get 10/31 each, 1920s gets 1/31.
- 1910–1919: the 1910s get 1.
- A single year (1925–1925): the 1920s get 1.

Rows are classified as:
- **dated**: both bounds present and `latest − earliest < 99`;
- **century_only**: span of 99 years or more (the same threshold `hfa.dates` uses for `century_whole`); excluded from decades;
- **undated**: either bound blank or unparseable; excluded from decades.

Within a decade, a garment's weight `w` is split evenly over its own colour codes (`w / k` each for `k` codes), and likewise for materials and techniques. Garments with no codes in a list add to the decade's `garments` total but to none of that list's codes.

### Output: `data/collection-weave.json`
```json
{
  "generated": "2026-10-19",
  "source": "search-index",
  "rows": 1202,
  "dated": 1104,
  "century_only": 61,
  "undated": 37,
  "decades": [
    {
      "decade": 1890,
      "garments": 23.452,
      "colors": { "black": 6.1, "white": 4.25 },
      "materials": { "silk": 8.0, "cotton": 3.5 },
      "techniques": { "embroidery": 2.0 }
    }
  ],
  "scanned": { "DR.2023.17": { "earliest": 1910, "latest": 1920 } }
}
```
- `source` is `"search-index"` for the real export and `"ci-fixture"` when built from the 481-row donor-free CI fixture (`tests/fixtures/search/garments.csv`).
- `decades` is sorted ascending and **contiguous** from the first to the last decade with any weight; empty decades in between appear with `garments: 0` and empty maps.
- Weights are rounded to 3 decimals. Codes with zero weight are omitted.
- `scanned` lists only scanned accessions found in the catalog with a dated (non-century-only) range. Scanned accessions without one are omitted.

### Command
`.venv/bin/python -m hfa.export_weave [--source fixture] [--frontend ../UVA_Collectiveaccess_Frontend]`, following `hfa.export_related`. It writes `data/exports/collection-weave.json` and, with `--frontend`, copies it to the frontend's `data/` and reads that repo's `data/garments.json` for scanned accessions. Before writing, it asserts that no forbidden column was read and that every code is in `hfa/vocab.json`; unknown codes are dropped and counted in a printed warning.

---

## 2. Weave model (`lib/weave.ts`, frontend)

Pure functions over one decade entry; no DOM.

- **`colorShares(decade)`**: colour codes with their share of the decade's total colour weight, descending; ties broken alphabetically.
- **`warpRepeat(shares, repeatWidth = 24)`**: a list of `repeatWidth` colour codes for one pattern repeat, with counts from the **largest-remainder method** (so the counts sum exactly to `repeatWidth`), laid out in contiguous bands in share order. Colours whose share rounds to zero threads are dropped. With no colours, it returns `repeatWidth` copies of `"undyed"`.
- **`weaveStructure(materials)`**: the material family with the largest summed weight:

  | Family | Materials | Drawn as |
  |---|---|---|
  | `satin` | satin, silk, rayon, acetate, velvet | 5-harness warp-faced satin |
  | `twill` | wool, cashmere | 2/2 twill diagonals |
  | `plain` | cotton, linen, hemp, taffeta, crepe, nylon, polyester | plain over-under grid |
  | `gauze` | lace, chiffon, georgette | plain weave with open gaps |
  | `knit` | spandex, elastic, angora, acrylic | rows of V stitches |
  | `figured` | brocade, damask | twill ground with a woven diamond motif |

  felt, leather, glass and metal are non-woven and do not vote. Ties and decades with no voting material fall back to `plain`.
- **`warpOver(structure, x, y)`**: whether the warp thread shows at cell (x, y): plain `(x + y) % 2 === 0`; twill `(x + y) % 4 < 2`; satin `(3 * x + y) % 5 !== 0`; gauze as plain; figured as twill, inverted inside a diamond motif `|x mod 16 − 8| + |y mod 16 − 8| < 6`. Knit is drawn by its own routine, not this predicate.
- **`threadDensity(garments, maxGarments)`**: threads across the cloth's width, `24 + 72 · ln(1 + garments) / ln(1 + maxGarments)`, rounded; 24 for empty decades.
- **`colorHex(code)`**: a fixed palette for the 25 vocabulary colours, plus `"multi"` drawn as a thread that alternates `#b5523b` and `#3c6e8f` every cell, and `"undyed"` / unknown codes as `#8a8278`.
- **`decadeLabel(decade)`**: `"1910s"`.
- **`decadeSummary(decade)`**: e.g. `"1910s · 63 garments · black 31%, white 24%, cream 12% · mostly silk, cotton"`. It rounds garments to whole numbers, lists up to 3 colours and 2 materials, and reads `"No catalogued garments from the 1830s"` for an empty decade.
- **`defaultDecadeIndex(decades)`**: the decade with the most garments.

---

## 3. Page (`/timeline`)

### Layout
1. Heading "The collection, woven" with one line of explanation ("Each decade's colours, fabrics and number of garments, woven into cloth.").
2. **`WovenCloth`** (canvas, full content width, 3:1 on desktop, 4:3 on mobile).
3. **`DecadeScrubber`** directly under it.
4. **Summary panel**: `decadeSummary`, plus top colours as small swatches with percentages and the dominant weave structure named ("woven as satin").
5. **Scanned pieces from this decade** (only when any): a card per garment with its label, catalog date range and a "Turn it in 3D" button that reveals the existing `Garment3DViewer` under the cards.
6. The previous `TimelineView`, under a new heading "Garments on the site".

When `source` is `"ci-fixture"`, a small note under the heading reads "Preview data from a sample of the collection."

### Components
- **`components/timeline/WovenCloth.tsx`**: props `{ decade: DecadeWeave; maxGarments: number }`. It draws on a `<canvas>` sized with `devicePixelRatio` and a `ResizeObserver`. Each cell is a short thread segment with a slight highlight, so the cloth reads as threads, not pixels. Weft colour is the warp's leading colour darkened 35%. When `decade` changes it **re-weaves**: new rows are drawn top to bottom over 600 ms, like a loom; under reduced motion it redraws at once. It has `role="img"` and `aria-label={decadeSummary(decade)}`.
- **`components/timeline/DecadeScrubber.tsx`**: props `{ decades, index, onChange }`. A native `<input type="range">` over decade indices, with `aria-valuetext` like "1910s, 63 garments", a row of small bars showing each decade's garment count above it, and tick labels every 50 years. Native keyboard support (arrows, Home, End, PageUp, PageDown) comes with the input.
- **`components/timeline/CollectionWeaveView.tsx`**: client component. Props `{ weave: CollectionWeave | null; garments: Garment[] }`. It holds the selected index, renders the parts above, matches `weave.scanned` against `garments` by `accessionNumber`, and lazy-loads `Garment3DViewer` with `next/dynamic` (`ssr: false`).
- **`types/collectionWeave.ts`**: `CollectionWeave` and `DecadeWeave` types matching the JSON above.
- **`lib/collectionWeave.ts`**: `loadCollectionWeave(raw: unknown): CollectionWeave | null`, a small validator that returns null for a missing or malformed file instead of throwing.
- **`app/timeline/page.tsx`**: imports `data/collection-weave.json`, validates it, and renders `CollectionWeaveView` above the existing `TimelineView`.

### Scanned overlap rule
A scanned garment appears for decade `d` when its `[earliest, latest]` overlaps `[d, d + 9]`.

---

## 4. Error handling

- **Export file missing or malformed:** `loadCollectionWeave` returns null; the page renders only the "Garments on the site" list, with no error shown to visitors.
- **Empty decade:** bare undyed loom threads at minimum density, and the summary "No catalogued garments from the 1830s".
- **Unknown colour or material code** in the JSON: neutral thread colour; it does not vote on structure.
- **Scanned accession not on the site** (no matching `accessionNumber`): no card.
- **Canvas unavailable:** the summary panel still carries the content.

---

## 5. Testing

**hfa-ml (pytest), `tests/test_export_weave.py`:**
- Year-overlap spreading for the three worked examples above; weights per garment sum to 1.
- Century-only and undated rows are counted and excluded from decades.
- Colour, material and technique weights split evenly over a garment's codes.
- Decades are contiguous, with zero-weight gaps included.
- Unknown codes are dropped and counted.
- A table carrying a forbidden column fails the assert.
- End to end on the CI fixture: totals `dated + century_only + undated == rows`, and the sum of decade `garments` equals `dated` (within rounding).

**Frontend (Vitest):**
- `lib/weave.test.ts`: `warpRepeat` counts sum to the repeat width and keep share order; `weaveStructure` for each family, ties and non-voting materials; `warpOver` patterns; `threadDensity` bounds; `colorHex` fallbacks; `decadeSummary` wording, including the empty decade; `defaultDecadeIndex`.
- `lib/collectionWeave.test.ts`: valid, missing and malformed input.
- A scanned-overlap helper test for decades on either edge of a range.

**Manual:** scrub across the full range; the cloth's colour, structure and density change; keyboard scrubbing; reduced motion; the mobile layout; a "Turn it in 3D" card when a scanned garment's decade is selected.

---

## Files

| Repo | File | Change |
|---|---|---|
| hfa-ml | `hfa/export_weave.py` | New |
| hfa-ml | `tests/test_export_weave.py` | New |
| hfa-ml | `README.md` | Add the export to the pipeline table |
| frontend | `data/collection-weave.json` | New, generated (fixture build first, real build from the desktop) |
| frontend | `types/collectionWeave.ts` | New |
| frontend | `lib/weave.ts` + test | New |
| frontend | `lib/collectionWeave.ts` + test | New |
| frontend | `components/timeline/WovenCloth.tsx`, `DecadeScrubber.tsx`, `CollectionWeaveView.tsx` | New |
| frontend | `app/timeline/page.tsx` | Render the woven view above the existing list |

## Open items

- **Real export run:** the clean catalog and search index live on the desktop (hfa-ml's `data/` is git-ignored). This work ships with the fixture build; the real `collection-weave.json` is generated on the desktop with `--frontend` and committed.
- **Scanned pieces' dates:** unknown until that run. If the 4 scanned accessions aren't in the clean catalog with dates, the cards don't appear and nothing else changes.
- **Archive sign-off** that per-decade colour and material totals may be public, expected to be uncontroversial since per-garment related-item lists already are.
