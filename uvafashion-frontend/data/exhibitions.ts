import { Garment } from "@/types/garment";

export interface Exhibition {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  curator?: string;
  startDate?: string;
  endDate?: string;
  garmentIds: string[];
  imageUrl?: string;
  featured?: boolean;
}

export const sampleExhibitions: Exhibition[] = [
  {
    id: "ex-001",
    title: "The Roaring Twenties",
    subtitle: "Fashion in the Jazz Age",
    description: "Explore the bold and revolutionary fashion of the 1920s, a decade that redefined women's style with shorter hemlines, dropped waists, and a new sense of freedom.",
    curator: "Dr. Jane Smith",
    startDate: "2024-01-01",
    garmentIds: ["G-0001", "G-0002"],
    featured: true,
  },
  {
    id: "ex-002",
    title: "Mid-Century Elegance",
    subtitle: "1950s Fashion Revival",
    description: "Discover the sophisticated silhouettes and refined elegance of 1950s fashion, featuring hourglass shapes and luxurious materials.",
    curator: "Dr. John Doe",
    startDate: "2024-02-01",
    garmentIds: ["G-0003", "G-0004", "G-0005"],
    featured: true,
  },
];

