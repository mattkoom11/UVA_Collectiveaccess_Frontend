"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Era, GarmentType, Garment } from "@/types/garment";
import PageLayout from "@/components/layout/PageLayout";
import AdvancedSearchBar from "@/components/garments/AdvancedSearchBar";
import EmptyState from "@/components/garments/EmptyState";
import GarmentImage from "@/components/garments/GarmentImage";
import Link from "next/link";
import { Search, FileQuestion } from "lucide-react";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedEra, setSelectedEra] = useState<Era | "all">("all");
  const [selectedType, setSelectedType] = useState<GarmentType | "all">("all");
  const [allResults, setAllResults] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(false);

  // Update search query when URL param changes
  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  // Fetch from API whenever query changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    fetch(`/api/search?${params.toString()}`)
      .then(r => r.json())
      .then(data => setAllResults(data.results ?? []))
      .catch(() => setAllResults([]))
      .finally(() => setLoading(false));
  }, [searchQuery]);

  // Apply era/type filters client-side on top of API results
  const filteredResults = allResults.filter(g => {
    if (selectedEra !== "all" && g.era !== selectedEra) return false;
    if (selectedType !== "all" && g.type !== selectedType) return false;
    return true;
  });

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
    
    // Find all matches for all terms
    const matches: Array<{ start: number; end: number }> = [];
    for (const term of terms) {
      let index = lowerText.indexOf(term);
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
              <option value="suit">Suit &amp; Ensemble</option>
              <option value="shirt-blouse">Shirt &amp; Blouse</option>
              <option value="skirt">Skirt</option>
              <option value="pants-trousers">Pants &amp; Trousers</option>
              <option value="outerwear">Outerwear</option>
              <option value="undergarment">Undergarment</option>
              <option value="headwear">Headwear</option>
              <option value="footwear">Footwear</option>
              <option value="accessory">Accessory</option>
              <option value="jewelry">Jewelry</option>
              <option value="ensemble">Ensemble</option>
              <option value="swimwear">Swimwear</option>
              <option value="uniform">Uniform</option>
              <option value="non-western">Non-Western</option>
              <option value="textile">Textile</option>
              <option value="other">Other</option>
            </select>
          </div>

          {(searchQuery || selectedEra !== "all" || selectedType !== "all") && (
            <div className="bg-zinc-900/50 border border-zinc-600 px-4 py-2 rounded">
              <span className="text-sm text-zinc-200 uppercase tracking-[0.1em] font-light">
                {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
              </span>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 font-light">Searching...</p>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
            {filteredResults.map((garment) => (
              <Link
                key={garment.id}
                href={`/garments/${garment.slug}`}
                className="group border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300 hover:bg-zinc-900"
              >
                <GarmentImage garment={garment} />

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
        ) : searchQuery ? (
          <EmptyState
            icon={Search}
            title="No results found"
            description="No garments match your search. Try different keywords or clear filters."
            actionLabel="Clear search"
            onAction={handleClearSearch}
          />
        ) : (
          <EmptyState
            icon={FileQuestion}
            title="Search the collection"
            description="Search by name, material, color, decade, description, or any other attribute."
            actionLabel="Browse collection"
            actionHref="/collection"
          />
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

