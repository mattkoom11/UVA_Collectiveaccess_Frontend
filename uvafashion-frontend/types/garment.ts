// Era types from the prompt
export type Era = 'pre-1920' | '1920-1950' | '1950-1980' | '1980+';

// Garment types mapped from CollectiveAccess Object Types list
export type GarmentType =
  | 'dress'
  | 'coat'
  | 'jacket'
  | 'suit'
  | 'shirt-blouse'
  | 'skirt'
  | 'pants-trousers'
  | 'undergarment'
  | 'headwear'
  | 'footwear'
  | 'accessory'
  | 'jewelry'
  | 'outerwear'
  | 'ensemble'
  | 'swimwear'
  | 'uniform'
  | 'non-western'
  | 'textile'
  | 'other';

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
    const parsed = parseInt(date, 10);
    if (!isNaN(parsed)) year = parsed;
  } else if (decade) {
    const match = decade.match(/(\d{4})s/);
    if (match) {
      year = parseInt(match[1], 10);
    }
  }
  
  if (!year) return undefined;
  
  if (year < 1920) return 'pre-1920';
  if (year < 1950) return '1920-1950';
  if (year < 1980) return '1950-1980';
  return '1980+';
}

// Helper function to convert CA type label to GarmentType
export function getGarmentTypeFromWorkType(work_type?: string): GarmentType {
  if (!work_type) return 'other';
  const n = work_type.toLowerCase().trim();

  // Exact matches first
  const exact: Record<string, GarmentType> = {
    'dress': 'dress',
    'blue jeans': 'pants-trousers',
    'dress slacks': 'pants-trousers',
    'pants': 'pants-trousers',
    'trouser': 'pants-trousers',
    'skirt': 'skirt',
    'blouse': 'shirt-blouse',
    'shirt or blouse': 'shirt-blouse',
    'work shirt': 'shirt-blouse',
    'overcoat': 'coat',
    'outerwear': 'outerwear',
    'cape': 'outerwear',
    'shawl': 'outerwear',
    'robe': 'outerwear',
    'jacket': 'jacket',
    'suit jacket': 'jacket',
    'smoking jacket': 'jacket',
    'sports coat': 'jacket',
    'blazer': 'jacket',
    'suit': 'suit',
    "men's and women's suit": 'suit',
    'ensemble': 'ensemble',
    'combination garment': 'ensemble',
    'uniform': 'uniform',
    'military garment': 'uniform',
    'occupational garment': 'uniform',
    'jumpsuit': 'suit',
    'sweater': 'shirt-blouse',
    'vest': 'shirt-blouse',
    'bodice': 'shirt-blouse',
    'camisole': 'undergarment',
    'slip': 'undergarment',
    'petticoat': 'undergarment',
    'corset cover': 'undergarment',
    'bustle support': 'undergarment',
    'panties': 'undergarment',
    'bloomer': 'undergarment',
    'undergarment': 'undergarment',
    'sock': 'footwear',
    'shoe': 'footwear',
    'boot': 'footwear',
    'slipper': 'footwear',
    'shoe clip': 'accessory',
    'hat': 'headwear',
    'bonnet': 'headwear',
    'fascinator': 'headwear',
    'headwear': 'headwear',
    'head scarf': 'headwear',
    'jewelry': 'jewelry',
    'necklace': 'jewelry',
    'earring': 'jewelry',
    'bracelet': 'jewelry',
    'pin': 'jewelry',
    'bow tie': 'accessory',
    'tie': 'accessory',
    'belt': 'accessory',
    'glove': 'accessory',
    'purse': 'accessory',
    'accessory': 'accessory',
    'notion': 'accessory',
    'ribbon': 'accessory',
    'bustle support': 'undergarment',
    'garment': 'other',
    'pajama': 'undergarment',
    'swimsuit': 'swimwear',
    'non-western garment': 'non-western',
    'textile piece': 'textile',
    'textile': 'textile',
  };
  if (exact[n]) return exact[n];

  // Fallback substring matches
  if (n.includes('dress') || n.includes('gown') || n.includes('frock')) return 'dress';
  if (n.includes('skirt')) return 'skirt';
  if (n.includes('pant') || n.includes('trouser') || n.includes('jean')) return 'pants-trousers';
  if (n.includes('shirt') || n.includes('blouse') || n.includes('sweater') || n.includes('top')) return 'shirt-blouse';
  if (n.includes('overcoat') || n.includes('cape') || n.includes('shawl') || n.includes('wrap') || n.includes('robe')) return 'outerwear';
  if (n.includes('coat')) return 'coat';
  if (n.includes('jacket') || n.includes('blazer')) return 'jacket';
  if (n.includes('suit') || n.includes('ensemble')) return 'suit';
  if (n.includes('uniform') || n.includes('military') || n.includes('occupational')) return 'uniform';
  if (n.includes('under') || n.includes('corset') || n.includes('slip') || n.includes('camisole') || n.includes('petticoat')) return 'undergarment';
  if (n.includes('hat') || n.includes('bonnet') || n.includes('head') || n.includes('fascinator')) return 'headwear';
  if (n.includes('shoe') || n.includes('boot') || n.includes('sock') || n.includes('slipper')) return 'footwear';
  if (n.includes('jewel') || n.includes('necklace') || n.includes('earring') || n.includes('bracelet')) return 'jewelry';
  if (n.includes('accessory') || n.includes('bag') || n.includes('purse') || n.includes('belt') || n.includes('glove') || n.includes('tie') || n.includes('scarf')) return 'accessory';
  if (n.includes('swim') || n.includes('bathing')) return 'swimwear';
  if (n.includes('non-western') || n.includes('ethnic')) return 'non-western';
  if (n.includes('textile')) return 'textile';
  return 'other';
}
