export interface EducationalContent {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  category: "era" | "material" | "technique" | "history";
  relatedEras?: string[];
  relatedMaterials?: string[];
  imageUrl?: string;
}

export const educationalContent: EducationalContent[] = [
  {
    id: "era-pre-1920",
    title: "Pre-1920s Fashion",
    subtitle: "The Edwardian Era and Early 20th Century",
    category: "era",
    relatedEras: ["pre-1920"],
    content: `The pre-1920s era marked the end of the Victorian age and the beginning of modern fashion. Women's clothing was characterized by:

- **Corseted silhouettes**: Tight-laced corsets created the iconic S-curve silhouette
- **High collars and long skirts**: Modesty was paramount, with floor-length skirts and high necklines
- **Luxurious materials**: Silk, satin, and lace were favored by the upper classes
- **Layered construction**: Multiple petticoats and undergarments created volume
- **Hand-sewn details**: Intricate embroidery, beading, and lacework were common

This era saw the transition from handmade to machine-made clothing, though high-end garments still featured extensive handwork. The influence of the Arts and Crafts movement can be seen in the attention to detail and quality of construction.`,
  },
  {
    id: "era-1920-1950",
    title: "1920s-1950s Fashion",
    subtitle: "From Flappers to New Look",
    category: "era",
    relatedEras: ["1920-1950"],
    content: `This period encompasses dramatic shifts in fashion:

**The 1920s (Jazz Age)**:
- Dropped waists and straight silhouettes
- Shorter hemlines (knee-length)
- Art Deco influences
- Cloche hats and bobbed hair
- Emphasis on youth and freedom

**The 1930s (Depression Era)**:
- Bias-cut dresses for fluid movement
- Return to more fitted silhouettes
- Economic constraints led to creative reuse
- Hollywood glamour influenced evening wear

**The 1940s (War Years)**:
- Utility clothing with rationing restrictions
- Shoulder pads and structured suits
- Practical, durable materials
- Make-do-and-mend philosophy

**The 1950s (Post-War)**:
- Christian Dior's "New Look" with full skirts
- Hourglass silhouettes with cinched waists
- Feminine elegance and luxury
- Rise of ready-to-wear fashion`,
  },
  {
    id: "material-silk",
    title: "Silk",
    subtitle: "The Queen of Textiles",
    category: "material",
    relatedMaterials: ["silk"],
    content: `Silk has been prized for thousands of years for its luxurious feel, natural sheen, and versatility.

**Properties**:
- Natural protein fiber from silkworm cocoons
- Smooth, lustrous surface
- Strong yet lightweight
- Excellent drape and flow
- Temperature regulating

**Historical Significance**:
- Originated in ancient China (c. 3000 BCE)
- Traded along the Silk Road
- Symbol of wealth and status
- Used in everything from undergarments to formal wear

**Care and Preservation**:
- Delicate and requires careful handling
- Susceptible to light damage
- Should be stored flat or rolled
- Professional cleaning recommended

**In Fashion**:
Silk has been used for evening gowns, wedding dresses, lingerie, and accessories. Its versatility allows it to be woven into various weights and textures, from delicate chiffon to heavy brocade.`,
  },
  {
    id: "material-wool",
    title: "Wool",
    subtitle: "Nature's Insulator",
    category: "material",
    relatedMaterials: ["wool"],
    content: `Wool is one of the oldest and most versatile natural fibers, known for its warmth and durability.

**Properties**:
- Natural protein fiber from sheep and other animals
- Excellent insulation (warm in winter, cool in summer)
- Naturally water-resistant
- Elastic and resilient
- Wrinkle-resistant

**Types**:
- **Merino**: Fine, soft, premium quality
- **Worsted**: Smooth, tightly spun
- **Tweed**: Coarse, textured, traditional
- **Cashmere**: Ultra-soft, from cashmere goats

**Historical Use**:
Wool has been used for outerwear, suits, dresses, and accessories throughout history. Its durability made it essential for everyday wear, while fine wools were used for formal attire.

**Care**:
- Can be hand-washed or dry-cleaned
- Prone to shrinking if not handled carefully
- Should be stored with moth protection
- Can be felted if exposed to heat and agitation`,
  },
  {
    id: "technique-embroidery",
    title: "Embroidery",
    subtitle: "Decorative Stitching Through the Ages",
    category: "technique",
    content: `Embroidery is the art of decorating fabric with needle and thread, creating intricate patterns and designs.

**Historical Techniques**:
- **Hand embroidery**: Traditional method using various stitches
- **Machine embroidery**: Industrial revolution innovation
- **Beadwork**: Adding beads and sequins for embellishment
- **Appliqué**: Attaching fabric pieces to create designs

**Common Stitches**:
- Satin stitch for smooth fills
- Chain stitch for outlines
- French knots for texture
- Cross-stitch for geometric patterns

**Cultural Significance**:
Embroidery has been used across cultures to:
- Display wealth and status
- Tell stories and preserve traditions
- Create unique, personalized garments
- Add beauty and artistry to functional clothing

**In the Collection**:
Many garments in the archive feature exquisite embroidery, from delicate floral patterns to elaborate beaded designs, showcasing the skill and artistry of their makers.`,
  },
  {
    id: "history-fashion-evolution",
    title: "Fashion Evolution",
    subtitle: "How Clothing Reflects Society",
    category: "history",
    content: `Fashion is not just about clothing—it's a reflection of social, economic, and cultural changes.

**Key Influences**:

1. **Social Movements**: Women's suffrage, civil rights, and youth culture all influenced fashion
2. **Economic Conditions**: Depressions and prosperity shaped what people could afford
3. **Technological Advances**: New fabrics, manufacturing methods, and transportation
4. **World Events**: Wars, migrations, and global exchanges
5. **Art and Design**: Art movements like Art Deco, Modernism, and Pop Art

**The Role of Museums**:
Fashion archives preserve these cultural artifacts, allowing us to:
- Study construction techniques
- Understand historical context
- Preserve craftsmanship
- Inspire contemporary design
- Educate future generations

**Why It Matters**:
Every garment tells a story about its time, its maker, and its wearer. By studying historic fashion, we gain insights into human creativity, social structures, and cultural values.`,
  },
];

export function getEducationalContentByCategory(category: EducationalContent["category"]) {
  return educationalContent.filter((content) => content.category === category);
}

export function getEducationalContentById(id: string) {
  return educationalContent.find((content) => content.id === id);
}

export function getEducationalContentByEra(era: string) {
  return educationalContent.filter(
    (content) => content.relatedEras?.includes(era)
  );
}

export function getEducationalContentByMaterial(material: string) {
  return educationalContent.filter(
    (content) => content.relatedMaterials?.some((m) => 
      m.toLowerCase() === material.toLowerCase()
    )
  );
}

