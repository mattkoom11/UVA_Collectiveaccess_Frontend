/**
 * Converts color names to hex codes that Three.js can understand
 */
const colorNameMap: Record<string, string> = {
  // Grays
  "charcoal": "#36454f",
  "gray": "#808080",
  "grey": "#808080",
  "silver": "#c0c0c0",
  "slate": "#708090",
  
  // Greens
  "emerald": "#50c878",
  "green": "#008000",
  "forest": "#228b22",
  "olive": "#808000",
  "lime": "#00ff00",
  "mint": "#98ff98",
  
  // Blues
  "blue": "#0000ff",
  "navy": "#000080",
  "sky": "#87ceeb",
  "teal": "#008080",
  "cyan": "#00ffff",
  
  // Reds
  "red": "#ff0000",
  "crimson": "#dc143c",
  "burgundy": "#800020",
  "maroon": "#800000",
  "pink": "#ffc0cb",
  "rose": "#ff007f",
  
  // Yellows/Oranges
  "yellow": "#ffff00",
  "gold": "#ffd700",
  "orange": "#ffa500",
  "amber": "#ffbf00",
  "coral": "#ff7f50",
  
  // Purples
  "purple": "#800080",
  "violet": "#8a2be2",
  "lavender": "#e6e6fa",
  "plum": "#dda0dd",
  
  // Browns
  "brown": "#a52a2a",
  "tan": "#d2b48c",
  "beige": "#f5f5dc",
  "khaki": "#c3b091",
  
  // Blacks/Whites
  "black": "#000000",
  "white": "#ffffff",
  "ivory": "#fffff0",
  "cream": "#fffdd0",
  
  // Others
  "peach": "#ffcba4",
  "salmon": "#fa8072",
  "turquoise": "#40e0d0",
  "indigo": "#4b0082",
};

/**
 * Converts a color name or hex code to a hex code that Three.js can use
 * @param color - Color name (e.g., "charcoal", "emerald") or hex code (e.g., "#ff0000")
 * @returns Hex code string that Three.js can parse
 */
export function normalizeColorForThree(color: string | undefined | null): string {
  if (!color) return "#6b7280"; // Default gray
  
  // If it's already a hex code, return it
  if (color.startsWith("#")) {
    return color;
  }
  
  // Convert to lowercase for lookup
  const normalized = color.toLowerCase().trim();
  
  // Check if it's in our map
  if (colorNameMap[normalized]) {
    return colorNameMap[normalized];
  }
  
  // Try to use Three.js built-in color names
  // If that fails, Three.js will warn but we'll return a default
  // For now, return a default gray for unknown colors
  return "#6b7280";
}

/**
 * Gets the primary color from a garment's colors array
 */
export function getPrimaryColor(colors?: string[] | string | null): string {
  if (!colors) return "#6b7280";
  
  if (Array.isArray(colors) && colors.length > 0) {
    return normalizeColorForThree(colors[0]);
  }
  
  if (typeof colors === "string") {
    return normalizeColorForThree(colors);
  }
  
  return "#6b7280";
}

/**
 * Gets a secondary color from a garment's colors array, or falls back to primary
 */
export function getSecondaryColor(colors?: string[] | string | null, primaryColor?: string): string {
  if (!colors) return primaryColor || "#6b7280";
  
  if (Array.isArray(colors) && colors.length > 1) {
    return normalizeColorForThree(colors[1]);
  }
  
  return primaryColor || getPrimaryColor(colors);
}

