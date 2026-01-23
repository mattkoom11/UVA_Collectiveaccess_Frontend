"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect, Suspense } from "react";
import { getAllGarments, filterGarments } from "@/lib/garments";
import { advancedSearch } from "@/lib/advancedSearch";
import { Era, GarmentType } from "@/types/garment";
import PageLayout from "@/components/layout/PageLayout";
import AdvancedSearchBar from "@/components/garments/AdvancedSearchBar";
import Link from "next/link";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedEra, setSelectedEra] = useState<Era | "all">("all");
  const [selectedType, setSelectedType] = useState<GarmentType | "all">("all");

  const allGarments = useMemo(() => getAllGarments(), []);

  // Update search query when URL param changes
  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  // Combined search and filter
  const filteredResults = useMemo(() => {
    let results = allGarments;

    // Apply advanced search first
    if (searchQuery.trim().length > 0) {
      results = advancedSearch(results, searchQuery);
    }

    // Then apply filters
    const filters: { era?: Era; type?: GarmentType } = {};
    if (selectedEra !== "all") filters.era = selectedEra;
    if (selectedType !== "all") filters.type = selectedType;

    if (filters.era || filters.type) {
      results = filterGarments(results, filters);
    }

    return results;
  }, [allGarments, searchQuery, selectedEra, selectedType]);

  const handleSearch = (newQuery: string) => {
    setSearchQuery(newQuery);
    router.push(`/search?q=${encodeURIComponent(newQuery)}`);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    router.push("/search");
  };

  // Helper function to get first line of description
  const getFirstLine = (text?: string): string => {
    if (!text) return "";
    const firstLine = text.split(".")[0];
    return firstLine.length > 120 ? firstLine.substring(0, 120) + "..." : firstLine + ".";
  };

  // Highlight search terms in text
  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query || query.trim().length === 0) return text;
    
    const terms = query.toLowerCase().trim().split(/\s+/);
    const lowerText = text.toLowerCase();
    const parts: Array<{ text: string; match: boolean }> = [];
    const lastIndex = 0;
    
    // Find all matches
    const matches: Array<{ start: number; end: number }> = [];
    for (const term of terms) {
      let index = lowerText.indexOf(term, lastIndex);
      while (index !== -1) {
        matches.push({ start: index, end: index + term.length });
        index = lowerText.indexOf(term, index + 1);
      }
    }
    
    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);
    
    // Merge overlapping matches
    const merged: Array<{ start: number; end: number }> = [];
    for (const match of matches) {
      if (merged.length === 0 || match.start > merged[merged.length - 1].end) {
        merged.push(match);
      } else {
        merged[merged.length - 1].end = Math.max(
          merged[merged.length - 1].end,
          match.end
        );
      }
    }
    
    // Build parts array
    let currentIndex = 0;
    for (const match of merged) {
      if (match.start > currentIndex) {
        parts.push({ text: text.substring(currentIndex, match.start), match: false });
      }
      parts.push({ text: text.substring(match.start, match.end), match: true });
      currentIndex = match.end;
    }
    if (currentIndex < text.length) {
      parts.push({ text: text.substring(currentIndex), match: false });
    }
    
    if (parts.length === 0) {
      return text;
    }
    
    return (
      <>
        {parts.map((part, i) => 
          part.match ? (
            <mark key={i} className="bg-zinc-700 text-zinc-100 px-0.5 rounded">
              {part.text}
            </mark>
          ) : (
            <span key={i}>{part.text}</span>
          )
        )}
      </>
    );
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Page Header */}
        <div className="mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-6 text-center">
            Search
          </h1>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <AdvancedSearchBar 
              variant="full" 
              onSearch={handleSearch}
              placeholder="Search by name, material, color, decade, description..."
              showAdvanced={true}
            />
          </div>

          {/* Active search query */}
          {searchQuery && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-zinc-900/50 border border-zinc-700 px-4 py-2 rounded">
                <span className="text-sm text-zinc-400 font-light">
                  Results for: <span className="text-zinc-200">{searchQuery}</span>
                </span>
                <button
                  onClick={handleClearSearch}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="mb-12 flex flex-wrap gap-4 items-center justify-center">
          <div className="bg-zinc-900/50 border border-zinc-700 px-4 py-2 rounded">
            <select
              value={selectedEra}
              onChange={(e) => setSelectedEra(e.target.value as Era | "all")}
              className="bg-transparent text-sm text-zinc-200 uppercase tracking-[0.1em] font-light focus:outline-none cursor-pointer"
            >
              <option value="all">All Eras</option>
              <option value="pre-1920">Pre-1920</option>
              <option value="1920-1950">1920–1950</option>
              <option value="1950-1980">1950–1980</option>
              <option value="1980+">1980+</option>
            </select>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-700 px-4 py-2 rounded">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as GarmentType | "all")}
              className="bg-transparent text-sm text-zinc-200 uppercase tracking-[0.1em] font-light focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="dress">Dress</option>
              <option value="coat">Coat</option>
              <option value="jacket">Jacket</option>
              <option value="suit">Suit</option>
              <option value="accessory">Accessory</option>
              <option value="other">Other</option>
            </select>
          </div>

          {filteredResults.length !== allGarments.length && (
            <div className="bg-zinc-900/50 border border-zinc-600 px-4 py-2 rounded">
              <span className="text-sm text-zinc-200 uppercase tracking-[0.1em] font-light">
                {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
              </span>
            </div>
          )}
        </div>

        {/* Results */}
        {filteredResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
            {filteredResults.map((garment) => (
              <Link
                key={garment.id}
                href={`/garments/${garment.slug}`}
                className="group border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300 hover:bg-zinc-900"
              >
                {/* Card Image */}
                <div className="relative w-full aspect-[3/4] bg-zinc-900 overflow-hidden">
                  {garment.thumbnailUrl || (garment.images && garment.images.length > 0) ? (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                      <div className="text-center">
                        <p className="mb-2">Thumbnail</p>
                        <p className="text-xs text-zinc-700">
                          {garment.thumbnailUrl || garment.images[0]}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                      <p>Image Placeholder</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/20 transition-colors duration-300" />
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-3">
                  <div>
                    <h2 className="text-lg md:text-xl font-light tracking-tight mb-2 group-hover:text-zinc-200 transition-colors">
                      {highlightMatch(
                        garment.name || garment.label || garment.editorial_title || "Untitled",
                        searchQuery
                      )}
                    </h2>
                    <p className="text-sm text-zinc-400 font-light">
                      {garment.decade || garment.date || ''} {garment.work_type ? `• ${garment.work_type}` : ''}
                    </p>
                  </div>
                  
                  {/* Description Excerpt with highlighting */}
                  {(garment.tagline || garment.description || garment.aesthetic_description) && (
                    <p className="text-xs md:text-sm text-zinc-500 font-light leading-relaxed line-clamp-2">
                      {highlightMatch(
                        getFirstLine(garment.tagline || garment.description || garment.aesthetic_description),
                        searchQuery
                      )}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            {searchQuery ? (
              <div className="space-y-4">
                <p className="text-lg text-zinc-400 font-light">
                  No garments found matching your search.
                </p>
                <p className="text-sm text-zinc-500 font-light">
                  Try different keywords or clear your filters.
                </p>
                <button
                  onClick={handleClearSearch}
                  className="inline-block text-sm text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700 px-4 py-2 rounded hover:border-zinc-600"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-zinc-400 font-light">
                  Enter a search query to find garments.
                </p>
                <p className="text-sm text-zinc-500 font-light">
                  Search by name, material, color, decade, description, or any other attribute.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center">
            <p className="text-zinc-400">Loading search...</p>
          </div>
        </div>
      </PageLayout>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

