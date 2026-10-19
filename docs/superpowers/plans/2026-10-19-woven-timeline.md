# Woven Collection Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lead `/timeline` with a generative woven cloth that shows each decade of the Historic Clothing Collection (colours, fabrics and garment counts), re-woven as the visitor scrubs through time.

**Architecture:** A new `hfa.export_weave` module in the private `hfa-ml` repo turns the donor-free search index into per-decade aggregate weights and writes `data/collection-weave.json` into the frontend. In the frontend, pure functions in `lib/weave.ts` turn one decade into a "cloth plan" (thread colours, weave structure, density). A thin canvas painter draws it, and a client view composes the cloth, a native range scrubber, a text summary and 3D cards for scanned pieces. The existing `TimelineView` list stays below.

**Tech Stack:** hfa-ml: Python 3, pandas, pytest (CI deps in `requirements-ci.txt`). Frontend: Next 16, React 19, TypeScript 5.9 strict, Tailwind 4 with `archive-*` tokens, Vitest 4 (node environment), Canvas 2D.

**Spec:** `docs/superpowers/specs/2026-10-19-woven-timeline-design.md` (frontend repo)

## Global Constraints

- Free and open-source tooling only; **no new frontend dependencies**.
- **Only aggregated per-decade totals reach the public frontend repo.** No per-garment records, titles or descriptions.
- The export asserts against hfa-ml's personal-data column guard (`FORBIDDEN` in `hfa/ci_check.py`) before writing. It reads only the search-index CSV (or the CI fixture), plus date columns from `data/processed/garments.parquet` for scanned accessions.
- Decade spreading is by inclusive year overlap: decade `d` gets `overlap_years / (latest − earliest + 1)`.
- `century_only` means a span of 99 years or more (`latest − earliest >= 99`); `undated` means a missing or unparseable bound, or `latest < earliest`.
- Weights are rounded to 3 decimals. Zero-weight codes are omitted. Decades are contiguous.
- `source` is `"search-index"` or `"ci-fixture"`. The fixture build shows "Preview data from a sample of the collection."
- Thread density is `24 + 72 · ln(1 + garments) / ln(1 + maxGarments)`, rounded; 24 when empty.
- The re-weave animation runs 600 ms. Under `prefers-reduced-motion: reduce` the cloth redraws at once.
- Lint runs with `--max-warnings=0`: no `setState` synchronously inside an effect body, no `ref.current` reads during render, and escape apostrophes in JSX text (`&apos;`).
- Vitest runs in the `node` environment and picks up only `**/*.test.ts`.
- Work happens on a branch named `feature/woven-timeline` in **both** repos. Never commit to `main` directly.
- hfa-ml's `data/` is git-ignored and absent on the laptop. Everything here must run from the CI fixture alone.

## Review Focus

1. **A decade with a fraction of a garment** (for example 0.3, from one wide range clipping a decade). Expected: the summary says "1 garment", never "0 garments" next to a woven cloth. Pinned in Task 3 (`garmentCount` and `decadeSummary` tests).
2. **The cloth container measures 0×0** (a hidden tab, or the first layout pass). Expected: nothing is drawn and nothing loops forever on `Infinity` rows; it draws once the size is real. Pinned in Task 3 (`clothPlan` zero-size test).
3. **A decade whose materials are only non-woven** (felt, leather, glass, metal) or that ties between two families. Expected: plain weave, not an arbitrary family. Pinned in Task 3 (`weaveStructure` tests).
4. **A garment with `latest` before `earliest`** (a data-entry slip). Expected: counted as undated and kept out of the decades, with no crash and no negative weight. Pinned in Task 1 (`classify` test).
5. **A corrupt or hand-edited `collection-weave.json`** (a string where a number belongs, an unknown `source`). Expected: the page still renders its garment list and never crashes. Pinned in Task 2 (`loadCollectionWeave` tests).

---

### Task 1: hfa-ml export (`hfa.export_weave`)

**Repo:** `~/Documents/GitHub/hfa-ml`

**Files:**
- Create: `hfa/export_weave.py`
- Test: `tests/test_export_weave.py`
- Modify: `README.md` (pipeline table, before the `| Tests |` row at about line 45)

**Interfaces:**
- Consumes: `FORBIDDEN` from `hfa.ci_check`; `hfa/vocab.json` (`{"lists": {"material"|"color"|"technique": [{"code", "label"}]}}`); `tests/fixtures/search/garments.csv` (columns include `accession, date_earliest, date_latest, material, color, technique`).
- Produces (the JSON contract the frontend consumes in Tasks 2–4):
  ```json
  {"generated": "YYYY-MM-DD", "source": "search-index" | "ci-fixture", "rows": int,
   "dated": int, "century_only": int, "undated": int,
   "decades": [{"decade": int, "garments": float, "colors": {code: float},
                "materials": {code: float}, "techniques": {code: float}}],
   "scanned": {accession: {"earliest": int, "latest": int}}}
  ```
- Python functions: `classify(earliest, latest) -> str`, `decade_weights(earliest: int, latest: int) -> dict[int, float]`, `split_codes(cell, vocab: set[str], unknown: dict[str, int]) -> list[str]`, `build_weave(rows: pd.DataFrame, vocab: dict[str, set[str]], scanned: dict, source: str, today: str) -> tuple[dict, dict[str, int]]`, `scanned_dates(catalog: pd.DataFrame, accessions: list[str]) -> dict`, `frontend_scanned_accessions(frontend: Path) -> list[str]`, `load_vocab() -> dict[str, set[str]]`, constants `FIXTURE_CSV`, `INDEX_CSV`, `CATALOG`, `OUT`.

- [ ] **Step 1: Branch and set up the environment**

```bash
cd ~/Documents/GitHub/hfa-ml
git checkout -b feature/woven-timeline
python3 -m venv .venv
.venv/bin/pip install -q -r requirements-ci.txt
.venv/bin/python -m pytest -q 2>&1 | tail -2
```

Expected: the existing suite passes. If any existing test needs `data/` and fails on the laptop, note which ones; Task 1's own tests must not depend on `data/`.

- [ ] **Step 2: Write the failing tests**

Create `tests/test_export_weave.py`:

```python
import json

import pandas as pd
import pytest

from hfa.export_weave import (
    FIXTURE_CSV,
    build_weave,
    classify,
    decade_weights,
    load_vocab,
    scanned_dates,
    split_codes,
)

VOCAB = {
    "color": {"black", "white", "blue"},
    "material": {"silk", "cotton", "lace"},
    "technique": {"embroidery"},
}
COLUMNS = ["accession", "date_earliest", "date_latest", "material", "color", "technique"]


def rows(*records):
    return pd.DataFrame([dict(zip(COLUMNS, r)) for r in records], columns=COLUMNS, dtype=str)


def test_decade_weights_spread_by_year_overlap():
    w = decade_weights(1890, 1920)
    assert w == pytest.approx({1890: 10 / 31, 1900: 10 / 31, 1910: 10 / 31, 1920: 1 / 31})


def test_decade_weights_inside_one_decade():
    assert decade_weights(1910, 1919) == {1910: 1.0}
    assert decade_weights(1925, 1925) == {1920: 1.0}


@pytest.mark.parametrize("earliest,latest", [(1775, 1824), (1903, 1947), (1999, 2001), (1890, 1988)])
def test_decade_weights_always_sum_to_one(earliest, latest):
    assert sum(decade_weights(earliest, latest).values()) == pytest.approx(1)


@pytest.mark.parametrize(
    "earliest,latest,kind",
    [
        ("1890", "1920", "dated"),
        ("1890", "1988", "dated"),
        ("1800", "1899", "century_only"),
        ("1800", "1900", "century_only"),
        ("", "1920", "undated"),
        ("1890", "", "undated"),
        ("abc", "1900", "undated"),
        ("1950", "1900", "undated"),
        (1910.0, 1920.0, "dated"),
        (float("nan"), 1920.0, "undated"),
    ],
)
def test_classify(earliest, latest, kind):
    assert classify(earliest, latest) == kind


def test_split_codes_keeps_known_codes_and_counts_unknown_ones():
    unknown: dict[str, int] = {}
    assert split_codes("lace; silk;polka", VOCAB["material"], unknown) == ["lace", "silk"]
    assert unknown == {"polka": 1}
    assert split_codes("", VOCAB["material"], unknown) == []
    assert split_codes(None, VOCAB["material"], unknown) == []


def test_build_weave_splits_attributes_and_counts_every_row():
    weave, unknown = build_weave(
        rows(
            ("A.1", "1910", "1919", "silk;cotton", "black", "embroidery"),
            ("A.2", "1910", "1919", "silk", "", ""),
            ("A.3", "1800", "1899", "silk", "black", ""),
            ("A.4", "", "", "silk", "black", ""),
        ),
        VOCAB,
        {},
        "ci-fixture",
        "2026-10-19",
    )
    assert unknown == {}
    assert (weave["rows"], weave["dated"], weave["century_only"], weave["undated"]) == (4, 2, 1, 1)
    assert weave["decades"] == [
        {
            "decade": 1910,
            "garments": 2.0,
            "colors": {"black": 1.0},
            "materials": {"cotton": 0.5, "silk": 1.5},
            "techniques": {"embroidery": 1.0},
        }
    ]
    assert weave["source"] == "ci-fixture"
    assert weave["generated"] == "2026-10-19"
    assert weave["scanned"] == {}


def test_decades_are_contiguous_with_empty_gaps():
    weave, _ = build_weave(
        rows(("A.1", "1900", "1905", "silk", "black", ""), ("A.2", "1930", "1931", "cotton", "white", "")),
        VOCAB,
        {},
        "ci-fixture",
        "2026-10-19",
    )
    assert [d["decade"] for d in weave["decades"]] == [1900, 1910, 1920, 1930]
    assert weave["decades"][1] == {"decade": 1910, "garments": 0.0, "colors": {}, "materials": {}, "techniques": {}}


def test_no_dated_rows_gives_no_decades():
    weave, _ = build_weave(rows(("A.1", "", "", "silk", "black", "")), VOCAB, {}, "ci-fixture", "2026-10-19")
    assert weave["decades"] == []
    assert weave["undated"] == 1


def test_refuses_tables_with_personal_data_columns():
    table = rows(("A.1", "1910", "1919", "silk", "black", "")).assign(email="someone@example.com")
    with pytest.raises(AssertionError, match="personal-data"):
        build_weave(table, VOCAB, {}, "ci-fixture", "2026-10-19")


def test_scanned_dates_keeps_only_dated_catalogued_accessions():
    catalog = pd.DataFrame(
        {
            "accession": ["DR.1", "DR.2", "DR.3"],
            "date_earliest": [1910.0, 1800.0, float("nan")],
            "date_latest": [1920.0, 1899.0, float("nan")],
        }
    ).set_index("accession")
    assert scanned_dates(catalog, ["DR.1", "DR.2", "DR.3", "DR.9"]) == {"DR.1": {"earliest": 1910, "latest": 1920}}


def test_scanned_dates_refuses_personal_data_columns():
    catalog = pd.DataFrame({"accession": ["DR.1"], "date_earliest": [1910.0], "date_latest": [1920.0], "email": ["x"]})
    with pytest.raises(AssertionError, match="personal-data"):
        scanned_dates(catalog.set_index("accession"), ["DR.1"])


def test_end_to_end_on_the_ci_fixture():
    table = pd.read_csv(FIXTURE_CSV, dtype=str, keep_default_na=False)
    weave, _ = build_weave(table, load_vocab(), {}, "ci-fixture", "2026-10-19")
    assert weave["dated"] + weave["century_only"] + weave["undated"] == weave["rows"] == len(table)
    total = sum(d["garments"] for d in weave["decades"])
    assert total == pytest.approx(weave["dated"], abs=0.001 * len(weave["decades"]) + 1e-9)
    decades = [d["decade"] for d in weave["decades"]]
    assert decades == list(range(decades[0], decades[-1] + 10, 10))
    json.dumps(weave)
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `.venv/bin/python -m pytest tests/test_export_weave.py -q`
Expected: collection error, `ModuleNotFoundError: No module named 'hfa.export_weave'`.

- [ ] **Step 4: Write the implementation**

Create `hfa/export_weave.py`:

```python
"""Export per-decade colour, material and technique totals for the frontend's woven timeline.

Only aggregates leave hfa-ml: no per-garment records, titles or descriptions. Each
dated garment adds a total weight of 1, split across the decades its date range
covers by year overlap (1890-1920 gives the 1890s, 1900s and 1910s 10/31 each and
the 1920s 1/31). Within a decade, a garment's weight is split evenly over its own
colour, material and technique codes.

Input:  data/exports/search_index/garments.csv   (or the CI fixture with --source fixture)
        data/processed/garments.parquet           (dates of scanned accessions only)
Output: data/exports/collection-weave.json
Run:    .venv/bin/python -m hfa.export_weave [--source fixture] [--frontend ../UVA_Collectiveaccess_Frontend]
"""

from __future__ import annotations

import argparse
import json
import math
import shutil
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

import pandas as pd

from hfa.ci_check import FORBIDDEN

ROOT = Path(__file__).resolve().parent.parent
INDEX_CSV = ROOT / "data/exports/search_index/garments.csv"
FIXTURE_CSV = ROOT / "tests/fixtures/search/garments.csv"
CATALOG = ROOT / "data/processed/garments.parquet"
OUT = ROOT / "data/exports/collection-weave.json"

# Same threshold hfa.dates uses for "century_whole": too vague for decade labels.
CENTURY_SPAN = 99
LISTS = ("color", "material", "technique")
PLURAL = {"color": "colors", "material": "materials", "technique": "techniques"}


def _assert_no_personal_data(columns) -> None:
    leaked = FORBIDDEN & set(columns)
    assert not leaked, f"refusing to export: personal-data columns {sorted(leaked)}"


def load_vocab() -> dict[str, set[str]]:
    lists = json.loads((ROOT / "hfa/vocab.json").read_text())["lists"]
    return {name: {entry["code"] for entry in entries} for name, entries in lists.items()}


def _year(value) -> int | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(number) else int(number)


def classify(earliest, latest) -> str:
    """'dated', 'century_only' (span of 99+ years) or 'undated' (missing, unparseable or reversed)."""
    e, l = _year(earliest), _year(latest)
    if e is None or l is None or l < e:
        return "undated"
    return "century_only" if l - e >= CENTURY_SPAN else "dated"


def decade_weights(earliest: int, latest: int) -> dict[int, float]:
    """Share of one garment per decade, by inclusive year overlap."""
    span = latest - earliest + 1
    weights = {}
    for decade in range(earliest // 10 * 10, latest // 10 * 10 + 1, 10):
        overlap = min(latest, decade + 9) - max(earliest, decade) + 1
        if overlap > 0:
            weights[decade] = overlap / span
    return weights


def split_codes(cell, vocab: set[str], unknown: dict[str, int]) -> list[str]:
    """Semicolon-separated vocabulary codes; unknown codes are dropped and counted."""
    if cell is None or (isinstance(cell, float) and math.isnan(cell)):
        return []
    kept = []
    for code in (c.strip() for c in str(cell).split(";")):
        if not code:
            continue
        if code in vocab:
            kept.append(code)
        else:
            unknown[code] = unknown.get(code, 0) + 1
    return kept


def build_weave(
    rows: pd.DataFrame,
    vocab: dict[str, set[str]],
    scanned: dict,
    source: str,
    today: str,
) -> tuple[dict, dict[str, int]]:
    _assert_no_personal_data(rows.columns)
    counts = {"dated": 0, "century_only": 0, "undated": 0}
    garments: dict[int, float] = defaultdict(float)
    attrs = {name: defaultdict(lambda: defaultdict(float)) for name in LISTS}
    unknown: dict[str, int] = {}

    for row in rows.to_dict("records"):
        kind = classify(row.get("date_earliest"), row.get("date_latest"))
        counts[kind] += 1
        if kind != "dated":
            continue
        codes = {name: split_codes(row.get(name), vocab[name], unknown) for name in LISTS}
        for decade, weight in decade_weights(_year(row["date_earliest"]), _year(row["date_latest"])).items():
            garments[decade] += weight
            for name, cs in codes.items():
                for code in cs:
                    attrs[name][decade][code] += weight / len(cs)

    decades = []
    if garments:
        for decade in range(min(garments), max(garments) + 10, 10):
            entry = {"decade": decade, "garments": round(garments.get(decade, 0.0), 3)}
            for name in LISTS:
                entry[PLURAL[name]] = {
                    code: round(w, 3) for code, w in sorted(attrs[name][decade].items()) if round(w, 3) > 0
                }
            decades.append(entry)

    weave = {
        "generated": today,
        "source": source,
        "rows": len(rows),
        **counts,
        "decades": decades,
        "scanned": scanned,
    }
    return weave, unknown


def scanned_dates(catalog: pd.DataFrame, accessions: list[str]) -> dict:
    """Date ranges for scanned accessions that are catalogued with a dated (not century-only) range."""
    _assert_no_personal_data(catalog.columns)
    found = {}
    for accession in accessions:
        if accession not in catalog.index:
            continue
        row = catalog.loc[accession]
        if classify(row["date_earliest"], row["date_latest"]) == "dated":
            found[accession] = {"earliest": _year(row["date_earliest"]), "latest": _year(row["date_latest"])}
    return found


def frontend_scanned_accessions(frontend: Path) -> list[str]:
    garments = json.loads((frontend / "data/garments.json").read_text())
    return sorted({g["accessionNumber"] for g in garments if g.get("model3d_url") and g.get("accessionNumber")})


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--source", choices=["index", "fixture"], default="index")
    ap.add_argument(
        "--frontend",
        type=Path,
        help="frontend repo: read its scanned accessions and copy the result into its data/",
    )
    args = ap.parse_args()

    fixture = args.source == "fixture"
    table = pd.read_csv(FIXTURE_CSV if fixture else INDEX_CSV, dtype=str, keep_default_na=False)

    scanned: dict = {}
    if args.frontend:
        accessions = frontend_scanned_accessions(args.frontend)
        if CATALOG.exists():
            scanned = scanned_dates(pd.read_parquet(CATALOG).set_index("accession"), accessions)
        else:
            print(f"note: {CATALOG.relative_to(ROOT)} not found; scanned garments get no dates", file=sys.stderr)

    weave, unknown = build_weave(
        table, load_vocab(), scanned, "ci-fixture" if fixture else "search-index", date.today().isoformat()
    )
    if unknown:
        print(f"warning: dropped unknown codes {dict(sorted(unknown.items()))}", file=sys.stderr)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(weave, indent=1) + "\n")
    print(
        f"{weave['dated']} dated, {weave['century_only']} century-only, {weave['undated']} undated garments "
        f"-> {len(weave['decades'])} decades, {len(scanned)} scanned ({OUT.relative_to(ROOT)})"
    )
    if args.frontend:
        dest = args.frontend / "data/collection-weave.json"
        shutil.copyfile(OUT, dest)
        print(f"copied to {dest}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `.venv/bin/python -m pytest tests/test_export_weave.py -q`
Expected: all pass.

- [ ] **Step 6: Add the README row**

In `README.md`'s pipeline table, insert before the `| Tests | … |` row:

```markdown
| Woven-timeline totals for the frontend | `.venv/bin/python -m hfa.export_weave --frontend ../UVA_Collectiveaccess_Frontend` | `data/exports/collection-weave.json`, copied to the frontend's `data/` (per-decade aggregates only) |
```

- [ ] **Step 7: Run the whole hfa-ml suite and commit**

```bash
.venv/bin/python -m pytest -q 2>&1 | tail -2
git add hfa/export_weave.py tests/test_export_weave.py README.md
git commit -m "feat: export per-decade weave totals for the frontend timeline"
```

Expected: the new tests pass, and every test that passed in Step 1 still passes.

---

### Task 2: Frontend data contract, fixture data and loader

**Repo:** `~/Documents/GitHub/UVA_Collectiveaccess_Frontend`

**Files:**
- Create: `types/collectionWeave.ts`, `lib/collectionWeave.ts`, `data/collection-weave.json` (generated)
- Test: `lib/collectionWeave.test.ts`

**Interfaces:**
- Consumes: the JSON contract from Task 1.
- Produces:
  - Types `WeightMap`, `DecadeWeave`, `ScannedRange`, `CollectionWeave` from `@/types/collectionWeave`
  - `loadCollectionWeave(raw: unknown): CollectionWeave | null` from `@/lib/collectionWeave`
  - `scannedInDecade(scanned: Record<string, ScannedRange>, decade: number): string[]` from `@/lib/collectionWeave` (sorted accessions)

- [ ] **Step 1: Branch, then generate the fixture data file**

```bash
cd ~/Documents/GitHub/UVA_Collectiveaccess_Frontend
git checkout main && git pull --ff-only
git checkout -b feature/woven-timeline
git add docs/superpowers/specs/2026-10-19-woven-timeline-design.md docs/superpowers/plans/2026-10-19-woven-timeline.md
git commit -m "docs: woven collection timeline spec and plan"
cd ~/Documents/GitHub/hfa-ml
.venv/bin/python -m hfa.export_weave --source fixture --frontend ../UVA_Collectiveaccess_Frontend
```

Expected: a summary line ending in `copied to ../UVA_Collectiveaccess_Frontend/data/collection-weave.json`, plus a note that `garments.parquet` wasn't found (no `data/` on the laptop), so `scanned` is `{}`.

- [ ] **Step 2: Add the types**

Create `types/collectionWeave.ts`:

```ts
// Shape of data/collection-weave.json, written by hfa-ml's hfa.export_weave.
// Per-decade aggregate weights only: no per-garment records.

export type WeightMap = Record<string, number>;

export interface DecadeWeave {
  decade: number; // first year of the decade, e.g. 1910
  garments: number; // weighted count: each dated garment adds 1 across the decades it spans
  colors: WeightMap;
  materials: WeightMap;
  techniques: WeightMap;
}

export interface ScannedRange {
  earliest: number;
  latest: number;
}

export interface CollectionWeave {
  generated: string;
  source: "search-index" | "ci-fixture";
  rows: number;
  dated: number;
  century_only: number;
  undated: number;
  decades: DecadeWeave[];
  scanned: Record<string, ScannedRange>;
}
```

- [ ] **Step 3: Write the failing loader tests**

Create `lib/collectionWeave.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { loadCollectionWeave, scannedInDecade } from "./collectionWeave";

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
```

- [ ] **Step 4: Run them to verify they fail**

Run: `npx vitest run lib/collectionWeave.test.ts`
Expected: FAIL, "Failed to resolve import "./collectionWeave"".

- [ ] **Step 5: Write the loader**

Create `lib/collectionWeave.ts`:

```ts
import type { CollectionWeave, DecadeWeave, ScannedRange, WeightMap } from "@/types/collectionWeave";

// data/collection-weave.json is generated by hfa-ml and committed; this
// validator keeps a missing, corrupt or hand-edited file from crashing
// /timeline. The page then shows only its garment list.

type Rec = Record<string, unknown>;

const isRecord = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);

const isWeight = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

const isWeightMap = (v: unknown): v is WeightMap => isRecord(v) && Object.values(v).every(isWeight);

function isDecade(v: unknown): v is DecadeWeave {
  return (
    isRecord(v) &&
    Number.isInteger(v.decade) &&
    isWeight(v.garments) &&
    isWeightMap(v.colors) &&
    isWeightMap(v.materials) &&
    isWeightMap(v.techniques)
  );
}

function isScannedRange(v: unknown): v is ScannedRange {
  return (
    isRecord(v) &&
    Number.isInteger(v.earliest) &&
    Number.isInteger(v.latest) &&
    (v.latest as number) >= (v.earliest as number)
  );
}

const count = (v: unknown) => (isWeight(v) ? v : 0);

export function loadCollectionWeave(raw: unknown): CollectionWeave | null {
  if (!isRecord(raw)) return null;
  if (raw.source !== "search-index" && raw.source !== "ci-fixture") return null;
  if (!Array.isArray(raw.decades) || raw.decades.length === 0 || !raw.decades.every(isDecade)) return null;

  const scanned: Record<string, ScannedRange> = {};
  if (isRecord(raw.scanned)) {
    for (const [accession, range] of Object.entries(raw.scanned)) {
      if (isScannedRange(range)) scanned[accession] = { earliest: range.earliest, latest: range.latest };
    }
  }

  return {
    generated: typeof raw.generated === "string" ? raw.generated : "",
    source: raw.source,
    rows: count(raw.rows),
    dated: count(raw.dated),
    century_only: count(raw.century_only),
    undated: count(raw.undated),
    decades: raw.decades,
    scanned,
  };
}

// A scanned garment belongs to decade d when its [earliest, latest] overlaps [d, d + 9].
export function scannedInDecade(scanned: Record<string, ScannedRange>, decade: number): string[] {
  return Object.entries(scanned)
    .filter(([, r]) => r.earliest <= decade + 9 && r.latest >= decade)
    .map(([accession]) => accession)
    .sort();
}
```

- [ ] **Step 6: Run the tests, check the generated file, and commit**

```bash
npx vitest run lib/collectionWeave.test.ts
node -e "const w=require('./data/collection-weave.json');console.log(w.source,w.rows,w.decades.length,w.decades[0].decade,w.decades.at(-1).decade)"
git add types/collectionWeave.ts lib/collectionWeave.ts lib/collectionWeave.test.ts data/collection-weave.json
git commit -m "feat: collection weave data contract, loader and fixture data"
```

Expected: tests PASS; the node line prints `ci-fixture 481 <n> <first decade> <last decade>`.

---

### Task 3: Weave model (`lib/weave.ts`)

**Files:**
- Create: `lib/weave.ts`
- Test: `lib/weave.test.ts`

**Interfaces:**
- Consumes: `DecadeWeave`, `WeightMap` from `@/types/collectionWeave` (Task 2).
- Produces (from `@/lib/weave`):
  - `type WeaveStructure = "satin" | "twill" | "plain" | "gauze" | "knit" | "figured"`
  - `interface Share { code: string; share: number }`
  - `interface ClothPlan { cols: number; rows: number; cell: number; warp: string[]; weftHex: string; structure: WeaveStructure; seed: number }`
  - constants `UNDYED = "undyed"`, `NEUTRAL_HEX = "#8a8278"`, `MULTI_HEXES = ["#b5523b", "#3c6e8f"]`, `MIN_DENSITY = 24`, `MAX_DENSITY = 96`
  - `colorShares(decade: DecadeWeave): Share[]`, `materialShares(decade: DecadeWeave): Share[]`
  - `warpRepeat(shares: Share[], repeatWidth?: number): string[]`
  - `weaveStructure(materials: WeightMap): WeaveStructure`
  - `warpOver(structure: WeaveStructure, x: number, y: number): boolean`
  - `threadDensity(garments: number, maxGarments: number): number`
  - `colorHex(code: string, cell?: number): string`
  - `shadeHex(hex: string, amount: number): string` (amount in [-1, 1]; negative darkens, positive lightens)
  - `cellJitter(x: number, y: number, seed: number): number` (in [-0.06, 0.06])
  - `garmentCount(decade: DecadeWeave): number`
  - `decadeLabel(decade: number): string`
  - `decadeSummary(decade: DecadeWeave): string`
  - `structureLabel(structure: WeaveStructure): string`
  - `defaultDecadeIndex(decades: DecadeWeave[]): number`
  - `clothPlan(decade: DecadeWeave, maxGarments: number, width: number, height: number): ClothPlan`

- [ ] **Step 1: Write the failing tests**

Create `lib/weave.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { DecadeWeave } from "@/types/collectionWeave";
import {
  MAX_DENSITY,
  MIN_DENSITY,
  MULTI_HEXES,
  NEUTRAL_HEX,
  UNDYED,
  cellJitter,
  clothPlan,
  colorHex,
  colorShares,
  decadeLabel,
  decadeSummary,
  defaultDecadeIndex,
  garmentCount,
  shadeHex,
  structureLabel,
  threadDensity,
  warpOver,
  warpRepeat,
  weaveStructure,
} from "./weave";

function decade(overrides: Partial<DecadeWeave> = {}): DecadeWeave {
  return {
    decade: 1910,
    garments: 63,
    colors: { black: 31, white: 24, cream: 12, blue: 33 },
    materials: { silk: 40, cotton: 20 },
    techniques: {},
    ...overrides,
  };
}

describe("colorShares", () => {
  it("returns shares in descending order, ties alphabetical", () => {
    const shares = colorShares(decade({ colors: { white: 1, black: 1, blue: 2 } }));
    expect(shares.map((s) => s.code)).toEqual(["blue", "black", "white"]);
    expect(shares[0].share).toBeCloseTo(0.5, 9);
  });
  it("is empty when there are no colours", () => {
    expect(colorShares(decade({ colors: {} }))).toEqual([]);
  });
});

describe("warpRepeat", () => {
  it("fills exactly the repeat width, in share order", () => {
    const repeat = warpRepeat([
      { code: "black", share: 0.5 },
      { code: "white", share: 0.3 },
      { code: "blue", share: 0.2 },
    ]);
    expect(repeat).toHaveLength(24);
    expect(repeat.filter((c) => c === "black")).toHaveLength(12);
    expect(repeat.filter((c) => c === "white")).toHaveLength(7);
    expect(repeat.filter((c) => c === "blue")).toHaveLength(5);
    expect(repeat.indexOf("white")).toBeGreaterThan(repeat.lastIndexOf("black"));
  });
  it("uses the largest remainder so counts always sum to the width", () => {
    const thirds = warpRepeat(
      [
        { code: "a", share: 1 / 3 },
        { code: "b", share: 1 / 3 },
        { code: "c", share: 1 / 3 },
      ],
      10,
    );
    expect(thirds).toHaveLength(10);
  });
  it("drops colours too small for a single thread", () => {
    const repeat = warpRepeat([
      { code: "black", share: 0.99 },
      { code: "gold", share: 0.01 },
    ]);
    expect(repeat).not.toContain("gold");
  });
  it("is undyed when there are no colours", () => {
    expect(warpRepeat([])).toEqual(Array(24).fill(UNDYED));
  });
});

describe("weaveStructure", () => {
  it.each([
    [{ silk: 3, cotton: 1 }, "satin"],
    [{ wool: 2 }, "twill"],
    [{ cotton: 1, linen: 1 }, "plain"],
    [{ lace: 2, cotton: 1 }, "gauze"],
    [{ spandex: 1 }, "knit"],
    [{ brocade: 2, cotton: 1 }, "figured"],
  ])("%j weaves as %s", (materials, structure) => {
    expect(weaveStructure(materials)).toBe(structure);
  });
  it("lets families pool their materials", () => {
    expect(weaveStructure({ cotton: 3, silk: 2, rayon: 2 })).toBe("satin");
  });
  it("falls back to plain when only non-woven materials are present", () => {
    expect(weaveStructure({ felt: 5, leather: 2, glass: 1, metal: 1 })).toBe("plain");
  });
  it("falls back to plain on a tie between families", () => {
    expect(weaveStructure({ silk: 2, wool: 2 })).toBe("plain");
  });
  it("falls back to plain with no materials or unknown codes", () => {
    expect(weaveStructure({})).toBe("plain");
    expect(weaveStructure({ mystery: 4 })).toBe("plain");
  });
});

describe("warpOver", () => {
  it("draws plain weave as a checkerboard", () => {
    expect([0, 1, 2, 3].map((x) => warpOver("plain", x, 0))).toEqual([true, false, true, false]);
    expect(warpOver("plain", 0, 1)).toBe(false);
  });
  it("draws 2/2 twill as a diagonal that shifts one thread per row", () => {
    expect([0, 1, 2, 3].map((x) => warpOver("twill", x, 0))).toEqual([true, true, false, false]);
    expect([0, 1, 2, 3].map((x) => warpOver("twill", x, 1))).toEqual([true, false, false, true]);
  });
  it("draws warp-faced satin with one weft float in five", () => {
    const row = [0, 1, 2, 3, 4].map((x) => warpOver("satin", x, 0));
    expect(row.filter((v) => !v)).toHaveLength(1);
  });
  it("inverts the twill inside the figured diamond motif", () => {
    expect(warpOver("figured", 8, 8)).toBe(!warpOver("twill", 8, 8));
    expect(warpOver("figured", 0, 0)).toBe(warpOver("twill", 0, 0));
  });
  it("handles negative coordinates", () => {
    expect(typeof warpOver("satin", -3, -7)).toBe("boolean");
  });
});

describe("threadDensity", () => {
  it("is the minimum for an empty decade", () => {
    expect(threadDensity(0, 100)).toBe(MIN_DENSITY);
  });
  it("is the maximum for the busiest decade", () => {
    expect(threadDensity(100, 100)).toBe(MAX_DENSITY);
  });
  it("grows on a log scale", () => {
    const low = threadDensity(5, 100);
    const mid = threadDensity(30, 100);
    expect(low).toBeGreaterThan(MIN_DENSITY);
    expect(mid).toBeGreaterThan(low);
    expect(mid).toBeLessThan(MAX_DENSITY);
  });
});

describe("colorHex and shadeHex", () => {
  it("maps vocabulary colours and falls back to neutral", () => {
    expect(colorHex("black")).toMatch(/^#[0-9a-f]{6}$/);
    expect(colorHex(UNDYED)).toBe(NEUTRAL_HEX);
    expect(colorHex("chartreuse")).toBe(NEUTRAL_HEX);
  });
  it("alternates multi-coloured thread by cell", () => {
    expect(colorHex("multi", 0)).toBe(MULTI_HEXES[0]);
    expect(colorHex("multi", 1)).toBe(MULTI_HEXES[1]);
    expect(colorHex("multi", -1)).toBe(MULTI_HEXES[1]);
  });
  it("darkens and lightens", () => {
    expect(shadeHex("#808080", 0)).toBe("#808080");
    expect(shadeHex("#808080", -1)).toBe("#000000");
    expect(shadeHex("#808080", 1)).toBe("#ffffff");
    expect(shadeHex("#ff0000", -0.5)).toBe("#800000");
  });
});

describe("cellJitter", () => {
  it("is deterministic and small", () => {
    const values = Array.from({ length: 200 }, (_, i) => cellJitter(i % 17, Math.floor(i / 17), 1910));
    expect(values.every((v) => v >= -0.06 && v <= 0.06)).toBe(true);
    expect(cellJitter(3, 4, 1910)).toBe(cellJitter(3, 4, 1910));
    expect(new Set(values.map((v) => v.toFixed(4))).size).toBeGreaterThan(50);
  });
});

describe("garmentCount and decadeSummary", () => {
  it("never shows 0 garments for a decade that has some weight", () => {
    expect(garmentCount(decade({ garments: 0.3 }))).toBe(1);
    expect(decadeSummary(decade({ garments: 0.3, colors: {}, materials: {} }))).toBe("1910s · 1 garment");
  });
  it("rounds larger counts", () => {
    expect(garmentCount(decade({ garments: 62.6 }))).toBe(63);
  });
  it("summarises colours and materials", () => {
    expect(decadeSummary(decade())).toBe("1910s · 63 garments · blue 33%, black 31%, white 24% · mostly silk, cotton");
  });
  it("describes an empty decade", () => {
    expect(decadeSummary(decade({ decade: 1830, garments: 0, colors: {}, materials: {} }))).toBe(
      "No catalogued garments from the 1830s",
    );
    expect(garmentCount(decade({ garments: 0 }))).toBe(0);
  });
  it("labels decades", () => {
    expect(decadeLabel(1910)).toBe("1910s");
  });
});

describe("structureLabel", () => {
  it("names every structure", () => {
    for (const s of ["satin", "twill", "plain", "gauze", "knit", "figured"] as const) {
      expect(structureLabel(s).length).toBeGreaterThan(0);
    }
    expect(structureLabel("satin")).toBe("Woven as satin");
  });
});

describe("defaultDecadeIndex", () => {
  it("picks the busiest decade, first on a tie", () => {
    expect(
      defaultDecadeIndex([decade({ garments: 2 }), decade({ garments: 9 }), decade({ garments: 9 })]),
    ).toBe(1);
  });
  it("is 0 for an empty list", () => {
    expect(defaultDecadeIndex([])).toBe(0);
  });
});

describe("clothPlan", () => {
  it("lays out warp threads by colour and sizes rows to fill the height", () => {
    const plan = clothPlan(decade(), 63, 960, 320);
    expect(plan.cols).toBe(MAX_DENSITY);
    expect(plan.cell).toBeCloseTo(10, 9);
    expect(plan.rows).toBe(32);
    expect(plan.warp).toHaveLength(plan.cols);
    expect(plan.structure).toBe("satin");
    expect(plan.weftHex).toMatch(/^#[0-9a-f]{6}$/);
    expect(plan.seed).toBe(1910);
  });
  it("draws nothing for a zero-size container instead of infinite rows", () => {
    const plan = clothPlan(decade(), 63, 0, 0);
    expect(plan.rows).toBe(0);
    expect(Number.isFinite(plan.cell)).toBe(true);
  });
  it("weaves undyed thread for a decade without colours", () => {
    const plan = clothPlan(decade({ garments: 0, colors: {}, materials: {} }), 63, 480, 160);
    expect(plan.cols).toBe(MIN_DENSITY);
    expect(new Set(plan.warp)).toEqual(new Set([UNDYED]));
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run lib/weave.test.ts`
Expected: FAIL, "Failed to resolve import "./weave"".

- [ ] **Step 3: Write the implementation**

Create `lib/weave.ts`:

```ts
import type { DecadeWeave, WeightMap } from "@/types/collectionWeave";

// The woven timeline: one decade of the collection becomes a piece of cloth.
// Warp colours come from the decade's colour mix, the weave structure from its
// dominant material family, and the thread density from its garment count.

export type WeaveStructure = "satin" | "twill" | "plain" | "gauze" | "knit" | "figured";

export interface Share {
  code: string;
  share: number;
}

export interface ClothPlan {
  cols: number; // warp threads across the width
  rows: number; // weft rows needed to fill the height
  cell: number; // CSS pixels per thread
  warp: string[]; // colour code per column
  weftHex: string;
  structure: WeaveStructure;
  seed: number;
}

export const UNDYED = "undyed";
export const NEUTRAL_HEX = "#8a8278";
export const MULTI_HEXES = ["#b5523b", "#3c6e8f"] as const;
export const MIN_DENSITY = 24;
export const MAX_DENSITY = 96;
const REPEAT_WIDTH = 24;
const WEFT_DARKEN = -0.35;

// One fixed shade per code in hfa-ml's colour vocabulary ("multi" is drawn
// as alternating MULTI_HEXES).
const PALETTE: Record<string, string> = {
  beige: "#d8c3a0",
  black: "#1f1d1b",
  blue: "#3f5f9a",
  brown: "#6b4a32",
  burgundy: "#6d1f2f",
  coral: "#e07a5f",
  cream: "#efe6d0",
  fuchsia: "#c2387a",
  gold: "#c9a227",
  gray: "#8d8d8a",
  green: "#4f7a4a",
  lavender: "#a99bc9",
  maroon: "#5c1a1b",
  navy: "#1f2f4f",
  orange: "#d9822b",
  pink: "#e8a6b8",
  purple: "#5e3f7a",
  red: "#a8322d",
  rust: "#a5532a",
  tan: "#c2a27c",
  teal: "#2f7c7a",
  turquoise: "#3fb0ac",
  white: "#f4f1ea",
  yellow: "#e3c34a",
};

// Material code -> the weave its fabrics are usually made with. felt,
// leather, glass and metal are non-woven and don't vote.
const FAMILY: Record<string, WeaveStructure> = {
  satin: "satin",
  silk: "satin",
  rayon: "satin",
  acetate: "satin",
  velvet: "satin",
  wool: "twill",
  cashmere: "twill",
  cotton: "plain",
  linen: "plain",
  hemp: "plain",
  taffeta: "plain",
  crepe: "plain",
  nylon: "plain",
  polyester: "plain",
  lace: "gauze",
  chiffon: "gauze",
  georgette: "gauze",
  spandex: "knit",
  elastic: "knit",
  angora: "knit",
  acrylic: "knit",
  brocade: "figured",
  damask: "figured",
};

const STRUCTURE_LABELS: Record<WeaveStructure, string> = {
  satin: "Woven as satin",
  twill: "Woven as twill",
  plain: "Woven as plain cloth",
  gauze: "Woven as open gauze",
  knit: "Knitted",
  figured: "Woven with a figured motif",
};

const mod = (n: number, m: number) => ((n % m) + m) % m;

function sharesOf(map: WeightMap): Share[] {
  const entries = Object.entries(map).filter(([, w]) => w > 0);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return [];
  return entries
    .map(([code, w]) => ({ code, share: w / total }))
    .sort((a, b) => b.share - a.share || a.code.localeCompare(b.code));
}

export function colorShares(decade: DecadeWeave): Share[] {
  return sharesOf(decade.colors);
}

export function materialShares(decade: DecadeWeave): Share[] {
  return sharesOf(decade.materials);
}

// One pattern repeat of warp colours, in contiguous bands. Counts use the
// largest-remainder method so they always sum to repeatWidth.
export function warpRepeat(shares: Share[], repeatWidth = REPEAT_WIDTH): string[] {
  if (shares.length === 0) return Array(repeatWidth).fill(UNDYED);
  const exact = shares.map((s) => s.share * repeatWidth);
  const counts = exact.map(Math.floor);
  let remaining = repeatWidth - counts.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of byRemainder) {
    if (remaining <= 0) break;
    counts[i] += 1;
    remaining -= 1;
  }
  return shares.flatMap((s, i) => Array<string>(counts[i]).fill(s.code));
}

export function weaveStructure(materials: WeightMap): WeaveStructure {
  const votes = new Map<WeaveStructure, number>();
  for (const [code, weight] of Object.entries(materials)) {
    const family = FAMILY[code];
    if (family && weight > 0) votes.set(family, (votes.get(family) ?? 0) + weight);
  }
  const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return "plain";
  if (ranked.length > 1 && Math.abs(ranked[0][1] - ranked[1][1]) < 1e-9) return "plain";
  return ranked[0][0];
}

// Whether the warp (vertical) thread shows at cell (x, y). Knit is drawn by
// its own stitch routine; it falls back to plain here.
export function warpOver(structure: WeaveStructure, x: number, y: number): boolean {
  switch (structure) {
    case "twill":
      return mod(x + y, 4) < 2;
    case "satin":
      return mod(3 * x + y, 5) !== 0;
    case "figured": {
      const twill = mod(x + y, 4) < 2;
      const inMotif = Math.abs(mod(x, 16) - 8) + Math.abs(mod(y, 16) - 8) < 6;
      return inMotif ? !twill : twill;
    }
    default:
      return mod(x + y, 2) === 0;
  }
}

export function threadDensity(garments: number, maxGarments: number): number {
  if (garments <= 0 || maxGarments <= 0) return MIN_DENSITY;
  const t = Math.log1p(Math.min(garments, maxGarments)) / Math.log1p(maxGarments);
  return Math.round(MIN_DENSITY + (MAX_DENSITY - MIN_DENSITY) * t);
}

export function colorHex(code: string, cell = 0): string {
  if (code === "multi") return MULTI_HEXES[mod(cell, 2)];
  return PALETTE[code] ?? NEUTRAL_HEX;
}

export function shadeHex(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = amount >= 0 ? c + (255 - c) * amount : c * (1 + amount);
    return Math.max(0, Math.min(255, Math.round(v)));
  });
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

// Small deterministic brightness variation per thread cell, so the cloth
// reads as threads, not flat pixels.
export function cellJitter(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) / 4294967295 - 0.5) * 0.12;
}

// Whole garments for display. A decade holding only a fraction of one
// garment's date range still shows "1 garment", never "0 garments".
export function garmentCount(decade: DecadeWeave): number {
  if (decade.garments <= 0) return 0;
  return Math.max(1, Math.round(decade.garments));
}

export function decadeLabel(decade: number): string {
  return `${decade}s`;
}

const percent = (share: number) => `${Math.round(share * 100)}%`;

export function decadeSummary(decade: DecadeWeave): string {
  const label = decadeLabel(decade.decade);
  const count = garmentCount(decade);
  if (count === 0) return `No catalogued garments from the ${label}`;
  const parts = [label, `${count} ${count === 1 ? "garment" : "garments"}`];
  const colours = colorShares(decade)
    .slice(0, 3)
    .map((s) => `${s.code} ${percent(s.share)}`);
  if (colours.length > 0) parts.push(colours.join(", "));
  const materials = materialShares(decade)
    .slice(0, 2)
    .map((s) => s.code);
  if (materials.length > 0) parts.push(`mostly ${materials.join(", ")}`);
  return parts.join(" · ");
}

export function structureLabel(structure: WeaveStructure): string {
  return STRUCTURE_LABELS[structure];
}

export function defaultDecadeIndex(decades: DecadeWeave[]): number {
  let best = 0;
  decades.forEach((d, i) => {
    if (d.garments > decades[best].garments) best = i;
  });
  return best;
}

export function clothPlan(decade: DecadeWeave, maxGarments: number, width: number, height: number): ClothPlan {
  const cols = threadDensity(decade.garments, maxGarments);
  const cell = width > 0 ? width / cols : 1;
  const rows = width > 0 && height > 0 ? Math.ceil(height / cell) : 0;
  const repeat = warpRepeat(colorShares(decade));
  return {
    cols,
    rows,
    cell,
    warp: Array.from({ length: cols }, (_, x) => repeat[x % repeat.length]),
    weftHex: shadeHex(colorHex(repeat[0]), WEFT_DARKEN),
    structure: weaveStructure(decade.materials),
    seed: decade.decade,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/weave.test.ts`
Expected: PASS. If the `decadeSummary` colour order differs, check the test decade: blue 33 > black 31 > white 24, so blue leads.

- [ ] **Step 5: Commit**

```bash
git add lib/weave.ts lib/weave.test.ts
git commit -m "feat: weave model turning a decade into a cloth plan"
```

---

### Task 4: Woven timeline page

**Files:**
- Create: `components/timeline/paintCloth.ts`, `components/timeline/WovenCloth.tsx`, `components/timeline/DecadeScrubber.tsx`, `components/timeline/CollectionWeaveView.tsx`
- Modify: `app/timeline/page.tsx` (whole file, 16 lines)

**Interfaces:**
- Consumes: everything in Task 3's Produces; `loadCollectionWeave` and `scannedInDecade` (Task 2); `CollectionWeave` and `DecadeWeave` (Task 2); `Garment3DViewer` (`components/garments/Garment3DViewer.tsx`, props `{ modelUrl?: string; garmentId?: string; garment?: Garment }`); `TimelineView` (props `{ garments: Garment[] }`).
- Produces:
  - `paintRows(ctx: CanvasRenderingContext2D, plan: ClothPlan, fromRow: number, toRow: number): void`
  - `WovenCloth` with props `{ decade: DecadeWeave; maxGarments: number }`
  - `DecadeScrubber` with props `{ decades: DecadeWeave[]; index: number; onChange: (index: number) => void }`
  - `CollectionWeaveView` with props `{ weave: CollectionWeave; garments: Garment[] }`

- [ ] **Step 1: Create the canvas painter**

Create `components/timeline/paintCloth.ts`:

```ts
import { cellJitter, colorHex, shadeHex, warpOver, type ClothPlan } from "@/lib/weave";

// Paints rows [fromRow, toRow) of a cloth plan. Each cell is a short thread
// segment: vertical where the warp shows, horizontal where the weft does,
// with a thin highlight down its middle so the cloth reads as thread.

const LOOM = "#191715";
const HIGHLIGHT = 0.18;

function paintStitch(
  ctx: CanvasRenderingContext2D,
  warpHex: string,
  weftHex: string,
  px: number,
  py: number,
  cell: number,
): void {
  ctx.fillStyle = weftHex;
  ctx.fillRect(px, py, cell, cell);
  ctx.strokeStyle = warpHex;
  ctx.lineWidth = cell * 0.32;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px + cell * 0.2, py + cell * 0.15);
  ctx.lineTo(px + cell * 0.5, py + cell * 0.85);
  ctx.lineTo(px + cell * 0.8, py + cell * 0.15);
  ctx.stroke();
}

export function paintRows(ctx: CanvasRenderingContext2D, plan: ClothPlan, fromRow: number, toRow: number): void {
  const { cell, cols, structure, warp, weftHex, seed } = plan;
  const inset = structure === "gauze" ? cell * 0.22 : cell * 0.08;
  const line = Math.max(0.5, cell * 0.15);

  for (let y = fromRow; y < toRow; y++) {
    const py = y * cell;
    ctx.fillStyle = LOOM;
    ctx.fillRect(0, py, cols * cell, cell);

    for (let x = 0; x < cols; x++) {
      const px = x * cell;
      const shade = cellJitter(x, y, seed);
      const warpHex = shadeHex(colorHex(warp[x], y), shade);
      const weft = shadeHex(weftHex, shade);

      if (structure === "knit") {
        paintStitch(ctx, warpHex, weft, px, py, cell);
        continue;
      }

      if (warpOver(structure, x, y)) {
        ctx.fillStyle = warpHex;
        ctx.fillRect(px + inset, py, cell - 2 * inset, cell);
        ctx.fillStyle = shadeHex(warpHex, HIGHLIGHT);
        ctx.fillRect(px + cell / 2 - line / 2, py, line, cell);
      } else {
        ctx.fillStyle = weft;
        ctx.fillRect(px, py + inset, cell, cell - 2 * inset);
        ctx.fillStyle = shadeHex(weft, HIGHLIGHT);
        ctx.fillRect(px, py + cell / 2 - line / 2, cell, line);
      }
    }
  }
}
```

- [ ] **Step 2: Create `WovenCloth.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import type { DecadeWeave } from "@/types/collectionWeave";
import { clothPlan, decadeSummary } from "@/lib/weave";
import { paintRows } from "./paintCloth";

const REWEAVE_MS = 600;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

interface Props {
  decade: DecadeWeave;
  maxGarments: number;
}

// The decade's cloth on a canvas. A new decade re-weaves top to bottom
// like a loom (instantly under reduced motion); a resize redraws at once.
export default function WovenCloth({ decade, maxGarments }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasDrawn = useRef(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    let raf = 0;

    // Resizing a canvas clears it, so only resize when the size changed:
    // that keeps the previous decade visible while the new one weaves over it.
    const layout = () => {
      const { width, height } = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(width * dpr));
      const h = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return clothPlan(decade, maxGarments, width, height);
    };

    let plan = layout();
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;

    if (reduced || !hasDrawn.current) {
      paintRows(ctx, plan, 0, plan.rows);
    } else {
      const start = performance.now();
      let drawn = 0;
      const step = (now: number) => {
        const target = Math.min(plan.rows, Math.ceil(((now - start) / REWEAVE_MS) * plan.rows));
        paintRows(ctx, plan, drawn, target);
        drawn = target;
        if (drawn < plan.rows) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    hasDrawn.current = plan.rows > 0;

    // ResizeObserver reports the current size once on observe; skip that
    // first call so it doesn't cut the re-weave short.
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      cancelAnimationFrame(raf);
      plan = layout();
      paintRows(ctx, plan, 0, plan.rows);
      hasDrawn.current = plan.rows > 0;
    });
    observer.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [decade, maxGarments]);

  return (
    <div ref={wrapRef} className="relative w-full aspect-[4/3] md:aspect-[3/1] bg-[#191715] border border-archive-border">
      <canvas ref={canvasRef} role="img" aria-label={decadeSummary(decade)} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
```

- [ ] **Step 3: Create `DecadeScrubber.tsx`**

```tsx
"use client";

import type { DecadeWeave } from "@/types/collectionWeave";
import { decadeLabel, garmentCount } from "@/lib/weave";

interface Props {
  decades: DecadeWeave[];
  index: number;
  onChange: (index: number) => void;
}

// A native range input over the decades, so arrows, Home, End and
// PageUp/PageDown work as standard, above a row of bars showing how many
// garments each decade holds (log-scaled so sparse decades stay visible).
export default function DecadeScrubber({ decades, index, onChange }: Props) {
  const max = Math.max(1, ...decades.map((d) => d.garments));
  const current = decades[index];
  const count = garmentCount(current);

  return (
    <div className="w-full">
      <div className="flex items-end gap-px h-10" aria-hidden>
        {decades.map((d, i) => (
          <div
            key={d.decade}
            className={`flex-1 transition-colors ${i === index ? "bg-archive-fg" : "bg-archive-border"}`}
            style={{ height: `${d.garments > 0 ? Math.max(8, (Math.log1p(d.garments) / Math.log1p(max)) * 100) : 2}%` }}
          />
        ))}
      </div>
      <input
        type="range"
        min={0}
        max={decades.length - 1}
        step={1}
        value={index}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Decade"
        aria-valuetext={`${decadeLabel(current.decade)}, ${count} ${count === 1 ? "garment" : "garments"}`}
        className="w-full mt-2 accent-archive-fg"
      />
      <div className="relative h-5 mt-1 text-[10px] uppercase tracking-[0.2em] text-archive-muted" aria-hidden>
        {decades.map((d, i) =>
          d.decade % 50 === 0 ? (
            <span
              key={d.decade}
              className="absolute -translate-x-1/2"
              style={{ left: `${decades.length === 1 ? 50 : (i / (decades.length - 1)) * 100}%` }}
            >
              {d.decade}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `CollectionWeaveView.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { CollectionWeave } from "@/types/collectionWeave";
import type { Garment } from "@/types/garment";
import {
  colorHex,
  colorShares,
  decadeLabel,
  decadeSummary,
  defaultDecadeIndex,
  structureLabel,
  weaveStructure,
} from "@/lib/weave";
import { scannedInDecade } from "@/lib/collectionWeave";
import WovenCloth from "./WovenCloth";
import DecadeScrubber from "./DecadeScrubber";

const Garment3DViewer = dynamic(() => import("@/components/garments/Garment3DViewer"), { ssr: false });

interface Props {
  weave: CollectionWeave;
  garments: Garment[];
}

export default function CollectionWeaveView({ weave, garments }: Props) {
  const [index, setIndex] = useState(() => defaultDecadeIndex(weave.decades));
  const [open3d, setOpen3d] = useState<string | null>(null);

  const decade = weave.decades[index];
  const maxGarments = useMemo(() => Math.max(0, ...weave.decades.map((d) => d.garments)), [weave]);
  const byAccession = useMemo(
    () => new Map(garments.flatMap((g) => (g.accessionNumber ? [[g.accessionNumber, g] as const] : []))),
    [garments],
  );

  const scanned = scannedInDecade(weave.scanned, decade.decade).flatMap((accession) => {
    const garment = byAccession.get(accession);
    return garment?.model3d_url ? [{ accession, range: weave.scanned[accession], garment }] : [];
  });
  const opened = scanned.find((s) => s.accession === open3d)?.garment;
  const swatches = colorShares(decade).slice(0, 5);

  return (
    <section className="mb-16" aria-labelledby="woven-heading">
      <h1 id="woven-heading" className="text-3xl md:text-5xl font-light tracking-tight text-archive-fg mb-3">
        The collection, woven
      </h1>
      <p className="text-sm text-archive-muted max-w-2xl">
        Each decade&apos;s colours, fabrics and number of garments, woven into cloth.
      </p>
      {weave.source === "ci-fixture" && (
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-archive-muted-subtle">
          Preview data from a sample of the collection.
        </p>
      )}

      <div className="grid gap-8 mt-8 lg:grid-cols-[1fr_18rem]">
        <div>
          <WovenCloth decade={decade} maxGarments={maxGarments} />
          <div className="mt-4">
            <DecadeScrubber decades={weave.decades} index={index} onChange={setIndex} />
          </div>
        </div>

        <aside className="border border-archive-border p-5 text-sm text-archive-muted space-y-4 self-start">
          <p className="text-2xl font-light text-archive-fg">{decadeLabel(decade.decade)}</p>
          <p>{decadeSummary(decade)}</p>
          {swatches.length > 0 && (
            <ul className="space-y-1.5">
              {swatches.map((s) => (
                <li key={s.code} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block w-3 h-3 border border-archive-border"
                    style={{
                      background:
                        s.code === "multi"
                          ? `linear-gradient(90deg, ${colorHex("multi", 0)} 50%, ${colorHex("multi", 1)} 50%)`
                          : colorHex(s.code),
                    }}
                  />
                  <span className="capitalize">{s.code}</span>
                  <span className="ml-auto tabular-nums">{Math.round(s.share * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
          {decade.garments > 0 && <p>{structureLabel(weaveStructure(decade.materials))}</p>}
        </aside>
      </div>

      {scanned.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs uppercase tracking-[0.2em] text-archive-muted mb-3">
            Scanned in 3D from the {decadeLabel(decade.decade)}
          </h2>
          <ul className="flex flex-wrap gap-3">
            {scanned.map(({ accession, range, garment }) => (
              <li key={accession} className="border border-archive-border p-4 min-w-[14rem]">
                <p className="text-archive-fg">{garment.label}</p>
                <p className="text-xs text-archive-muted mb-3">
                  {range.earliest}–{range.latest}
                </p>
                <button
                  type="button"
                  aria-expanded={open3d === accession}
                  onClick={() => setOpen3d(open3d === accession ? null : accession)}
                  className="px-3 py-2 border border-archive-border text-xs uppercase tracking-[0.2em] text-archive-fg hover:border-archive-border-hover transition-colors"
                >
                  {open3d === accession ? "Hide 3D" : "Turn it in 3D"}
                </button>
              </li>
            ))}
          </ul>
          {opened && (
            <div className="mt-6">
              <Garment3DViewer modelUrl={opened.model3d_url} garment={opened} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Rewrite the page**

Replace `app/timeline/page.tsx` with:

```tsx
import { hydrateGarmentsFromCA, getAllGarments } from "@/lib/garments";
import PageLayout from "@/components/layout/PageLayout";
import TimelineView from "@/components/garments/TimelineView";
import CollectionWeaveView from "@/components/timeline/CollectionWeaveView";
import { loadCollectionWeave } from "@/lib/collectionWeave";
import weaveData from "@/data/collection-weave.json";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  await hydrateGarmentsFromCA();
  const allGarments = getAllGarments();
  // Generated by hfa-ml (hfa.export_weave); a malformed file just hides the weave.
  const weave = loadCollectionWeave(weaveData as unknown);

  return (
    <PageLayout>
      {weave && <CollectionWeaveView weave={weave} garments={allGarments} />}
      {weave && (
        <h2 className="text-xs uppercase tracking-[0.2em] text-archive-muted mb-6">Garments on the site</h2>
      )}
      <TimelineView garments={allGarments} />
    </PageLayout>
  );
}
```

- [ ] **Step 6: Typecheck, lint and test**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: no type errors, zero lint warnings, all tests pass.

- [ ] **Step 7: Check it in the browser**

Run `npm run dev` (if routes 404, stop the server, delete `.next/dev` and restart: a stale dev cache did that on 2026-10-19). Open `/timeline` and check:
- The heading, the "Preview data" note, the cloth, the scrubber with bars, and the summary panel all render. The garment list sits below under "Garments on the site".
- It opens on the busiest decade. Dragging the scrubber re-weaves top to bottom; colours, structure and density visibly change between distant decades (try the earliest decade, the busiest, and the latest).
- Focus the scrubber: the arrow keys, Home and End move it.
- Under emulated reduced motion, the cloth changes instantly.
- An empty decade (if the fixture has one) shows undyed threads and "No catalogued garments from the …".
- At 375 px wide the layout stacks with no horizontal scroll.
- No console errors.

- [ ] **Step 8: Commit**

```bash
git add components/timeline app/timeline/page.tsx
git commit -m "feat: woven collection timeline on /timeline"
```

---

### Task 5: Full verification

- [ ] **Step 1: Frontend suite and production build**

```bash
cd ~/Documents/GitHub/UVA_Collectiveaccess_Frontend
npm test && npx tsc --noEmit && npm run lint && npm run build
```

Expected: all pass, and `/timeline` is listed in the build output.

- [ ] **Step 2: hfa-ml suite**

```bash
cd ~/Documents/GitHub/hfa-ml && .venv/bin/python -m pytest -q 2>&1 | tail -2
```

Expected: the new tests pass, and nothing that passed in Task 1 Step 1 now fails.

- [ ] **Step 3: Record what's still open**

For the PR descriptions and the final report:
- `data/collection-weave.json` is the CI-fixture build (`source: "ci-fixture"`, 481 rows). On the desktop, run `.venv/bin/python -m hfa.export_weave --frontend ../UVA_Collectiveaccess_Frontend` and commit the result. The "Preview data" note then disappears.
- `scanned` is empty until that run reads `garments.parquet`.
- Archive sign-off is needed for publishing per-decade colour and material totals.
