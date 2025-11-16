"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { getAllGarments, filterGarments } from "@/lib/garments";
import { Era, GarmentType } from "@/types/garment";
import PageLayout from "@/components/layout/PageLayout";

export default function CollectionPage() {
  const allGarments = useMemo(() => getAllGarments(), []);
  const [selectedEra, setSelectedEra] = useState<Era | "all">("all");
  const [selectedType, setSelectedType] = useState<GarmentType | "all">("all");

  // Filter garments
  const filteredGarments = useMemo(() => {
    const filters: { era?: Era; type?: GarmentType } = {};
    if (selectedEra !== "all") filters.era = selectedEra;
    if (selectedType !== "all") filters.type = selectedType;
    
    return filters.era || filters.type ? filterGarments(allGarments, filters) : allGarments;
  }, [allGarments, selectedEra, selectedType]);

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

          {filteredGarments.length !== allGarments.length && (
            <div className="bg-zinc-900/50 border border-zinc-600 px-4 py-2 rounded">
              <span className="text-sm text-zinc-200 uppercase tracking-[0.1em] font-light">
                {filteredGarments.length} {filteredGarments.length === 1 ? 'garment' : 'garments'}
              </span>
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
              No garments found matching the selected filters.
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

