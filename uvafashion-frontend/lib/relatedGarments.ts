import { Garment } from "@/types/garment";
import { getEraFromDecade, getGarmentTypeFromWorkType } from "@/types/garment";

/**
 * Calculate similarity score between two garments
 * Returns a score from 0-1, where 1 is most similar
 */
function calculateSimilarity(garment1: Garment, garment2: Garment): number {
  let score = 0;
  let maxScore = 0;

  // Era similarity (weight: 0.3)
  maxScore += 0.3;
  const era1 = garment1.era || getEraFromDecade(garment1.decade, garment1.yearApprox, garment1.date);
  const era2 = garment2.era || getEraFromDecade(garment2.decade, garment2.yearApprox, garment2.date);
  if (era1 && era2 && era1 === era2) {
    score += 0.3;
  }

  // Type similarity (weight: 0.25)
  maxScore += 0.25;
  const type1 = garment1.type || getGarmentTypeFromWorkType(garment1.work_type);
  const type2 = garment2.type || getGarmentTypeFromWorkType(garment2.work_type);
  if (type1 && type2 && type1 === type2) {
    score += 0.25;
  }

  // Color similarity (weight: 0.2)
  maxScore += 0.2;
  if (garment1.colors && garment2.colors && garment1.colors.length > 0 && garment2.colors.length > 0) {
    const colors1 = new Set(garment1.colors.map(c => c.toLowerCase()));
    const colors2 = new Set(garment2.colors.map(c => c.toLowerCase()));
    const commonColors = Array.from(colors1).filter(c => colors2.has(c));
    if (commonColors.length > 0) {
      score += 0.2 * (commonColors.length / Math.max(colors1.size, colors2.size));
    }
  }

  // Material similarity (weight: 0.15)
  maxScore += 0.15;
  const materials1 = Array.isArray(garment1.materials) 
    ? garment1.materials.map(m => m.toLowerCase())
    : garment1.materials ? [garment1.materials.toLowerCase()] : [];
  const materials2 = Array.isArray(garment2.materials)
    ? garment2.materials.map(m => m.toLowerCase())
    : garment2.materials ? [garment2.materials.toLowerCase()] : [];
  if (materials1.length > 0 && materials2.length > 0) {
    const materials1Set = new Set(materials1);
    const materials2Set = new Set(materials2);
    const commonMaterials = Array.from(materials1Set).filter(m => materials2Set.has(m));
    if (commonMaterials.length > 0) {
      score += 0.15 * (commonMaterials.length / Math.max(materials1Set.size, materials2Set.size));
    }
  }

  // Decade proximity (weight: 0.1)
  maxScore += 0.1;
  if (garment1.decade && garment2.decade) {
    const decade1 = parseInt(garment1.decade.replace('s', ''));
    const decade2 = parseInt(garment2.decade.replace('s', ''));
    if (!isNaN(decade1) && !isNaN(decade2)) {
      const decadeDiff = Math.abs(decade1 - decade2);
      if (decadeDiff === 0) {
        score += 0.1;
      } else if (decadeDiff <= 10) {
        score += 0.05; // Same decade or adjacent
      }
    }
  }

  return score / maxScore;
}

/**
 * Get related garments based on similarity algorithm
 * Returns up to `limit` garments, sorted by similarity score
 */
export function getRelatedGarments(
  garment: Garment,
  allGarments: Garment[],
  limit: number = 4
): Garment[] {
  // Exclude the current garment and any explicitly related garments
  const candidates = allGarments.filter(
    g => g.id !== garment.id && !garment.relatedIds?.includes(g.id)
  );

  // Calculate similarity scores
  const scored = candidates.map(g => ({
    garment: g,
    score: calculateSimilarity(garment, g)
  }));

  // Sort by score (descending) and take top results
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.garment);
}

/**
 * Get related garments, prioritizing explicit relations, then algorithm-based
 */
export function getEnhancedRelatedGarments(
  garment: Garment,
  allGarments: Garment[],
  limit: number = 4
): Garment[] {
  const explicitRelated: Garment[] = [];
  const algorithmRelated: Garment[] = [];

  // First, get explicitly related garments
  if (garment.relatedIds && garment.relatedIds.length > 0) {
    garment.relatedIds.forEach(id => {
      const related = allGarments.find(g => g.id === id);
      if (related) explicitRelated.push(related);
    });
  }

  // Then, get algorithm-based recommendations (excluding explicit ones)
  const remainingLimit = Math.max(0, limit - explicitRelated.length);
  if (remainingLimit > 0) {
    const excludeIds = new Set([garment.id, ...(garment.relatedIds || [])]);
    const candidates = allGarments.filter(g => !excludeIds.has(g.id));
    algorithmRelated.push(...getRelatedGarments(garment, candidates, remainingLimit));
  }

  return [...explicitRelated, ...algorithmRelated].slice(0, limit);
}

