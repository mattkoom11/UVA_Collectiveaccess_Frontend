import garmentsData from "@/data/garments.json";
import { Garment, Era, GarmentType, getEraFromDecade, getGarmentTypeFromWorkType } from "@/types/garment";
import { syncGarmentsFromCA } from "@/lib/collectiveAccess";

let caGarmentsCache: Garment[] | null = null;

/**
 * When NEXT_PUBLIC_CA_BASE_URL is set, populate cache from CollectiveAccess so getAllGarments() can return CA data.
 * Call once per request (e.g. in root layout); subsequent getAllGarments() calls use the cache.
 */
export async function hydrateGarmentsFromCA(): Promise<void> {
  const baseUrl = process.env.CA_BASE_URL || process.env.NEXT_PUBLIC_CA_BASE_URL;
  if (!baseUrl) return;
  if (caGarmentsCache != null) return;
  try {
    const raw = await syncGarmentsFromCA(500);
    caGarmentsCache = raw.map((g) => ({
      ...g,
      images: Array.isArray(g.images) ? g.images : g.images ? [g.images] : [],
    })) as Garment[];
  } catch (e) {
    console.error("CollectiveAccess hydrate failed, using static data:", e);
  }
}

/** Used by server-only API (e.g. admin sync) to update cache after a CA sync. */
export function setCAGarmentsCache(garments: Garment[] | null): void {
  caGarmentsCache = garments;
}

export function getAllGarments(): Garment[] {
  const baseUrl = process.env.CA_BASE_URL || process.env.NEXT_PUBLIC_CA_BASE_URL;
  if (baseUrl && caGarmentsCache != null) {
    return caGarmentsCache;
  }
  return garmentsData as Garment[];
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
      const garmentMaterials = Array.isArray(g.materials) 
        ? g.materials.map(m => m.toLowerCase())
        : g.materials ? [g.materials.toLowerCase()] : [];
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
      Array.isArray(g.materials) ? g.materials.join(" ") : g.materials,
      g.colors?.join(" "),
    ];

    return searchTerms.every((term) =>
      fields.some((f) => f != null && f.toLowerCase().includes(term))
    );
  });
}