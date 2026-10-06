"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, History, ChevronDown, ChevronUp } from "lucide-react";
import { getSearchHistory, addToSearchHistory, clearSearchHistory } from "@/lib/advancedSearch";

interface AdvancedSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  variant?: "header" | "full";
  showAdvanced?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function AdvancedSearchBar({
  onSearch,
  placeholder = "Search by name, material, color, decade...",
  variant = "full",
  showAdvanced = false,
  inputRef: externalInputRef,
}: AdvancedSearchBarProps) {
  const [query, setQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(showAdvanced);
  const [field, setField] = useState<string>("all");
  const searchHistory = getSearchHistory();
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    addToSearchHistory(searchQuery);
    onSearch(searchQuery);
    setShowHistory(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    } else if (e.key === "Escape") {
      setShowHistory(false);
    }
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    handleSearch(historyQuery);
  };

  const baseClasses = variant === "header" 
    ? "w-full max-w-md"
    : "w-full max-w-2xl";

  return (
    <div ref={containerRef} className={`relative ${baseClasses}`}>
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-archive-muted" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowHistory(searchHistory.length > 0)}
              placeholder={placeholder}
              className="w-full bg-archive-surface/50 border border-archive-border px-10 py-2 md:py-3 text-sm text-archive-fg placeholder-archive-muted focus:outline-none focus:border-archive-border-hover transition-colors font-light"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-archive-muted hover:text-archive-fg transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
            className="px-3 py-2 border border-archive-border text-archive-muted hover:text-archive-fg hover:border-archive-border-hover transition-colors flex items-center gap-2 text-xs uppercase tracking-[0.1em]"
            aria-label="Toggle advanced search"
          >
            {showAdvancedPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced
          </button>
        </div>

        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-archive-surface border border-archive-border shadow-xl z-50 max-h-60 overflow-y-auto">
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <span className="text-xs uppercase tracking-[0.1em] text-archive-muted">Recent Searches</span>
                <button
                  onClick={() => {
                    clearSearchHistory();
                    setShowHistory(false);
                  }}
                  className="text-xs text-archive-muted hover:text-archive-muted-subtle transition-colors"
                >
                  Clear
                </button>
              </div>
              {searchHistory.map((historyQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(historyQuery)}
                  className="w-full text-left px-3 py-2 text-sm text-archive-muted-subtle hover:bg-archive-surface-muted transition-colors flex items-center gap-2"
                >
                  <History className="w-3 h-3 text-archive-muted" />
                  {historyQuery}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Search Panel */}
      {showAdvancedPanel && (
        <div className="mt-4 p-4 bg-archive-surface/50 border border-archive-border space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-archive-muted mb-2">
              Search Field
            </label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="w-full bg-archive-surface/50 border border-archive-border px-4 py-2 text-sm text-archive-fg focus:outline-none focus:border-archive-border-hover"
            >
              <option value="all">All Fields</option>
              <option value="title">Title</option>
              <option value="description">Description</option>
              <option value="materials">Materials</option>
              <option value="colors">Colors</option>
              <option value="decade">Decade</option>
              <option value="era">Era</option>
              <option value="type">Type</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-archive-muted mb-2">
              Boolean Operators
            </label>
            <div className="text-xs text-archive-muted space-y-1">
              <p>• Use <code className="px-1 py-0.5 bg-archive-surface-muted">AND</code> to require all terms</p>
              <p>• Use <code className="px-1 py-0.5 bg-archive-surface-muted">OR</code> to match any term</p>
              <p>• Use <code className="px-1 py-0.5 bg-archive-surface-muted">NOT</code> to exclude terms</p>
              <p>• Use <code className="px-1 py-0.5 bg-archive-surface-muted">field:value</code> for field-specific search</p>
              <p className="mt-2 text-archive-muted">Examples:</p>
              <p className="text-archive-muted">• <code className="px-1 py-0.5 bg-archive-surface-muted">silk AND red</code></p>
              <p className="text-archive-muted">• <code className="px-1 py-0.5 bg-archive-surface-muted">material:silk OR material:wool</code></p>
              <p className="text-archive-muted">• <code className="px-1 py-0.5 bg-archive-surface-muted">dress NOT 1950s</code></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

