import { Garment } from "@/types/garment";

export type SearchField = "all" | "title" | "description" | "materials" | "colors" | "decade" | "era" | "type";

export interface SearchQuery {
  terms: string[];
  operators: ("AND" | "OR" | "NOT")[];
  field?: SearchField;
}

export function parseAdvancedQuery(query: string): SearchQuery {
  // Simple parser for boolean operators
  // Supports: AND, OR, NOT, parentheses, field:value syntax
  
  const terms: string[] = [];
  const operators: ("AND" | "OR" | "NOT")[] = [];
  let field: SearchField | undefined = undefined;

  // Check for field-specific search (e.g., "title:evening", "material:silk")
  const fieldMatch = query.match(/^(\w+):(.+)$/);
  if (fieldMatch) {
    const [, fieldName, value] = fieldMatch;
    const validFields: SearchField[] = ["title", "description", "materials", "colors", "decade", "era", "type"];
    if (validFields.includes(fieldName as SearchField)) {
      field = fieldName as SearchField;
      query = value;
    }
  }

  // Split by operators (case-insensitive)
  const parts = query.split(/\s+(AND|OR|NOT)\s+/i);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part && !["AND", "OR", "NOT"].includes(part.toUpperCase())) {
      terms.push(part);
    } else if (part && ["AND", "OR", "NOT"].includes(part.toUpperCase())) {
      operators.push(part.toUpperCase() as "AND" | "OR" | "NOT");
    }
  }

  // Default to AND if no operators specified
  if (operators.length === 0 && terms.length > 1) {
    for (let i = 0; i < terms.length - 1; i++) {
      operators.push("AND");
    }
  }

  return { terms, operators, field };
}

export function advancedSearch(garments: Garment[], query: string): Garment[] {
  if (!query.trim()) return garments;

  const parsed = parseAdvancedQuery(query);
  const { terms, operators, field } = parsed;

  if (terms.length === 0) return garments;

  return garments.filter((garment) => {
    let matches: boolean[] = [];

    for (let i = 0; i < terms.length; i++) {
      const term = terms[i].toLowerCase();
      let termMatches = false;

      if (field && field !== "all") {
        // Field-specific search
        termMatches = searchInField(garment, field, term);
      } else {
        // Search across all fields
        termMatches = searchInGarment(garment, term);
      }

      matches.push(termMatches);
    }

    // Apply boolean operators
    if (matches.length === 1) {
      return matches[0];
    }

    let result = matches[0];
    for (let i = 0; i < operators.length; i++) {
      const operator = operators[i];
      const nextMatch = matches[i + 1];

      if (operator === "AND") {
        result = result && nextMatch;
      } else if (operator === "OR") {
        result = result || nextMatch;
      } else if (operator === "NOT") {
        result = result && !nextMatch;
      }
    }

    return result;
  });
}

function searchInField(garment: Garment, field: SearchField, term: string): boolean {
  switch (field) {
    case "title":
      return (
        (garment.name || "").toLowerCase().includes(term) ||
        (garment.label || "").toLowerCase().includes(term) ||
        (garment.editorial_title || "").toLowerCase().includes(term)
      );
    case "description":
      return (
        (garment.description || "").toLowerCase().includes(term) ||
        (garment.tagline || "").toLowerCase().includes(term) ||
        (garment.aesthetic_description || "").toLowerCase().includes(term)
      );
    case "materials":
      const materials = Array.isArray(garment.materials)
        ? garment.materials
        : garment.materials
        ? [garment.materials]
        : [];
      return materials.some((m) => m.toLowerCase().includes(term));
    case "colors":
      const colors = Array.isArray(garment.colors)
        ? garment.colors
        : garment.colors
        ? [garment.colors]
        : [];
      return colors.some((c) => c.toLowerCase().includes(term));
    case "decade":
      return (garment.decade || "").toLowerCase().includes(term);
    case "era":
      return (garment.era || "").toLowerCase().includes(term);
    case "type":
      return (
        (garment.work_type || "").toLowerCase().includes(term) ||
        (garment.type || "").toLowerCase().includes(term)
      );
    default:
      return searchInGarment(garment, term);
  }
}

function searchInGarment(garment: Garment, term: string): boolean {
  const searchableFields = [
    garment.name,
    garment.label,
    garment.editorial_title,
    garment.description,
    garment.tagline,
    garment.aesthetic_description,
    garment.story,
    garment.inspiration,
    garment.context,
    garment.decade,
    garment.date,
    garment.era,
    garment.work_type,
    garment.type,
    garment.function,
    garment.collection,
    garment.accessionNumber,
    Array.isArray(garment.colors) ? garment.colors.join(" ") : garment.colors,
    Array.isArray(garment.materials) ? garment.materials.join(" ") : garment.materials,
  ];

  return searchableFields.some(
    (field) => field && String(field).toLowerCase().includes(term)
  );
}

// Search history management
const SEARCH_HISTORY_KEY = "uva-fashion-search-history";
const MAX_HISTORY = 10;

export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToSearchHistory(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return;
  
  try {
    const history = getSearchHistory();
    // Remove if already exists
    const filtered = history.filter((q) => q !== query);
    // Add to beginning
    const updated = [query, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore errors
  }
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // Ignore errors
  }
}

