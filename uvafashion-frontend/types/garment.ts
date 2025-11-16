// Era types from the prompt
export type Era = 'pre-1920' | '1920-1950' | '1950-1980' | '1980+';

// Garment types from the prompt
export type GarmentType = 'dress' | 'coat' | 'accessory' | 'suit' | 'jacket' | 'other';

export interface Garment {
  id: string;
  slug: string;
  label: string;
  name?: string; // New: primary name field
  decade?: string;
  date?: string;
  yearApprox?: number; // New: approximate year
  era?: Era; // New: era categorization
  work_type?: string;
  type?: GarmentType; // New: garment type from prompt
  colors?: string[];
  materials?: string | string[]; // Support both string and array for backward compatibility
  function?: string[];
  gender?: string;
  age?: string;
  condition?: string;
  description?: string;
  images: string[];
  
  // Editorial/Vogue-style fields (existing)
  editorial_title?: string; // Eye-catching headline
  editorial_subtitle?: string; // Poetic tagline
  aesthetic_description?: string; // Rich, evocative prose
  story?: string; // Narrative about the garment
  inspiration?: string; // What inspired this piece
  context?: string; // Historical/social context
  model3d_url?: string; // URL to photogrammetry 3D model
  
  // New fields from prompt
  tagline?: string; // Short 1-2 sentence editorial hook
  curatorNote?: string; // Curator's note (italicized paragraph)
  accessionNumber?: string; // Museum accession number
  collection?: string; // Collection name (e.g., "UVA Historic Clothing Collection")
  provenance?: string; // Provenance information
  dimensions?: string; // Physical dimensions
  imageUrl?: string; // Primary image URL
  modelUrl?: string; // GLTF/GLB URL (alias for model3d_url)
  thumbnailUrl?: string; // Thumbnail image URL
  relatedIds?: string[]; // IDs of related garments
  
  // Helper method to get era from decade or year
  // This will be used to map existing data to new era format
}

// Helper function to convert decade/date to Era
export function getEraFromDecade(decade?: string, yearApprox?: number, date?: string, era?: Era): Era | undefined {
  if (era) return era;
  
  let year: number | undefined;
  
  if (yearApprox) {
    year = yearApprox;
  } else if (date) {
    const parsed = parseInt(date);
    if (!isNaN(parsed)) year = parsed;
  } else if (decade) {
    const match = decade.match(/(\d{4})s/);
    if (match) {
      year = parseInt(match[1]);
    }
  }
  
  if (!year) return undefined;
  
  if (year < 1920) return 'pre-1920';
  if (year < 1950) return '1920-1950';
  if (year < 1980) return '1950-1980';
  return '1980+';
}

// Helper function to convert work_type to GarmentType
export function getGarmentTypeFromWorkType(work_type?: string): GarmentType {
  if (!work_type) return 'other';
  const normalized = work_type.toLowerCase();
  if (normalized.includes('dress')) return 'dress';
  if (normalized.includes('coat')) return 'coat';
  if (normalized.includes('jacket')) return 'jacket';
  if (normalized.includes('suit')) return 'suit';
  if (normalized.includes('accessory') || normalized.includes('bag') || normalized.includes('hat') || normalized.includes('shoe')) return 'accessory';
  return 'other';
}
