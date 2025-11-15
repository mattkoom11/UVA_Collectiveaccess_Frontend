export interface Garment {
  id: string;
  slug: string;
  label: string;
  decade?: string;
  date?: string;
  work_type?: string;
  colors?: string[];
  materials?: string[];
  function?: string[];
  gender?: string;
  age?: string;
  condition?: string;
  description?: string;
  images: string[];
  // Editorial/Vogue-style fields
  editorial_title?: string; // Eye-catching headline
  editorial_subtitle?: string; // Poetic tagline
  aesthetic_description?: string; // Rich, evocative prose
  story?: string; // Narrative about the garment
  inspiration?: string; // What inspired this piece
  context?: string; // Historical/social context
  model3d_url?: string; // URL to photogrammetry 3D model
}
