"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAllGarments, filterGarments } from "@/lib/garments";
import { Era, GarmentType } from "@/types/garment";
import PageLayout from "@/components/layout/PageLayout";
import AdvancedSearchBar from "./AdvancedSearchBar";
import SkeletonCard from "./SkeletonCard";
import SkeletonList from "./SkeletonList";
import { advancedSearch } from "@/lib/advancedSearch";
import { ChevronDown, X, ArrowUpDown, Grid3x3, List, Bookmark, Save, Search } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import { getFilterPresets, saveFilterPreset, deleteFilterPreset, getPresetURL, FilterPreset } from "@/lib/filterPresets";
import { getSavedSearches, saveSearch, deleteSavedSearch, getSavedSearchURL, updateSavedSearchLastUsed, SavedSearch } from "@/lib/savedSearches";
import { getAnalytics } from "@/lib/analytics";

type SortOption = "relevance" | "date-asc" | "date-desc" | "name-asc" | "name-desc" | "era-asc" | "era-desc";

export default function CollectionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const allGarments = useMemo(() => getAllGarments(), []);
  
  // Initialize state from URL params
  const [selectedEra, setSelectedEra] = useState<Era | "all">(
    (searchParams.get("era") as Era | null) || "all"
  );
  const [selectedType, setSelectedType] = useState<GarmentType | "all">(
    (searchParams.get("type") as GarmentType | null) || "all"
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    searchParams.get("color") || "all"
  );
  const [selectedMaterial, setSelectedMaterial] = useState<string>(
    searchParams.get("material") || "all"
  );
  const [dateRange, setDateRange] = useState<{ start?: number; end?: number }>(() => {
    const start = searchParams.get("dateStart");
    const end = searchParams.get("dateEnd");
    return {
      start: start ? parseInt(start, 10) : undefined,
      end: end ? parseInt(end, 10) : undefined,
    };
  });
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "relevance"
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (searchParams.get("view") as "grid" | "list") || "grid"
  );
  const [isLoading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState("");
  const presets = useMemo(() => getFilterPresets(), []);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState("");
  const [showSaveSearchDialog, setShowSaveSearchDialog] = useState(false);
  const savedSearches = useMemo(() => getSavedSearches(), []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedEra !== "all") params.set("era", selectedEra);
    if (selectedType !== "all") params.set("type", selectedType);
    if (selectedColor !== "all") params.set("color", selectedColor);
    if (selectedMaterial !== "all") params.set("material", selectedMaterial);
    if (dateRange.start) params.set("dateStart", dateRange.start.toString());
    if (dateRange.end) params.set("dateEnd", dateRange.end.toString());
    if (searchQuery) params.set("q", searchQuery);
    if (sortBy !== "relevance") params.set("sort", sortBy);
    if (viewMode !== "grid") params.set("view", viewMode);

    const newUrl = params.toString() ? `/collection?${params.toString()}` : "/collection";
    router.replace(newUrl, { scroll: false });
  }, [selectedEra, selectedType, selectedColor, selectedMaterial, dateRange, searchQuery, sortBy, viewMode, router]);

  const saveCurrentAsPreset = () => {
    if (!presetName.trim()) return;
    const preset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      era: selectedEra !== "all" ? selectedEra : undefined,
      type: selectedType !== "all" ? selectedType : undefined,
      color: selectedColor !== "all" ? selectedColor : undefined,
      material: selectedMaterial !== "all" ? selectedMaterial : undefined,
      dateStart: dateRange.start,
      dateEnd: dateRange.end,
    };
    saveFilterPreset(preset);
    setPresetName("");
    setShowPresets(false);
  };

  const loadPreset = (preset: FilterPreset) => {
    setSelectedEra((preset.era as any) || "all");
    setSelectedType((preset.type as any) || "all");
    setSelectedColor(preset.color || "all");
    setSelectedMaterial(preset.material || "all");
    setDateRange({
      start: preset.dateStart,
      end: preset.dateEnd,
    });
  };

  const saveCurrentAsSearch = () => {
    if (!savedSearchName.trim()) return;
    try {
      saveSearch({
        name: savedSearchName.trim(),
        query: searchQuery,
        filters: {
          era: selectedEra !== "all" ? selectedEra : undefined,
          type: selectedType !== "all" ? selectedType : undefined,
          color: selectedColor !== "all" ? selectedColor : undefined,
          material: selectedMaterial !== "all" ? selectedMaterial : undefined,
          dateStart: dateRange.start,
          dateEnd: dateRange.end,
        },
        sortBy: sortBy !== "relevance" ? sortBy : undefined,
      });
      setSavedSearchName("");
      setShowSaveSearchDialog(false);
      setShowSavedSearches(false);
    } catch (error) {
      // Handle error
      console.error("Failed to save search:", error);
    }
  };

  const loadSavedSearch = (search: SavedSearch) => {
    setSearchQuery(search.query || "");
    setSelectedEra((search.filters?.era as Era | undefined) || "all");
    setSelectedType((search.filters?.type as GarmentType | undefined) || "all");
    setSelectedColor(search.filters?.color || "all");
    setSelectedMaterial(search.filters?.material || "all");
    setDateRange({
      start: search.filters?.dateStart,
      end: search.filters?.dateEnd,
    });
    if (search.sortBy) setSortBy(search.sortBy as SortOption);
    setShowSavedSearches(false);
    updateSavedSearchLastUsed(search.id);
  };

  // Extract unique colors and materials
  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    allGarments.forEach(g => {
      g.colors?.forEach(c => colors.add(c.toLowerCase()));
    });
    return Array.from(colors).sort();
  }, [allGarments]);

  const availableMaterials = useMemo(() => {
    const materials = new Set<string>();
    allGarments.forEach(g => {
      if (Array.isArray(g.materials)) {
        g.materials.forEach(m => materials.add(m.toLowerCase()));
      } else if (g.materials) {
        materials.add(g.materials.toLowerCase());
      }
    });
    return Array.from(materials).sort();
  }, [allGarments]);

  // Combined search and filter
  const filteredGarments = useMemo(() => {
    let results = allGarments;

    // Apply advanced search first
    if (searchQuery.trim().length > 0) {
      results = advancedSearch(results, searchQuery);
    }

    // Then apply filters
    const filters: { era?: Era; type?: GarmentType; color?: string; material?: string } = {};
    if (selectedEra !== "all") filters.era = selectedEra;
    if (selectedType !== "all") filters.type = selectedType;
    if (selectedColor !== "all") filters.color = selectedColor;
    if (selectedMaterial !== "all") filters.material = selectedMaterial;
    
    if (filters.era || filters.type || filters.color || filters.material) {
      results = filterGarments(results, filters);
    }

    // Apply date range filter
    if (dateRange.start !== undefined || dateRange.end !== undefined) {
      results = results.filter(g => {
        const year = g.yearApprox || parseInt(g.date || g.decade?.replace('s', '') || '0', 10);
        if (isNaN(year)) return true; // Include if no date available
        if (dateRange.start !== undefined && year < dateRange.start) return false;
        if (dateRange.end !== undefined && year > dateRange.end) return false;
        return true;
      });
    }

    // Apply sorting
    results = [...results].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          const yearA = a.yearApprox || parseInt(a.date || a.decade?.replace('s', '') || '0');
          const yearB = b.yearApprox || parseInt(b.date || b.decade?.replace('s', '') || '0');
          return yearA - yearB;
        case "date-desc":
          const yearA2 = a.yearApprox || parseInt(a.date || a.decade?.replace('s', '') || '0', 10);
          const yearB2 = b.yearApprox || parseInt(b.date || b.decade?.replace('s', '') || '0', 10);
          return yearB2 - yearA2;
        case "name-asc":
          return (a.name || a.label || a.editorial_title || '').localeCompare(b.name || b.label || b.editorial_title || '');
        case "name-desc":
          return (b.name || b.label || b.editorial_title || '').localeCompare(a.name || a.label || a.editorial_title || '');
        case "era-asc":
          const eraA = a.era || (a.decade ? (a.decade.includes('196') ? '1950-1980' : a.decade.includes('192') ? '1920-1950' : 'pre-1920') : 'pre-1920');
          const eraB = b.era || (b.decade ? (b.decade.includes('196') ? '1950-1980' : b.decade.includes('192') ? '1920-1950' : 'pre-1920') : 'pre-1920');
          return eraA.localeCompare(eraB);
        case "era-desc":
          const eraA2 = a.era || (a.decade ? (a.decade.includes('196') ? '1950-1980' : a.decade.includes('192') ? '1920-1950' : 'pre-1920') : 'pre-1920');
          const eraB2 = b.era || (b.decade ? (b.decade.includes('196') ? '1950-1980' : b.decade.includes('192') ? '1920-1950' : 'pre-1920') : 'pre-1920');
          return eraB2.localeCompare(eraA2);
        default: // relevance
          return 0;
      }
    });
    
    return results;
  }, [allGarments, selectedEra, selectedType, selectedColor, selectedMaterial, dateRange, searchQuery, sortBy]);

  // Track filter usage
  useEffect(() => {
    const analytics = getAnalytics();
    if (selectedEra !== "all") analytics.trackFilter("era", selectedEra);
    if (selectedType !== "all") analytics.trackFilter("type", selectedType);
    if (selectedColor !== "all") analytics.trackFilter("color", selectedColor);
    if (selectedMaterial !== "all") analytics.trackFilter("material", selectedMaterial);
  }, [selectedEra, selectedType, selectedColor, selectedMaterial]);

  // Track search
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const analytics = getAnalytics();
      analytics.trackSearch(searchQuery, filteredGarments.length);
    }
  }, [searchQuery, filteredGarments]);

  // Helper function to get first line of description
  const getFirstLine = (text?: string): string => {
    if (!text) return "";
    const firstLine = text.split(".")[0];
    return firstLine.length > 120 ? firstLine.substring(0, 120) + "..." : firstLine + ".";
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Page Header */}
        <div className="mb-12 md:mb-16 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
            Collection
          </h1>
          <p className="text-sm md:text-base text-zinc-400 font-light max-w-2xl mx-auto">
            A curated selection of historic garments from the University of Virginia archive
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <AdvancedSearchBar 
            variant="full" 
            onSearch={setSearchQuery}
            placeholder="Search collection by name, material, color, decade..."
          />
        </div>

        {/* Filter and Sort Bar */}
        <div className="mb-12 space-y-4">
          {/* Main Filters */}
          <div className="flex flex-wrap gap-4 items-center justify-center">
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

            {/* Sort */}
            <div className="bg-zinc-900/50 border border-zinc-700 px-4 py-2 rounded flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-sm text-zinc-200 uppercase tracking-[0.1em] font-light focus:outline-none cursor-pointer"
              >
                <option value="relevance">Relevance</option>
                <option value="date-asc">Date: Oldest First</option>
                <option value="date-desc">Date: Newest First</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
                <option value="era-asc">Era: Early First</option>
                <option value="era-desc">Era: Recent First</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="bg-zinc-900/50 border border-zinc-700 rounded flex">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 transition-colors ${
                  viewMode === "grid"
                    ? "bg-zinc-800 text-zinc-200"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 transition-colors ${
                  viewMode === "list"
                    ? "bg-zinc-800 text-zinc-200"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Saved Searches */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSavedSearches(!showSavedSearches);
                  setShowPresets(false);
                }}
                className="bg-zinc-900/50 border border-zinc-700 px-4 py-2 rounded text-sm text-zinc-400 hover:text-zinc-200 uppercase tracking-[0.1em] font-light hover:border-zinc-600 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Saved Searches
              </button>
              {showSavedSearches && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSavedSearches(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-[250px] max-h-96 overflow-y-auto">
                    <div className="p-4 space-y-3">
                      <div>
                        <button
                          onClick={() => {
                            setShowSaveSearchDialog(true);
                            setShowSavedSearches(false);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors rounded"
                        >
                          <Save className="w-4 h-4" />
                          Save Current Search
                        </button>
                      </div>
                      {savedSearches.length > 0 && (
                        <>
                          <div className="border-t border-zinc-700 pt-3">
                            <p className="text-xs uppercase tracking-[0.1em] text-zinc-400 mb-2">Saved Searches</p>
                            {savedSearches.map((search) => (
                              <div key={search.id} className="flex items-center justify-between gap-2 mb-2">
                                <button
                                  onClick={() => loadSavedSearch(search)}
                                  className="flex-1 text-left text-sm text-zinc-300 hover:text-zinc-200 px-2 py-1.5 rounded hover:bg-zinc-800 transition-colors"
                                  title={search.query || "No query"}
                                >
                                  {search.name}
                                </button>
                                <button
                                  onClick={() => {
                                    deleteSavedSearch(search.id);
                                    setShowSavedSearches(false);
                                  }}
                                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                                  aria-label="Delete search"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Filter Presets */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowPresets(!showPresets);
                  setShowSavedSearches(false);
                }}
                className="bg-zinc-900/50 border border-zinc-700 px-4 py-2 rounded text-sm text-zinc-400 hover:text-zinc-200 uppercase tracking-[0.1em] font-light hover:border-zinc-600 transition-colors flex items-center gap-2"
              >
                <Bookmark className="w-4 h-4" />
                Presets
              </button>
              {showPresets && (
                <div className="absolute top-full right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-[250px] max-h-96 overflow-y-auto">
                  <div className="p-4 space-y-3">
                    <div>
                      <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Preset name..."
                        className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 rounded text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            saveCurrentAsPreset();
                          }
                        }}
                      />
                      <button
                        onClick={saveCurrentAsPreset}
                        className="mt-2 w-full text-xs uppercase tracking-[0.1em] text-zinc-400 hover:text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded hover:border-zinc-600 transition-colors"
                      >
                        Save Current Filters
                      </button>
                    </div>
                    {presets.length > 0 && (
                      <>
                        <div className="border-t border-zinc-700 pt-3">
                          <p className="text-xs uppercase tracking-[0.1em] text-zinc-400 mb-2">Saved Presets</p>
                          {presets.map((preset) => (
                            <div key={preset.id} className="flex items-center justify-between gap-2 mb-2">
                              <button
                                onClick={() => loadPreset(preset)}
                                className="flex-1 text-left text-sm text-zinc-300 hover:text-zinc-200 px-2 py-1.5 rounded hover:bg-zinc-800 transition-colors"
                              >
                                {preset.name}
                              </button>
                              <button
                                onClick={() => {
                                  deleteFilterPreset(preset.id);
                                  setShowPresets(false);
                                }}
                                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                                aria-label="Delete preset"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="bg-zinc-900/50 border border-zinc-700 px-4 py-2 rounded text-sm text-zinc-200 uppercase tracking-[0.1em] font-light hover:border-zinc-600 transition-colors flex items-center gap-2"
            >
              <span>More Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Results Count */}
            {(filteredGarments.length !== allGarments.length || searchQuery.trim().length > 0 || selectedEra !== "all" || selectedType !== "all" || selectedColor !== "all" || selectedMaterial !== "all") && (
              <div className="bg-zinc-900/50 border border-zinc-600 px-4 py-2 rounded">
                <span className="text-sm text-zinc-200 uppercase tracking-[0.1em] font-light">
                  {filteredGarments.length} {filteredGarments.length === 1 ? 'garment' : 'garments'}
                </span>
              </div>
            )}

            {/* Clear Filters */}
            {(selectedEra !== "all" || selectedType !== "all" || selectedColor !== "all" || selectedMaterial !== "all" || dateRange.start || dateRange.end) && (
              <button
                onClick={() => {
                  setSelectedEra("all");
                  setSelectedType("all");
                  setSelectedColor("all");
                  setSelectedMaterial("all");
                  setDateRange({});
                }}
                className="bg-zinc-900/50 border border-zinc-700 px-4 py-2 rounded text-sm text-zinc-400 hover:text-zinc-200 uppercase tracking-[0.1em] font-light hover:border-zinc-600 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Color Filter */}
                {availableColors.length > 0 && (
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">
                      Color
                    </label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-700 px-4 py-2 rounded text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                    >
                      <option value="all">All Colors</option>
                      {availableColors.map(color => (
                        <option key={color} value={color} className="capitalize">
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Material Filter */}
                {availableMaterials.length > 0 && (
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">
                      Material
                    </label>
                    <select
                      value={selectedMaterial}
                      onChange={(e) => setSelectedMaterial(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-700 px-4 py-2 rounded text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                    >
                      <option value="all">All Materials</option>
                      {availableMaterials.map(material => (
                        <option key={material} value={material} className="capitalize">
                          {material}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date Range */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-zinc-400 mb-2">
                    Date Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Start Year"
                      value={dateRange.start || ''}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                      className="flex-1 bg-zinc-900/50 border border-zinc-700 px-3 py-2 rounded text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                      min="1800"
                      max="2100"
                    />
                    <span className="text-zinc-500 self-center">–</span>
                    <input
                      type="number"
                      placeholder="End Year"
                      value={dateRange.end || ''}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                      className="flex-1 bg-zinc-900/50 border border-zinc-700 px-3 py-2 rounded text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                      min="1800"
                      max="2100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Search Dialog */}
        {showSaveSearchDialog && (
          <>
            <div
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowSaveSearchDialog(false);
                setSavedSearchName("");
              }}
            >
              <div
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-light text-zinc-200 mb-4">Save Search</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.1em] text-zinc-400 mb-2">
                      Search Name
                    </label>
                    <input
                      type="text"
                      value={savedSearchName}
                      onChange={(e) => setSavedSearchName(e.target.value)}
                      placeholder="e.g., 1920s Silk Dresses"
                      className="w-full bg-zinc-800 border border-zinc-700 px-4 py-2 rounded text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          saveCurrentAsSearch();
                        }
                        if (e.key === "Escape") {
                          setShowSaveSearchDialog(false);
                          setSavedSearchName("");
                        }
                      }}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveCurrentAsSearch}
                      disabled={!savedSearchName.trim()}
                      className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowSaveSearchDialog(false);
                        setSavedSearchName("");
                      }}
                      className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Garment Cards Grid/List */}
        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <SkeletonList count={6} />
          )
        ) : filteredGarments.length > 0 ? (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10"
            : "space-y-4"
          }>
            {filteredGarments.map((garment) => (
              <div
                key={garment.id}
                className={viewMode === "grid"
                  ? "group border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300 hover:bg-zinc-900 relative"
                  : "group border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300 hover:bg-zinc-900 relative flex gap-6"
                }
              >
                {/* Favorite Button */}
                <div className="absolute top-4 right-4 z-10">
                  <FavoriteButton garmentId={garment.id} />
                </div>

                <Link
                  href={`/garments/${garment.slug}`}
                  className={viewMode === "list" ? "flex-1 flex gap-6" : "block"}
                >
                  {/* Card Image */}
                  <div className={`relative ${viewMode === "grid" ? "w-full aspect-[3/4]" : "w-48 flex-shrink-0"} bg-zinc-900 overflow-hidden`}>
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
                  <div className={`p-6 space-y-3 ${viewMode === "list" ? "flex-1" : ""}`}>
                    <div>
                      <h2 className="text-lg md:text-xl font-light tracking-tight mb-2 group-hover:text-zinc-200 transition-colors">
                        {garment.name || garment.label || garment.editorial_title}
                      </h2>
                      <p className="text-sm text-zinc-400 font-light">
                        {garment.decade || garment.date || ''} {garment.work_type ? `• ${garment.work_type}` : ''}
                      </p>
                    </div>
                    
                    {/* Description Excerpt */}
                    {(garment.tagline || garment.description || garment.aesthetic_description) && (
                      <p className={`text-xs md:text-sm text-zinc-500 font-light leading-relaxed ${viewMode === "grid" ? "line-clamp-2" : "line-clamp-3"}`}>
                        {getFirstLine(garment.tagline || garment.description || garment.aesthetic_description)}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-zinc-500 font-light">
              {searchQuery.trim().length > 0 
                ? "No garments found matching your search and filters."
                : "No garments found matching the selected filters."
              }
            </p>
            {searchQuery.trim().length > 0 && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-sm text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700 px-4 py-2 rounded hover:border-zinc-600"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

