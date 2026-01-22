"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAllGarments, searchGarments } from "@/lib/garments";
import { Garment } from "@/types/garment";
import Link from "next/link";

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
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const allGarments = useMemo(() => getAllGarments(), []);
  
  // Search results - limit to 8 for dropdown
  const searchResults = useMemo(() => {
    if (!query || query.trim().length === 0) return [];
    const results = searchGarments(allGarments, query);
    return results.slice(0, 8);
  }, [query, allGarments]);

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
  }, [isOpen, searchResults, focusedIndex, query]);

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

  const handleSelectResult = (garment: Garment) => {
    setIsOpen(false);
    setQuery("");
    setFocusedIndex(-1);
    router.push(`/garments/${garment.slug}`);
  };

  const handleSubmit = (e?: React.FormEvent) => {
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
  };

  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query || query.trim().length === 0) return text;
    
    const terms = query.toLowerCase().trim().split(/\s+/);
    let highlightedText = text;
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
            <mark key={i} className="bg-zinc-700 text-zinc-100 px-0.5">
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
            w-full bg-zinc-900/50 border border-zinc-700 text-zinc-100 placeholder-zinc-500
            focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500
            transition-colors font-light
            ${isHeaderVariant 
              ? "text-xs px-3 py-1.5 rounded" 
              : "text-sm md:text-base px-4 py-3 rounded-lg"
            }
          `}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
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
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            {searchResults.map((garment, index) => (
              <Link
                key={garment.id}
                href={`/garments/${garment.slug}`}
                onClick={() => handleSelectResult(garment)}
                className={`
                  block px-3 py-2 rounded hover:bg-zinc-800 transition-colors
                  ${focusedIndex === index ? "bg-zinc-800" : ""}
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail placeholder */}
                  <div className="flex-shrink-0 w-12 h-16 bg-zinc-800 rounded" />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-light text-zinc-100 mb-1 truncate">
                      {highlightMatch(
                        garment.name || garment.label || garment.editorial_title || "Untitled",
                        query
                      )}
                    </h3>
                    <p className="text-xs text-zinc-400 font-light">
                      {garment.decade || garment.date || ""}
                      {garment.work_type && ` • ${garment.work_type}`}
                    </p>
                    {(garment.tagline || garment.description) && (
                      <p className="text-xs text-zinc-500 font-light mt-1 line-clamp-1">
                        {highlightMatch(
                          garment.tagline || garment.description || "",
                          query
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Show more results link */}
            {searchGarments(allGarments, query).length > searchResults.length && (
              <button
                onClick={handleSubmit}
                className="w-full mt-2 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 text-center border-t border-zinc-800 pt-2"
              >
                View all {searchGarments(allGarments, query).length} results
              </button>
            )}
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && query.trim().length > 0 && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 p-4">
          <p className="text-sm text-zinc-400 font-light text-center">
            No garments found matching "{query}"
          </p>
        </div>
      )}
    </div>
  );
}

