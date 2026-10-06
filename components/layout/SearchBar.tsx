"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Garment } from "@/types/garment";

interface SearchBarProps {
  variant?: "header" | "full";
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  variant = "header",
  onSearch,
  placeholder = "Search garments..."
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState<Garment[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); setTotalResults(0); return; }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setSearchResults(data.results ?? []);
      setTotalResults(data.total ?? 0);
    } catch {
      setSearchResults([]);
      setTotalResults(0);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchResults]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (garment: Garment) => {
    setIsOpen(false);
    setQuery("");
    setFocusedIndex(-1);
  };

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim().length > 0) {
      setIsOpen(false);
      if (onSearch) {
        onSearch(query);
      } else {
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }
      inputRef.current?.blur();
    }
  }, [query, onSearch, router]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || searchResults.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
            handleSelectResult(searchResults[focusedIndex]);
          } else if (query.trim().length > 0) {
            handleSubmit();
          }
          break;
        case "Escape":
          setIsOpen(false);
          setFocusedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, searchResults, focusedIndex, query, handleSubmit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.trim().length > 0);
    setFocusedIndex(-1);
  };

  const handleInputFocus = () => {
    if (query.trim().length > 0 && searchResults.length > 0) {
      setIsOpen(true);
    }
  };

  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query || query.trim().length === 0) return text;
    
    const terms = query.toLowerCase().trim().split(/\s+/);
    const parts: Array<{ text: string; match: boolean }> = [];
    
    // Simple highlighting - find first match
    const lowerText = text.toLowerCase();
    for (const term of terms) {
      const index = lowerText.indexOf(term);
      if (index !== -1) {
        parts.push(
          { text: text.substring(0, index), match: false },
          { text: text.substring(index, index + term.length), match: true },
          { text: text.substring(index + term.length), match: false }
        );
        break;
      }
    }
    
    if (parts.length === 0) {
      return text;
    }
    
    return (
      <>
        {parts.map((part, i) => 
          part.match ? (
            <mark key={i} className="bg-archive-border-hover text-archive-fg px-0.5">
              {part.text}
            </mark>
          ) : (
            <span key={i}>{part.text}</span>
          )
        )}
      </>
    );
  };

  const isHeaderVariant = variant === "header";

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`
 w-full bg-archive-surface/50 border border-archive-border text-archive-fg placeholder-archive-muted
            focus:outline-none focus:border-archive-border-hover focus:ring-1 focus:ring-archive-border-hover
            transition-colors font-light
            ${isHeaderVariant 
              ? "text-xs px-3 py-1.5" 
              : "text-sm md:text-base px-4 py-3"
            }
          `}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-archive-muted hover:text-archive-fg transition-colors"
          aria-label="Search"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </form>

      {/* Dropdown Results */}
      {isOpen && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-archive-surface border border-archive-border shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            {searchResults.map((garment, index) => (
              <a
                key={garment.id}
                href={`/garments/${garment.slug}`}
                onClick={() => handleSelectResult(garment)}
                className={`
 block px-3 py-2 hover:bg-archive-surface-muted transition-colors
                  ${focusedIndex === index ? "bg-archive-surface-muted" : ""}
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-12 h-16 bg-archive-surface-muted overflow-hidden">
                    {garment.thumbnailUrl && (
                      <img src={garment.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-light text-archive-fg mb-1 truncate">
                      {highlightMatch(
                        garment.name || garment.label || garment.editorial_title || "Untitled",
                        query
                      )}
                    </h3>
                    <p className="text-xs text-archive-muted font-light">
                      {garment.decade || garment.date || ""}
                      {garment.work_type && ` • ${garment.work_type}`}
                    </p>
                    {(garment.tagline || garment.description) && (
                      <p className="text-xs text-archive-muted font-light mt-1 line-clamp-1">
                        {highlightMatch(
                          garment.tagline || garment.description || "",
                          query
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            ))}

            {/* Show more results link */}
            {totalResults > searchResults.length && (
              <button
                onClick={handleSubmit}
                className="w-full mt-2 px-3 py-2 text-xs text-archive-muted hover:text-archive-fg text-center border-t border-archive-border pt-2"
              >
                View all {totalResults} results
              </button>
            )}
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && query.trim().length > 0 && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-archive-surface border border-archive-border shadow-xl z-50 p-4">
          <p className="text-sm text-archive-muted font-light text-center">
            No garments found matching &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
