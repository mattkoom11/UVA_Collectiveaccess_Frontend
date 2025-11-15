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
}
