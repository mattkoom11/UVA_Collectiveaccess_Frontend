import { type Era, type Garment, type GarmentModel, getEraFromDecade } from "@/types/garment";

export interface WingDefinition {
  era: Era;
  numeral: string;
  label: string;
}

// Chronological order of the runway: the visitor walks from I to IV.
export const WINGS: readonly WingDefinition[] = [
  { era: "pre-1920", numeral: "I", label: "Pre-1920" },
  { era: "1920-1950", numeral: "II", label: "1920–1950" },
  { era: "1950-1980", numeral: "III", label: "1950–1980" },
  { era: "1980+", numeral: "IV", label: "1980+" },
];

export interface Wing extends WingDefinition {
  flagships: Garment[];
  lightboxes: Garment[];
}

export interface MuseumLayout {
  wings: Wing[];
  // Public garments the hall can't place: no date to put them in a wing, or
  // no 3D file and no photo to show. They still appear in Collection.
  unplaced: Garment[];
}

/**
 * Picks the file to load while walking the hall: the one marked web_preview,
 * else any file that isn't the archival master.
 */
export function pickPreviewModelUrl(models: GarmentModel[] = []): string | undefined {
  const preview = models.find((m) => m.role === "web_preview");
  if (preview) return preview.url;
  return models.find((m) => m.role !== "archival_master")?.url;
}

/** The 3D file to load while walking the hall, falling back to the legacy single-URL fields. */
export function getPreviewModelUrl(garment: Garment): string | undefined {
  return pickPreviewModelUrl(garment.models) ?? (garment.model3d_url || garment.modelUrl || undefined);
}

/** The 3D file to swap in on close inspection; falls back to the preview. */
export function getDetailModelUrl(garment: Garment): string | undefined {
  const detail = garment.models?.find((m) => m.role === "full_detail");
  return detail?.url ?? getPreviewModelUrl(garment);
}

/**
 * A flagship stands on the runway: a curator marked it featured_on_runway in
 * CollectiveAccess, and it has a 3D file the site can load. A flagged record
 * with no usable file stays off the runway rather than leaving an empty spot.
 */
export function isFlagship(garment: Garment): boolean {
  return garment.featuredOnRunway === true && getPreviewModelUrl(garment) !== undefined;
}

function hasPhoto(garment: Garment): boolean {
  return Boolean(garment.imageUrl || garment.thumbnailUrl || garment.images?.length);
}

function getEra(garment: Garment): Era | undefined {
  return getEraFromDecade(garment.decade, garment.yearApprox, garment.date, garment.era);
}

/** Best-known year of manufacture, used to order garments within a wing. */
export function getGarmentYear(garment: Garment): number | undefined {
  if (garment.yearApprox) return garment.yearApprox;
  const fromDate = garment.date?.match(/\d{4}/);
  if (fromDate) return parseInt(fromDate[0], 10);
  const fromDecade = garment.decade?.match(/(\d{4})s/);
  if (fromDecade) return parseInt(fromDecade[1], 10);
  return undefined;
}

// Undated garments sort to the end of their wing rather than the start.
function byYearThenLabel(a: Garment, b: Garment): number {
  const ya = getGarmentYear(a) ?? Number.POSITIVE_INFINITY;
  const yb = getGarmentYear(b) ?? Number.POSITIVE_INFINITY;
  if (ya !== yb) return ya - yb;
  return a.label.localeCompare(b.label);
}

// A curator-set runwayOrder wins; unordered flagships follow, by year.
function byRunwayOrder(a: Garment, b: Garment): number {
  const oa = a.runwayOrder ?? Number.POSITIVE_INFINITY;
  const ob = b.runwayOrder ?? Number.POSITIVE_INFINITY;
  if (oa !== ob) return oa - ob;
  return byYearThenLabel(a, b);
}

/**
 * Sorts garments into the museum's four era wings. Every wing is always
 * present, in chronological order, even when empty, so the runway keeps its
 * shape as the collection grows. Flagships stand on the runway; everything
 * else with a photo hangs as a lightbox on the wing's walls.
 */
export function buildMuseumLayout(garments: Garment[]): MuseumLayout {
  const wings: Wing[] = WINGS.map((w) => ({ ...w, flagships: [], lightboxes: [] }));
  const wingByEra = new Map(wings.map((w) => [w.era, w]));
  const unplaced: Garment[] = [];

  for (const garment of garments) {
    const era = getEra(garment);
    const wing = era ? wingByEra.get(era) : undefined;
    if (!wing) {
      unplaced.push(garment);
    } else if (isFlagship(garment)) {
      wing.flagships.push(garment);
    } else if (hasPhoto(garment)) {
      wing.lightboxes.push(garment);
    } else {
      unplaced.push(garment);
    }
  }

  for (const wing of wings) {
    wing.flagships.sort(byRunwayOrder);
    wing.lightboxes.sort(byYearThenLabel);
  }

  return { wings, unplaced };
}
