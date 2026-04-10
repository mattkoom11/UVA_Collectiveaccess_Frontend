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
    id: "era-1950-1980",
    title: "1950s-1980s Fashion",
    subtitle: "From New Look to Punk",
    category: "era",
    relatedEras: ["1950-1980"],
    content: `A period of rapid change and diverse styles:

**The 1950s (Post-War Prosperity)**:
- Full skirts with petticoats
- Cinched waists and structured bodices
- Elegant daywear and formal evening wear
- Rise of youth culture and casual wear
- Influence of Hollywood and Paris couture

**The 1960s (Youth Revolution)**:
- Mod fashion with geometric patterns
- Mini skirts and shift dresses
- Bold colors and psychedelic prints
- Space Age influences
- Counterculture and hippie styles

**The 1970s (Individual Expression)**:
- Bohemian and ethnic influences
- Platform shoes and wide-leg pants
- Disco fashion with sequins and metallics
- Punk movement begins
- Natural fibers and earth tones

**The 1980s (Power Dressing)**:
- Shoulder pads and structured silhouettes
- Bold colors and patterns
- Designer labels become status symbols
- Punk and new wave aesthetics
- Athletic wear influences`,
  },
  {
    id: "era-1980-plus",
    title: "1980s and Beyond",
    subtitle: "Contemporary Fashion Evolution",
    category: "era",
    relatedEras: ["1980+"],
    content: `Modern fashion characterized by diversity and rapid change:

**The 1980s**:
- Power dressing with broad shoulders
- Designer labels and conspicuous consumption
- Punk, goth, and alternative subcultures
- Athletic wear becomes fashion
- Bright colors and bold patterns

**The 1990s**:
- Minimalism and grunge
- Casualization of fashion
- Streetwear emerges
- Vintage and thrift store fashion
- Technology influences design

**The 2000s and Beyond**:
- Fast fashion revolution
- Sustainability awareness
- Digital influences and social media
- Gender fluidity in fashion
- Return to craftsmanship and heritage brands`,
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
    id: "material-cotton",
    title: "Cotton",
    subtitle: "The Universal Fiber",
    category: "material",
    relatedMaterials: ["cotton"],
    content: `Cotton is the most widely used natural fiber in the world, valued for its comfort and versatility.

**Properties**:
- Natural cellulose fiber from cotton plants
- Soft, breathable, and absorbent
- Easy to dye and print
- Durable and machine-washable
- Hypoallergenic

**Historical Significance**:
- One of the oldest cultivated fibers (dating back 7,000 years)
- Industrial Revolution transformed cotton production
- Cotton gin revolutionized processing in the 18th century
- Played a major role in global trade and economy

**Types**:
- **Pima**: Extra-long staple, luxurious
- **Egyptian**: Long staple, premium quality
- **Organic**: Grown without pesticides
- **Denim**: Heavyweight twill weave

**In Fashion**:
Cotton has been used for everything from undergarments to outerwear, from casual wear to formal attire. Its versatility makes it suitable for all seasons and occasions.

**Care**:
- Machine washable
- Can shrink if not pre-shrunk
- Prone to wrinkling
- Can be bleached (white cotton)`,
  },
  {
    id: "material-linen",
    title: "Linen",
    subtitle: "The Ancient Cool",
    category: "material",
    relatedMaterials: ["linen"],
    content: `Linen is one of the oldest textiles, made from the flax plant, prized for its coolness and strength.

**Properties**:
- Natural cellulose fiber from flax
- Exceptionally cool and breathable
- Stronger when wet than dry
- Naturally antibacterial
- Becomes softer with each wash
- Wrinkles easily (part of its charm)

**Historical Significance**:
- Used in ancient Egypt (mummies wrapped in linen)
- Symbol of purity and wealth
- Used for everything from clothing to sails
- Labor-intensive to produce

**Characteristics**:
- Natural luster and texture
- Excellent for warm weather
- Durable and long-lasting
- Environmentally friendly (flax requires less water than cotton)

**In Fashion**:
Linen has been used for summer clothing, undergarments, and household textiles. Its natural texture and ability to keep cool made it essential for warm climates.

**Care**:
- Hand or machine wash
- Air dry or tumble dry low
- Iron while damp for best results
- Wrinkles are natural and expected`,
  },
  {
    id: "material-satin",
    title: "Satin",
    subtitle: "The Lustrous Weave",
    category: "material",
    relatedMaterials: ["satin"],
    content: `Satin is not a fiber but a weave, creating a smooth, glossy surface that has been associated with luxury for centuries.

**Properties**:
- Smooth, lustrous surface
- Drapes beautifully
- Can be made from silk, polyester, or other fibers
- Reflects light for elegant appearance
- Less breathable than natural fibers

**Types**:
- **Silk Satin**: Made from silk, most luxurious
- **Polyester Satin**: Affordable, easy care
- **Charmeuse**: Lightweight, fluid
- **Duchess Satin**: Heavy, structured

**Historical Use**:
Satin has been used for:
- Evening wear and formal gowns
- Lingerie and undergarments
- Home furnishings
- Accessories and trims

**In Fashion**:
Satin's luxurious appearance made it popular for special occasions, evening wear, and bridal gowns. Its smooth surface creates elegant silhouettes and catches light beautifully.

**Care**:
- Depends on fiber content
- Silk satin: dry clean recommended
- Polyester satin: machine washable
- Iron on low heat with cloth
- Store carefully to avoid snags`,
  },
  {
    id: "material-velvet",
    title: "Velvet",
    subtitle: "The Royal Fabric",
    category: "material",
    relatedMaterials: ["velvet"],
    content: `Velvet is a luxurious fabric with a dense, soft pile that has been associated with royalty and wealth for centuries.

**Properties**:
- Dense, soft pile surface
- Rich, luxurious appearance
- Can be made from silk, cotton, or synthetic fibers
- Absorbs light for deep colors
- Shows wear patterns (crush marks)

**Historical Significance**:
- Originated in the Middle East
- Extremely expensive to produce historically
- Reserved for royalty and nobility
- Symbol of wealth and status
- Used in Renaissance and Baroque periods

**Types**:
- **Silk Velvet**: Most luxurious, softest
- **Cotton Velvet**: More affordable, durable
- **Velveteen**: Cotton velvet, less expensive
- **Crushed Velvet**: Intentionally crushed for texture

**In Fashion**:
Velvet has been used for:
- Formal evening wear
- Royal and ceremonial garments
- Winter clothing and accessories
- Home furnishings and upholstery

**Care**:
- Dry clean recommended
- Store flat or rolled (never hang)
- Avoid crushing
- Brush gently to restore pile
- Keep away from direct sunlight`,
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
    id: "technique-construction",
    title: "Garment Construction",
    subtitle: "The Art of Tailoring",
    category: "technique",
    content: `The construction of a garment determines its fit, durability, and overall quality.

**Key Construction Techniques**:

**Seams**:
- **French Seam**: Enclosed seam for durability and elegance
- **Flat-Felled Seam**: Strong, used in jeans and workwear
- **Overlock**: Prevents fraying, common in modern garments
- **Hand-Finished**: Traditional method for couture garments

**Darts and Shaping**:
- Darts create shape and fit
- Princess seams for fitted silhouettes
- Gathers and pleats for fullness
- Bias cutting for fluid drape

**Interfacing and Structure**:
- Interfacing provides support and shape
- Boning in corsets and structured garments
- Padding and wadding for volume
- Lining for comfort and durability

**Historical Evolution**:
- Hand-sewn garments (pre-Industrial Revolution)
- Introduction of sewing machines (mid-1800s)
- Mass production techniques (20th century)
- Return to artisanal methods (contemporary)

**Quality Indicators**:
- Even, consistent stitching
- Proper seam allowances
- Reinforced stress points
- Clean finishing on inside
- Attention to grain and pattern matching`,
  },
  {
    id: "technique-draping",
    title: "Draping",
    subtitle: "Sculpting with Fabric",
    category: "technique",
    content: `Draping is the art of creating garments by manipulating fabric directly on a dress form or body.

**The Draping Process**:
1. **Preparation**: Pinning fabric to form
2. **Manipulation**: Creating folds, gathers, and shapes
3. **Marking**: Transferring design to pattern
4. **Construction**: Sewing the final garment

**Historical Significance**:
- Ancient technique used in Greek and Roman clothing
- Revived in 20th century by designers like Madeleine Vionnet
- Allows for unique, fluid silhouettes
- Creates garments that move with the body

**Famous Drapers**:
- **Madeleine Vionnet**: Master of bias cutting and draping
- **Madame Grès**: Known for sculptural draped designs
- **Issey Miyake**: Modern interpretation of draping

**Advantages**:
- Creates unique, one-of-a-kind shapes
- Allows for experimentation
- Results in garments that fit naturally
- Preserves fabric's natural drape

**In the Collection**:
Many garments show evidence of draping techniques, particularly in bias-cut dresses and flowing evening wear from the 1930s and beyond.`,
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

