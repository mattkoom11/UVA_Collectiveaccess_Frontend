import garmentsData from "@/data/garments.json";
import { Garment, Era, GarmentType, getEraFromDecade, getGarmentTypeFromWorkType } from "@/types/garment";
import { syncGarmentsFromCA } from "@/lib/collectiveAccess";

let caGarmentsCache: Garment[] | null = null;

/**
 * When NEXT_PUBLIC_CA_BASE_URL is set, populate cache from CollectiveAccess so getAllGarments() can return CA data.
 * Call once per request (e.g. in root layout); subsequent getAllGarments() calls use the cache.
 */
export async function hydrateGarmentsFromCA(): Promise<void> {
  if (!process.env.NEXT_PUBLIC_CA_BASE_URL) return;
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

export function getAllGarments(): Garment[] {
  if (process.env.NEXT_PUBLIC_CA_BASE_URL && caGarmentsCache != null) {
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

// Search function - searches across multiple fields
export function searchGarments(
  items: Garment[],
  query: string
): Garment[] {
  if (!query || query.trim().length === 0) {
    return items;
  }

  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  
  return items.filter((g) => {
    // Collect all searchable text fields
    const searchableText = [
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
      // Materials (handle both string and array)
      Array.isArray(g.materials) ? g.materials.join(" ") : g.materials,
      // Colors
      g.colors?.join(" "),
    ]
      .filter(Boolean)
      .map((text) => text?.toLowerCase() || "")
      .join(" ");

    // Check if all search terms appear in the searchable text
    return searchTerms.every((term) => searchableText.includes(term));
  });
}