"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { getAllGarments, filterGarments, searchGarments } from "@/lib/garments";
import { Era, GarmentType, Garment } from "@/types/garment";
import PageLayout from "@/components/layout/PageLayout";
import SearchBar from "@/components/layout/SearchBar";
import { ChevronDown, X, ArrowUpDown } from "lucide-react";

type SortOption = "relevance" | "date-asc" | "date-desc" | "name-asc" | "name-desc" | "era-asc" | "era-desc";

export default function CollectionPage() {
  const allGarments = useMemo(() => getAllGarments(), []);
  const [selectedEra, setSelectedEra] = useState<Era | "all">("all");
  const [selectedType, setSelectedType] = useState<GarmentType | "all">("all");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start?: number; end?: number }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

    // Apply search first
    if (searchQuery.trim().length > 0) {
      results = searchGarments(results, searchQuery);
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
        const year = g.yearApprox || parseInt(g.date || g.decade?.replace('s', '') || '0');
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
          const yearA2 = a.yearApprox || parseInt(a.date || a.decade?.replace('s', '') || '0');
          const yearB2 = b.yearApprox || parseInt(b.date || b.decade?.replace('s', '') || '0');
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
          <SearchBar 
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
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="flex-1 bg-zinc-900/50 border border-zinc-700 px-3 py-2 rounded text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                      min="1800"
                      max="2100"
                    />
                    <span className="text-zinc-500 self-center">–</span>
                    <input
                      type="number"
                      placeholder="End Year"
                      value={dateRange.end || ''}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value ? parseInt(e.target.value) : undefined })}
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

        {/* Garment Cards Grid */}
        {filteredGarments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
            {filteredGarments.map((garment) => (
              <Link
                key={garment.id}
                href={`/garments/${garment.slug}`}
                className="group border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300 hover:bg-zinc-900"
              >
                {/* Card Image */}
                <div className="relative w-full aspect-[3/4] bg-zinc-900 overflow-hidden">
                  {garment.thumbnailUrl || (garment.images && garment.images.length > 0) ? (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                      {/* Placeholder for image - replace with Next/Image when ready */}
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
                  {/* Hover overlay effect */}
                  <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/20 transition-colors duration-300" />
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-3">
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
                    <p className="text-xs md:text-sm text-zinc-500 font-light leading-relaxed line-clamp-2">
                      {getFirstLine(garment.tagline || garment.description || garment.aesthetic_description)}
                    </p>
                  )}
                </div>
              </Link>
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

