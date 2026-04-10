import { Garment } from "@/types/garment";
import { Era } from "@/types/garment";

export interface CollectionStatistics {
  total: number;
  byEra: Record<string, number>;
  byType: Record<string, number>;
  byMaterial: Record<string, number>;
  byColor: Record<string, number>;
  byDecade: Record<string, number>;
  dateRange: {
    earliest?: number;
    latest?: number;
  };
  topMaterials: Array<{ material: string; count: number }>;
  topColors: Array<{ color: string; count: number }>;
}

export function calculateStatistics(garments: Garment[]): CollectionStatistics {
  const stats: CollectionStatistics = {
    total: garments.length,
    byEra: {},
    byType: {},
    byMaterial: {},
    byColor: {},
    byDecade: {},
    dateRange: {},
    topMaterials: [],
    topColors: [],
  };

  const years: number[] = [];
  const materialCounts: Record<string, number> = {};
  const colorCounts: Record<string, number> = {};

  garments.forEach((garment) => {
    // Count by era
    if (garment.era) {
      stats.byEra[garment.era] = (stats.byEra[garment.era] || 0) + 1;
    }

    // Count by type
    const type = garment.work_type || garment.type || "other";
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    // Count by decade
    if (garment.decade) {
      stats.byDecade[garment.decade] = (stats.byDecade[garment.decade] || 0) + 1;
    }

    // Extract year for date range
    const year = garment.yearApprox || 
      (garment.date ? parseInt(garment.date, 10) : undefined) ||
      (garment.decade ? parseInt(garment.decade.replace('s', ''), 10) : undefined);
    if (year && !isNaN(year)) {
      years.push(year);
    }

    // Count materials
    if (garment.materials) {
      const materials = Array.isArray(garment.materials) 
        ? garment.materials 
        : [garment.materials];
      materials.forEach((material) => {
        const key = material.toLowerCase();
        materialCounts[key] = (materialCounts[key] || 0) + 1;
      });
    }

    // Count colors
    if (garment.colors) {
      const colors = Array.isArray(garment.colors) 
        ? garment.colors 
        : [garment.colors];
      colors.forEach((color) => {
        const key = color.toLowerCase();
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      });
    }
  });

  // Calculate date range
  if (years.length > 0) {
    stats.dateRange.earliest = Math.min(...years);
    stats.dateRange.latest = Math.max(...years);
  }

  // Top materials
  stats.topMaterials = Object.entries(materialCounts)
    .map(([material, count]) => ({ material, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top colors
  stats.topColors = Object.entries(colorCounts)
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return stats;
}

