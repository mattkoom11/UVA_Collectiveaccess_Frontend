export interface Garment {
  id: string;
  title: string;
  year: string;
  designer: string;
  collection: string;
  accessionNumber: string;
  primaryImage: string;
  detailImages: string[];
  silhouette: string;
  materials: string[];
  colors: string[];
  eraStory: string;
  narrative: string;
  condition: string;
  tags: string[];
}

export const sampleGarments: Garment[] = [
  {
    id: "G-0001",
    title: "The Midnight Ball Gown",
    year: "1958",
    designer: "Charles James",
    collection: "Evening Wear Collection",
    accessionNumber: "UVA-1958-001",
    primaryImage: "/sample/garments/midnight-gown-primary.jpg",
    detailImages: [
      "/sample/garments/midnight-gown-detail-1.jpg",
      "/sample/garments/midnight-gown-detail-2.jpg",
      "/sample/garments/midnight-gown-detail-3.jpg",
      "/sample/garments/midnight-gown-detail-4.jpg",
      "/sample/garments/midnight-gown-detail-5.jpg",
    ],
    silhouette: "A-line with structured bodice",
    materials: ["silk taffeta", "silk organza", "horsehair", "satin"],
    colors: ["midnight blue", "navy", "silver"],
    eraStory: "The late 1950s marked a golden age of American couture, where designers like Charles James pushed the boundaries of architectural fashion. This era saw the rise of the New Look's influence, with emphasis on structured silhouettes and luxurious materials that spoke to post-war optimism and newfound prosperity.",
    narrative: "In the dim light of a grand ballroom, this gown would have commanded attention. The midnight blue silk taffeta catches the light like a starry night sky, each fold carefully engineered to create a sense of movement and grace. The structured bodice, reinforced with horsehair and silk organza, creates a foundation that speaks to the architectural genius of its creator. This is not merely a dress—it is a sculpture in motion, a testament to the art of couture where every seam tells a story of precision and passion. The silver accents that trace the neckline and hemline shimmer like constellations, guiding the eye along the garment's elegant lines. Worn by a woman of means and taste, this gown would have been the centerpiece of an evening, a declaration of sophistication and style that transcended the ordinary.",
    condition: "Excellent - minor wear to hemline",
    tags: ["evening wear", "couture", "1950s", "ball gown", "silk", "structured", "spring"],
  },
  {
    id: "G-0002",
    title: "Flapper's Delight",
    year: "1925",
    designer: "Unknown",
    collection: "Jazz Age Collection",
    accessionNumber: "UVA-1925-002",
    primaryImage: "/sample/garments/flapper-dress-primary.jpg",
    detailImages: [
      "/sample/garments/flapper-dress-detail-1.jpg",
      "/sample/garments/flapper-dress-detail-2.jpg",
    ],
    silhouette: "Dropped waist, straight cut",
    materials: ["silk chiffon", "glass beads", "fringe"],
    colors: ["black", "white", "silver"],
    eraStory: "The 1920s revolutionized women's fashion, liberating silhouettes from the restrictive corsets of previous decades. The flapper dress became a symbol of the Jazz Age, representing freedom, modernity, and the changing role of women in society.",
    narrative: "This flapper dress captures the essence of the Roaring Twenties—a time when women cut their hair, raised their hemlines, and danced the Charleston. The intricate beading catches the light of speakeasy chandeliers, while the fringe sways with every movement, creating a sense of kinetic energy and liberation. This garment would have been worn by a modern woman, someone who embraced the new freedoms of the era.",
    condition: "Good - some bead loss",
    tags: ["1920s", "flapper", "evening wear", "jazz age", "beaded", "black", "white", "spring"],
  },
  {
    id: "G-0003",
    title: "The Garden Party Dress",
    year: "1962",
    designer: "Oscar de la Renta",
    collection: "Day Wear Collection",
    accessionNumber: "UVA-1962-003",
    primaryImage: "/sample/garments/garden-party-primary.jpg",
    detailImages: [
      "/sample/garments/garden-party-detail-1.jpg",
      "/sample/garments/garden-party-detail-2.jpg",
    ],
    silhouette: "A-line, knee-length",
    materials: ["cotton", "silk", "lace"],
    colors: ["ivory", "pink", "green"],
    eraStory: "The early 1960s brought a fresh, youthful energy to fashion. Designers like Oscar de la Renta created elegant daywear that balanced sophistication with a sense of playfulness, perfect for the garden parties and social events of the era.",
    narrative: "This garden party dress embodies the refined elegance of early 1960s daywear. The delicate floral pattern and soft pastels evoke images of afternoon tea and garden parties, where women gathered to socialize in beautifully crafted garments. The A-line silhouette flatters the figure while allowing for ease of movement—essential for a day spent in gardens and drawing rooms.",
    condition: "Excellent",
    tags: ["1960s", "day wear", "garden party", "floral", "spring", "pastel"],
  },
  {
    id: "G-0004",
    title: "The Evening Cape",
    year: "1930",
    designer: "Madeleine Vionnet",
    collection: "Evening Wear Collection",
    accessionNumber: "UVA-1930-004",
    primaryImage: "/sample/garments/evening-cape-primary.jpg",
    detailImages: [
      "/sample/garments/evening-cape-detail-1.jpg",
    ],
    silhouette: "Draped, flowing",
    materials: ["velvet", "silk lining"],
    colors: ["black", "navy"],
    eraStory: "The 1930s saw a return to elegance after the exuberance of the 1920s. Designers like Madeleine Vionnet created garments that emphasized the natural form through bias cutting and elegant draping.",
    narrative: "This evening cape represents the sophisticated glamour of 1930s evening wear. The rich black velvet drapes elegantly over the shoulders, creating a sense of mystery and refinement. Worn over an evening gown, this cape would have been the finishing touch for a night at the opera or a formal dinner party.",
    condition: "Very good - minor wear to lining",
    tags: ["1930s", "evening wear", "cape", "velvet", "black", "winter"],
  },
];

