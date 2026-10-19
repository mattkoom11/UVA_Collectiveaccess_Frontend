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
