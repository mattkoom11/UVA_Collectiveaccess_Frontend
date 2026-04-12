// Saved searches management
export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters?: {
    era?: string;
    type?: string;
    color?: string;
    material?: string;
    dateStart?: number;
    dateEnd?: number;
  };
  sortBy?: string;
  createdAt: number;
  lastUsed?: number;
}

const SAVED_SEARCHES_KEY = "uva-fashion-saved-searches";
const MAX_SAVED_SEARCHES = 20;

export function getSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(SAVED_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveSearch(search: Omit<SavedSearch, "id" | "createdAt">): SavedSearch {
  if (typeof window === "undefined") {
    throw new Error("Cannot save search on server side");
  }

  const searches = getSavedSearches();
  const newSearch: SavedSearch = {
    ...search,
    id: Date.now().toString(),
    createdAt: Date.now(),
    lastUsed: Date.now(),
  };

  // Check if we've reached the limit
  if (searches.length >= MAX_SAVED_SEARCHES) {
    // Remove the oldest unused search
    const sorted = [...searches].sort((a, b) => (a.lastUsed || a.createdAt) - (b.lastUsed || b.createdAt));
    const oldestId = sorted[0].id;
    const filtered = searches.filter((s) => s.id !== oldestId);
    filtered.push(newSearch);
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(filtered));
  } else {
    searches.push(newSearch);
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
  }

  return newSearch;
}

export function deleteSavedSearch(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const searches = getSavedSearches();
    const filtered = searches.filter((s) => s.id !== id);
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore errors
  }
}

export function updateSavedSearchLastUsed(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const searches = getSavedSearches();
    const updated = searches.map((s) =>
      s.id === id ? { ...s, lastUsed: Date.now() } : s
    );
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore errors
  }
}

export function getSavedSearchURL(search: SavedSearch): string {
  const params = new URLSearchParams();
  
  if (search.query) params.set("q", search.query);
  if (search.filters?.era) params.set("era", search.filters.era);
  if (search.filters?.type) params.set("type", search.filters.type);
  if (search.filters?.color) params.set("color", search.filters.color);
  if (search.filters?.material) params.set("material", search.filters.material);
  if (search.filters?.dateStart) params.set("dateStart", search.filters.dateStart.toString());
  if (search.filters?.dateEnd) params.set("dateEnd", search.filters.dateEnd.toString());
  if (search.sortBy) params.set("sort", search.sortBy);
  
  return `/collection?${params.toString()}`;
}
