import { Garment, Era, GarmentType, getEraFromDecade, getGarmentTypeFromWorkType } from "@/types/garment";

export function filterGarments(
  items: Garment[],
  filters: {
    decade?: string;
    work_type?: string;
    color?: string;
    material?: string;
    era?: Era;
    type?: GarmentType;
  }
): Garment[] {
  return items.filter((g) => {
    if (filters.decade && g.decade !== filters.decade) return false;
    if (filters.work_type && g.work_type !== filters.work_type) return false;
    if (
      filters.color &&
      !(g.colors || []).map((c) => c.toLowerCase()).includes(filters.color.toLowerCase())
    )
      return false;

    if (filters.material) {
      const garmentMaterials = (g.materials ?? []).map((m) => m.toLowerCase());
      if (!garmentMaterials.includes(filters.material.toLowerCase())) return false;
    }

    if (filters.era) {
      const garmentEra = g.era || getEraFromDecade(g.decade, g.yearApprox, g.date);
      if (garmentEra !== filters.era) return false;
    }

    if (filters.type) {
      const garmentType = g.type || getGarmentTypeFromWorkType(g.work_type);
      if (garmentType !== filters.type) return false;
    }

    return true;
  });
}
