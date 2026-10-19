# Weave It for Real: Loom Draft Export Design
**Date:** 2026-10-19
**Status:** Draft, awaiting review

## Overview

Let visitors download the woven timeline as **loom-ready drafts**, so the collection's data can become a physical textile:

- **"Weave this decade"**: a swatch of the selected decade's cloth.
- **"Weave the whole collection"**: one long tapestry, 1770s to 2020s, with each decade a band along its length. It is the exhibition piece.

Each comes in two loom profiles:
- a **WIF** draft for shaft looms and weaving software, in which everything fits an **8-shaft** loom;
- a **lift-plan image** (1-bit TIFF, plus a PNG preview) for a digital Jacquard such as the TC2, where any pattern is possible.

Plain-text **weaving notes** carry the colour changes and setup a weaver needs.

### Background facts the design relies on

- On a real loom the **warp is fixed** once threaded, so colour that changes along the cloth must be carried by the **weft**. The swatch can use coloured warp bands, as on screen. The tapestry cannot: it uses one undyed warp and weft-coloured bands.
- **WIF** (Weaving Information File, version 1.1) is an INI-style text format read by weaving software. A draft is described by `[THREADING]`, plus either `[TIEUP]` with `[TREADLING]` or, equivalently, a `[LIFTPLAN]` naming the shafts raised on each pick. Colours come from a `[COLOR TABLE]` and are assigned per thread by `[WARP COLORS]` / `[WEFT COLORS]`. (Sources: open-source WIF readers and writers such as Unicon's `wifisd.icn`, the Icon Analyst WIF article and pyweaving.)
- The **TC2** digital Jacquard has 220 heddles per module at 15 ends per inch per module, on cloth about 14.5" wide. Designs are typically prepared as TIFF images, one pixel per end per pick. No formal file spec was found, so the TIFF is a plain uncompressed bilevel image, and the open items include a check with a TC2 user.

### Constraints

- Generated entirely in the browser, with **no new dependencies** and no server route.
- Drafts derive from the same `data/collection-weave.json` and weave model (`lib/weave.ts`) as the on-screen cloth.
- A sample-data build (`source: "ci-fixture"`) is labelled as such in every file's notes and in the panel.

### Success criteria

- Downloaded `.wif` files are valid WIF 1.1 with internally consistent counts. A round-trip parse of our own output reproduces the draft exactly.
- Every WIF draft uses at most 8 shafts.
- The TIFF is a valid baseline bilevel TIFF of exactly `ends × picks` pixels, black where a warp end is lifted.
- The weaving notes list every weft colour change with pick numbers that match the files.

---

## 1. Draft model (`lib/weaveDraft.ts`)

```ts
type LoomProfile = "shaft" | "jacquard";

interface Draft {
  ends: number;            // warp threads
  picks: number;           // weft rows; pick 1 is woven first
  lifted: Uint8Array;      // ends × picks, row-major by pick: 1 = warp end raised (shows on the face)
  warpColor: Uint8Array;   // per end: index into palette
  weftColor: Uint8Array;   // per pick: index into palette
  palette: { code: string; rgb: [number, number, number] }[];
  shafts: number;          // for the shaft profile: shafts used by the straight draw; for jacquard: 0
  bands: { decade: number; firstPick: number; lastPick: number }[]; // tapestry only (empty for swatches)
}
```

### Weave structures, per profile

The draft lifts warp end `x` on pick `y` (both 0-based) according to the structure. "Warp-faced" means mostly lifted (warp shows); "weft-faced" means mostly down (weft shows). `mod` is the non-negative modulo.

| Screen structure | Shaft profile (≤ 8 shafts) | Jacquard profile |
|---|---|---|
| `plain` | plain: `mod(x + y, 2) === 0` | same |
| `twill` | 2/2 twill: `mod(x + y, 4) < 2` | same |
| `satin` | 8-end satin, counter 3: warp-faced `mod(3x + y, 8) !== 0` | 5-end satin as on screen: `mod(3x + y, 5) !== 0` |
| `figured` | 2/2 broken twill, the diagonal reversing every 4 ends: `mod(d + y, 4) < 2`, where `d = mod(x, 8) < 4 ? mod(x, 4) : 5 - mod(x, 4)` | the on-screen diamond: twill inverted inside `abs(mod(x,16) − 8) + abs(mod(y,16) − 8) < 6` |
| `gauze` | plain (open gaps can't be woven) | plain |
| `knit` | plain (knits aren't woven) | plain |

**Weft-faced variants** (tapestry only, so the weft colour shows):
- plain stays plain;
- twill becomes 1/3 twill, `mod(x + y, 4) === 0`;
- satin becomes weft-faced satin, `mod(3x + y, 8) === 0` (shaft) or `mod(3x + y, 5) === 0` (Jacquard);
- figured becomes a weft-faced broken twill, `mod(d + y, 4) === 0` (shaft), or the Jacquard diamond with a 1/3 twill ground and the 2/2 twill inverted inside the motif.

**Shaft count:** the shaft profile uses a straight draw, end `x` on shaft `mod(x, R) + 1`, where `R` is the largest structure repeat in the draft (2, 4 or 8). Every structure above repeats in 8 ends or fewer, so `shafts ≤ 8` always.

### Builders

- **`decadeSwatch(decade, profile, { ends, picks })`**
  - Warp colours: the on-screen bands (`warpRepeat(colorShares(decade))`), tiled across `ends`.
  - Weft colour: `weftFor` of the leading colour.
  - Structure: `weaveStructure(decade.materials)`, mapped by the profile table, warp-faced.
  - Defaults: shaft profile 240 ends × 240 picks; Jacquard `220 × modules` ends × the same number of picks.
- **`collectionTapestry(decades, profile, { ends })`**
  - Warp: all ends undyed (`#e8e0cf`, ecru).
  - Bands: decades run along the length, **oldest woven first** (pick 1), each as:
    - a **4-pick separator** in undyed weft, plain weave;
    - then, if the decade has garments, a **40-pick band**. Its weft stripes come from `warpRepeat(colorShares(decade), 40)`, so the stripes are contiguous and in share order, with counts summing exactly to 40. The band is woven in the decade's structure, weft-faced. An empty decade is only its separator, so the timescale stays continuous.
  - A final 4-pick separator closes the piece.
  - `bands` records each decade's first and last pick, for the notes.
  - Default ends: shaft profile 240; Jacquard `220 × modules`.
- **Unknown colour codes** use the neutral `#8a8278`, as on screen.

---

## 2. Writers

### WIF (`lib/wif.ts`): `toWif(draft, meta): string`

Lines end with CRLF. The sections, in order:

```
[WIF]
Version=1.1
Date=<YYYY-MM-DD>
Developers=uvahcc.org
Source Program=UVA Historic Clothing Collection woven timeline
Source Version=1

[CONTENTS]
WEAVING=true
WARP=true
WEFT=true
COLOR PALETTE=true
COLOR TABLE=true
THREADING=true
LIFTPLAN=true
WARP COLORS=true
WEFT COLORS=true
TEXT=true

[TEXT]
Title=<title>
Notes=<one line: data source and generated date>

[WEAVING]
Shafts=<draft.shafts>
Treadles=0
Rising Shed=true

[WARP]
Threads=<ends>
Color=<palette index of the most common warp colour, 1-based>

[WEFT]
Threads=<picks>
Color=<palette index of the most common weft colour, 1-based>

[COLOR PALETTE]
Entries=<palette length>
Range=0,255

[COLOR TABLE]
1=<r>,<g>,<b>
...

[THREADING]
1=<shaft>
...                      (one line per end)

[LIFTPLAN]
1=<comma-separated shafts raised on pick 1, or empty line value if none>
...                      (one line per pick)

[WARP COLORS]
<end>=<palette index>    (only for ends whose colour differs from [WARP] Color)

[WEFT COLORS]
<pick>=<palette index>   (only for picks whose colour differs from [WEFT] Color)
```

- A pick's raised shafts are the shafts whose straight-draw ends are lifted on that pick. With a straight draw and every structure repeating in `R` ends, all ends on one shaft lift identically, so the liftplan reproduces the draft exactly.
- `toWif` only accepts shaft-profile drafts and throws otherwise.

### Lift-plan TIFF (`lib/tiff.ts`): `toBilevelTiff(draft): Uint8Array`

- A baseline TIFF, little-endian (`II*\0`), with one IFD and one uncompressed strip.
- Tags: ImageWidth = ends, ImageLength = picks, BitsPerSample = 1, Compression = 1, PhotometricInterpretation = 0 (WhiteIsZero, so a 1 bit is black), StripOffsets, SamplesPerPixel = 1, RowsPerStrip = picks, StripByteCounts, XResolution = YResolution = 72/1, ResolutionUnit = 2.
- Rows are packed MSB-first and padded to whole bytes.
- **Orientation:** pick 1 is the **bottom** row of the image, so the image looks like the finished cloth with its first-woven end at the bottom. The notes say so explicitly.

### PNG preview

The same pixels, drawn to an offscreen canvas and saved with `canvas.toBlob("image/png")`. It is a convenience for viewing, not for the loom.

### Weaving notes (`lib/weavingNotes.ts`): `weavingNotes(draft, meta): string`

Plain text containing:
- title, data source (with the sample-data warning when `source` is `"ci-fixture"`), and generated date;
- dimensions: ends × picks; shafts (WIF), or modules and ends per inch on a 14.5" TC2 (`15 × modules` EPI) for Jacquard;
- the warp colour plan: band runs for a swatch, or "all ends undyed (ecru)" for the tapestry;
- the **weft sequence**: every run of same-coloured picks as `picks 1–4: undyed (ecru), 1770s separator`, `picks 5–44: white`, and so on, with decade labels from `bands`;
- the orientation line, "pick 1 is the bottom row of the lift-plan image";
- the structure mapping used, for example "satin decades woven as 8-shaft satin".

---

## 3. Interface

- **`components/timeline/WeaveExport.tsx`**: a client component. Props: `{ mode: "decade"; decade: DecadeWeave } | { mode: "collection"; decades: DecadeWeave[] }`, plus `source`.
  - It renders a disclosure button ("Weave this decade" / "Weave the whole collection") that opens a small panel with:
    - a **Jacquard width** select: 1–12 TC2 modules (220–2640 ends), default **6** (1320 ends, 90 EPI);
    - four download buttons: **WIF (shaft loom)**, **TIFF (Jacquard)**, **PNG preview** and **Weaving notes**;
    - a one-line explanation of each and, for sample data, the "Preview data" note.
  - Files are built **when a button is pressed**, not on render. A Blob URL is created, clicked and revoked.
  - File names: `uvahcc-weave-<1910s|collection>-<shaft|jacquard-6mod>.<wif|tif|png|txt>`.
- **Placement:** "Weave this decade" in the side panel under the structure label; "Weave the whole collection" under the decade slider.

---

## 4. Error handling

- A draft larger than the safety cap of 4 million cells (`ends × picks`) is refused with a visible message. The maximum real case is 2640 ends × about 1,150 picks, roughly 3 million.
- Generation failures (for example canvas `toBlob` returning null) show "Couldn't create the file. Try again." in the panel and never throw to the page.
- A decade with no colours weaves undyed, as on screen.

---

## 5. Testing (Vitest, node)

- **`lib/weaveDraft.test.ts`:**
  - each shaft-profile structure repeats within 8 ends and the draft's `shafts ≤ 8`;
  - warp-faced and weft-faced satin are exact complements;
  - the Jacquard satin and diamond match `warpOver` on screen;
  - swatch warp colours follow the bands;
  - the tapestry's separators and bands sit at the documented picks, with stripe counts summing to 40, an empty decade being only its separator, and an all-undyed warp;
  - `ends × picks` matches `lifted.length`.
- **`lib/wif.test.ts`:**
  - the sections are present, in order;
  - the CONTENTS flags match;
  - Threads and Entries counts are consistent;
  - every LIFTPLAN shaft is ≤ `Shafts`;
  - a **round trip**: a small test-only parser reads the WIF back and rebuilds `lifted`, `warpColor` and `weftColor` identically;
  - `toWif` throws for a Jacquard draft.
- **`lib/tiff.test.ts`:** the header bytes, IFD entry values, strip length `ceil(ends/8) × picks`, MSB-first bit packing on a known 10×3 pattern, and pick 1 landing on the bottom row.
- **`lib/weavingNotes.test.ts`:** the weft runs cover every pick exactly once; the decade labels; the sample-data warning appears only for `"ci-fixture"`; the TC2 EPI line.
- **Manual:** download all four files for a decade and for the collection. Open the `.wif` in a free WIF viewer (or re-import it with pyweaving) and check the TIFF in an image viewer.

---

## Files

| File | Change |
|---|---|
| `lib/weaveDraft.ts` + test | New: draft model, profile structures, swatch and tapestry builders |
| `lib/wif.ts` + test | New: WIF 1.1 writer |
| `lib/tiff.ts` + test | New: 1-bit TIFF encoder |
| `lib/weavingNotes.ts` + test | New |
| `components/timeline/WeaveExport.tsx` | New: export panel and downloads |
| `components/timeline/CollectionWeaveView.tsx` | Place the two export buttons |

## Open items

- **TC2 conventions to confirm with an actual TC2 user or Digital Weaving Norway:** whether the image's bottom row is woven first, whether black should mean lifted, and whether the software prefers a specific resolution or file type. The orientation and polarity are stated in the notes, so a weaver can flip or invert the image if the convention differs.
- **Real data:** the drafts follow whatever `collection-weave.json` holds. They become the real collection once the desktop export runs.
