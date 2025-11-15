import garmentsData from "@/data/garments.json";
import { Garment } from "@/types/garment";

export function getAllGarments(): Garment[] {
  return garmentsData as Garment[];
}

export function getGarmentBySlug(slug: string): Garment | undefined {
  return getAllGarments().find((g) => g.slug === slug);
}

export function filterGarments(
  items: Garment[],
  filters: { decade?: string; work_type?: string; color?: string }
): Garment[] {
  return items.filter((g) => {
    if (filters.decade && g.decade !== filters.decade) return false;
    if (filters.work_type && g.work_type !== filters.work_type) return false;
    if (
      filters.color &&
      !(g.colors || []).map((c) => c.toLowerCase()).includes(filters.color.toLowerCase())
    )
      return false;
    return true;
  });
}
