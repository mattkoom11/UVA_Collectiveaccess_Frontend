import { Garment } from "./sampleGarments";

export interface Show {
  id: string;
  title: string;
  description?: string;
  filter: (garment: Garment) => boolean;
}

export const shows: Show[] = [
  {
    id: "jazz-age",
    title: "1920s Jazz Age",
    description: "A celebration of the Roaring Twenties, featuring flapper dresses and the revolutionary styles that defined an era of liberation and modernity.",
    filter: (garment: Garment) => {
      return garment.tags.some(tag => tag.toLowerCase().includes("1920s")) ||
             garment.tags.some(tag => tag.toLowerCase().includes("jazz age")) ||
             garment.tags.some(tag => tag.toLowerCase().includes("flapper"));
    },
  },
  {
    id: "evening-wear",
    title: "Evening Wear",
    description: "Elegant evening garments that graced grand ballrooms and formal occasions, showcasing the height of couture craftsmanship.",
    filter: (garment: Garment) => {
      return garment.tags.some(tag => tag.toLowerCase().includes("evening wear")) ||
             garment.collection.toLowerCase().includes("evening");
    },
  },
  {
    id: "black-white",
    title: "Black & White",
    description: "A monochromatic collection exploring the timeless elegance of black and white in fashion design.",
    filter: (garment: Garment) => {
      const colorLower = garment.colors.map(c => c.toLowerCase());
      return colorLower.includes("black") && colorLower.includes("white");
    },
  },
  {
    id: "spring-showcase",
    title: "Spring Showcase",
    description: "Fresh, vibrant pieces perfect for springtime, featuring light fabrics, floral patterns, and pastel palettes.",
    filter: (garment: Garment) => {
      return garment.tags.some(tag => tag.toLowerCase().includes("spring"));
    },
  },
];

export function getShowById(id: string): Show | undefined {
  return shows.find(show => show.id === id);
}

export function getGarmentsForShow(show: Show, garments: Garment[]): Garment[] {
  return garments.filter(show.filter);
}

