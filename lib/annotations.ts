import { Annotation } from "@/components/garments/ModelAnnotations";
import { Garment } from "@/types/garment";

/**
 * Generate annotations for a garment based on its metadata
 */
export function generateGarmentAnnotations(garment: Garment): Annotation[] {
  const annotations: Annotation[] = [];

  // Material annotations
  if (garment.materials) {
    const materials = Array.isArray(garment.materials) 
      ? garment.materials 
      : [garment.materials];
    
    materials.forEach((material, index) => {
      annotations.push({
        id: `material-${index}`,
        position: [0.5 + index * 0.3, 0.8, -0.3],
        title: `Material: ${material}`,
        description: `This garment features ${material.toLowerCase()} construction. ${getMaterialDescription(material)}`,
        category: "material",
      });
    });
  }

  // Construction details
  if (garment.work_type) {
    annotations.push({
      id: "construction",
      position: [0, 1.2, 0],
      title: "Construction Type",
      description: `This is a ${garment.work_type.toLowerCase()}, representing typical construction techniques of the ${garment.era || garment.decade || "period"}.`,
      category: "construction",
    });
  }

  // Historical context
  if (garment.decade || garment.era) {
    annotations.push({
      id: "historical",
      position: [-0.5, 0.5, 0.5],
      title: "Historical Period",
      description: `Dating from the ${garment.decade || garment.era}, this garment reflects the fashion trends and social context of its time.`,
      category: "history",
    });
  }

  // Condition notes
  if (garment.condition) {
    annotations.push({
      id: "condition",
      position: [0.5, 0.3, 0.5],
      title: "Condition",
      description: `Current condition: ${garment.condition}. This affects how the garment is displayed and preserved.`,
      category: "detail",
    });
  }

  return annotations;
}

function getMaterialDescription(material: string): string {
  const descriptions: Record<string, string> = {
    silk: "Silk is a luxurious natural fiber known for its smooth texture and natural sheen.",
    wool: "Wool provides excellent insulation and durability, making it ideal for outerwear.",
    cotton: "Cotton is a breathable natural fiber commonly used in everyday garments.",
    linen: "Linen is a strong, cool fabric made from flax, popular in warm weather clothing.",
    satin: "Satin is a smooth, glossy fabric with a distinctive sheen on one side.",
    velvet: "Velvet is a plush fabric with a dense pile, associated with luxury and elegance.",
  };

  return descriptions[material.toLowerCase()] || "This material contributes to the garment's unique characteristics.";
}
