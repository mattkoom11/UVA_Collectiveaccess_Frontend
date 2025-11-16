import garmentsData from "@/data/garments.json";
import { Garment, Era, GarmentType, getEraFromDecade, getGarmentTypeFromWorkType } from "@/types/garment";

export function getAllGarments(): Garment[] {
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
