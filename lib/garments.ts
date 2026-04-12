import garmentsData from "@/data/garments.json";
import { Garment, Era, GarmentType, getEraFromDecade, getGarmentTypeFromWorkType, normalizeMaterials } from "@/types/garment";
import { syncGarmentsFromCA, isCAConfigured } from "@/lib/collectiveAccess";

let caGarmentsCache: Garment[] | null = null;
let hydrateInFlight: Promise<void> | null = null;

function getCacheFilePath(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");
  return path.join(process.cwd(), "data", "ca-garments-cache.json");
}

const isDev = process.env.NODE_ENV !== "production";

function loadDiskCache(): Garment[] | null {
  if (typeof window !== "undefined") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    const cacheFile = getCacheFilePath();
    if (fs.existsSync(cacheFile)) {
      const raw = fs.readFileSync(cacheFile, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (isDev) console.log(`[CA] Loaded ${parsed.length} garments from disk cache.`);
        return parsed as Garment[];
      }
    }
  } catch (e) {
    if (isDev) console.warn("[CA] Could not read disk cache:", e);
  }
  return null;
}

function saveDiskCache(garments: Garment[]): void {
  if (typeof window !== "undefined") return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    const cacheFile = getCacheFilePath();
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(garments), "utf-8");
    if (isDev) console.log(`[CA] Saved ${garments.length} garments to disk cache.`);
  } catch (e) {
    if (isDev) console.warn("[CA] Could not write disk cache:", e);
  }
}

/**
 * When CA is configured, populate the in-memory cache from CollectiveAccess.
 * On first run after a restart, tries the disk cache first (fast), then falls
 * back to a live fast-hydration fetch from CA.
 */
export async function hydrateGarmentsFromCA(): Promise<void> {
  if (!isCAConfigured()) return;
  if (caGarmentsCache != null) return;

  // If a hydration is already in progress, wait for it instead of firing a second one.
  if (hydrateInFlight) return hydrateInFlight;

  hydrateInFlight = (async () => {
    // Try disk cache first — this has real dates/eras from the last admin sync
    const disk = loadDiskCache();
    if (disk) {
      caGarmentsCache = disk;
      return;
    }

    try {
      if (isDev) console.log("[CA] Hydrating garments from CollectiveAccess...");
      const TIMEOUT_MS = 10_000;
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`CA hydration timed out after ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS)
      );
      const raw = await Promise.race([syncGarmentsFromCA(0, true), timeout]);
      caGarmentsCache = raw.map((g) => ({
        ...g,
        images: Array.isArray(g.images) ? g.images : g.images ? [g.images] : [],
        materials: normalizeMaterials(g.materials),
      })) as Garment[];
      if (isDev) console.log(`[CA] Hydrated ${caGarmentsCache.length} garments.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[CA] Hydrate failed, using static data: ${msg}`);
    }
  })().finally(() => {
    hydrateInFlight = null;
  });

  return hydrateInFlight;
}

/** Used by server-only API (e.g. admin sync) to update cache after a CA sync. */
export function setCAGarmentsCache(garments: Garment[] | null): void {
  caGarmentsCache = garments
    ? garments.map((g) => ({ ...g, materials: normalizeMaterials(g.materials) }))
    : null;
  if (caGarmentsCache) saveDiskCache(caGarmentsCache);
}

export function getAllGarments(): Garment[] {
  if (isCAConfigured() && caGarmentsCache != null) {
    return caGarmentsCache;
  }
  // Normalize static JSON data on the way out so consumers always get string[]
  return (garmentsData as Garment[]).map((g) => ({
    ...g,
    materials: normalizeMaterials(g.materials),
  }));
}

export function getGarmentBySlug(slug: string): Garment | undefined {
  return getAllGarments().find((g) => g.slug === slug);
}

export function getGarmentById(id: string): Garment | undefined {
  return getAllGarments().find((g) => g.id === id);
}

// Enhanced filter function supporting both old and new filter types
export function filterGarments(
  items: Garment[],
  filters: { 
    decade?: string; 
    work_type?: string; 
    color?: string;
    material?: string; // New: material filter
    era?: Era; // New: era filter
    type?: GarmentType; // New: garment type filter
  }
): Garment[] {
  return items.filter((g) => {
    // Legacy filters
    if (filters.decade && g.decade !== filters.decade) return false;
    if (filters.work_type && g.work_type !== filters.work_type) return false;
    if (
      filters.color &&
      !(g.colors || []).map((c) => c.toLowerCase()).includes(filters.color.toLowerCase())
    )
      return false;
    
    // Material filter
    if (filters.material) {
      const garmentMaterials = (g.materials ?? []).map(m => m.toLowerCase());
      if (!garmentMaterials.includes(filters.material.toLowerCase())) return false;
    }
    
    // New era filter
    if (filters.era) {
      const garmentEra = g.era || getEraFromDecade(g.decade, g.yearApprox, g.date);
      if (garmentEra !== filters.era) return false;
    }
    
    // New type filter
    if (filters.type) {
      const garmentType = g.type || getGarmentTypeFromWorkType(g.work_type);
      if (garmentType !== filters.type) return false;
    }
    
    return true;
  });
}

/**
 * Simple search across all garment text fields.
 * For advanced boolean/field search, use advancedSearch() from lib/advancedSearch.
 */
export function searchGarments(
  items: Garment[],
  query: string
): Garment[] {
  if (!query || query.trim().length === 0) {
    return items;
  }

  const searchTerms = query.toLowerCase().trim().split(/\s+/);

  return items.filter((g) => {
    const fields: (string | undefined)[] = [
      g.name,
      g.label,
      g.editorial_title,
      g.editorial_subtitle,
      g.tagline,
      g.description,
      g.aesthetic_description,
      g.story,
      g.inspiration,
      g.context,
      g.curatorNote,
      g.decade,
      g.date,
      g.yearApprox?.toString(),
      g.work_type,
      g.accessionNumber,
      g.collection,
      g.provenance,
      g.function?.join(" "),
      g.gender,
      g.age,
      g.condition,
      g.materials?.join(" "),
      g.colors?.join(" "),
    ];

    return searchTerms.every((term) =>
      fields.some((f) => f != null && f.toLowerCase().includes(term))
    );
  });
}