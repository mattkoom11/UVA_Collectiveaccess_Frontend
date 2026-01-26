"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Garment, Era } from "@/types/garment";
import { getEraFromDecade } from "@/types/garment";
import Link from "next/link";
import Image from "next/image";
import { ZoomIn, ZoomOut, Filter, X, ChevronDown, ArrowUp, ArrowDown, Hash } from "lucide-react";

interface TimelineViewProps {
  garments: Garment[];
}

type ZoomLevel = "decade" | "year" | "era";

export default function TimelineView({ garments }: TimelineViewProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("decade");
  const [selectedEras, setSelectedEras] = useState<Set<Era>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  // Filter garments by selected eras
  const filteredGarments = useMemo(() => {
    if (selectedEras.size === 0) return garments;
    return garments.filter(garment => {
      const era = garment.era || getEraFromDecade(garment.decade, garment.yearApprox, garment.date);
      return selectedEras.has(era as Era);
    });
  }, [garments, selectedEras]);

  // Group garments by era, decade, or year based on zoom level
  const timelineData = useMemo(() => {
    const grouped: Record<string, Garment[]> = {};

    filteredGarments.forEach(garment => {
      const era = garment.era || getEraFromDecade(garment.decade, garment.yearApprox, garment.date);
      let key: string;
      
      if (zoomLevel === "era") {
        key = era || 'Unknown';
      } else if (zoomLevel === "year") {
        const year = garment.yearApprox || parseInt(garment.date || garment.decade?.replace('s', '') || '0');
        key = `${era || 'Unknown'}-${year}`;
      } else {
        // decade
        const decade = garment.decade || garment.date || 'Unknown';
        key = `${era || 'Unknown'}-${decade}`;
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(garment);
    });

    // Sort by era and time
    return Object.entries(grouped)
      .map(([key, items]) => {
        const parts = key.split('-');
        const era = parts[0];
        const timeValue = zoomLevel === "era" ? 0 : parseInt(parts[1]?.replace('s', '') || '0');
        return { era, key, timeValue, items, count: items.length };
      })
      .sort((a, b) => {
        const eraOrder: Record<string, number> = {
          'pre-1920': 1,
          '1920-1950': 2,
          '1950-1980': 3,
          '1980+': 4,
        };
        const eraDiff = (eraOrder[a.era] || 99) - (eraOrder[b.era] || 99);
        if (eraDiff !== 0) return eraDiff;
        return a.timeValue - b.timeValue;
      });
  }, [filteredGarments, zoomLevel]);

  // Calculate density for visualization
  const densityData = useMemo(() => {
    const density: Record<string, number> = {};
    filteredGarments.forEach(garment => {
      const era = garment.era || getEraFromDecade(garment.decade, garment.yearApprox, garment.date);
      density[era || 'Unknown'] = (density[era || 'Unknown'] || 0) + 1;
    });
    return density;
  }, [filteredGarments]);

  const getEraLabel = (era?: string) => {
    switch (era) {
      case 'pre-1920': return 'Pre-1920';
      case '1920-1950': return '1920–1950';
      case '1950-1980': return '1950–1980';
      case '1980+': return '1980+';
      default: return 'Unknown Era';
    }
  };

  const getEraColor = (era?: string) => {
    switch (era) {
      case 'pre-1920': return 'border-zinc-700 bg-zinc-900/30';
      case '1920-1950': return 'border-amber-700/50 bg-amber-950/20';
      case '1950-1980': return 'border-blue-700/50 bg-blue-950/20';
      case '1980+': return 'border-purple-700/50 bg-purple-950/20';
      default: return 'border-zinc-700 bg-zinc-900/30';
    }
  };

  const toggleEra = (era: Era) => {
    const newSelected = new Set(selectedEras);
    if (newSelected.has(era)) {
      newSelected.delete(era);
    } else {
      newSelected.add(era);
    }
    setSelectedEras(newSelected);
  };

  const eras: Era[] = ['pre-1920', '1920-1950', '1950-1980', '1980+'];

  // Smooth scroll to top
  const scrollToTop = () => {
    timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Handle scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get all unique decades/years for navigation
  const timelineMarkers = useMemo(() => {
    const markers: Array<{ label: string; era: string; count: number; key: string }> = [];
    timelineData.forEach(({ era, key, count }) => {
      const label = zoomLevel === "era" 
        ? getEraLabel(era) 
        : zoomLevel === "year" 
        ? key.split('-')[1] 
        : key.split('-')[1];
      markers.push({ label, era, count, key });
    });
    return markers;
  }, [timelineData, zoomLevel]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12" ref={timelineRef}>
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
            Timeline View
          </h2>
          <p className="text-sm text-zinc-400 font-light">
            Explore garments chronologically across fashion eras
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-700 rounded">
            <button
              onClick={() => setZoomLevel("era")}
              className={`px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors ${
                zoomLevel === "era"
                  ? "bg-zinc-800 text-zinc-200"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Era
            </button>
            <button
              onClick={() => setZoomLevel("decade")}
              className={`px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors ${
                zoomLevel === "decade"
                  ? "bg-zinc-800 text-zinc-200"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Decade
            </button>
            <button
              onClick={() => setZoomLevel("year")}
              className={`px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors ${
                zoomLevel === "year"
                  ? "bg-zinc-800 text-zinc-200"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Year
            </button>
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`bg-zinc-900/50 border border-zinc-700 px-4 py-2 rounded text-sm text-zinc-400 hover:text-zinc-200 uppercase tracking-[0.1em] font-light hover:border-zinc-600 transition-colors flex items-center gap-2 ${
                selectedEras.size > 0 ? "border-zinc-500 text-zinc-200" : ""
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter Eras {selectedEras.size > 0 && `(${selectedEras.size})`}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {showFilters && (
              <div className="absolute top-full right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-[200px] p-4">
                <div className="space-y-2">
                  {eras.map((era) => (
                    <label
                      key={era}
                      className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300 hover:text-zinc-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEras.has(era)}
                        onChange={() => toggleEra(era)}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-zinc-400 focus:ring-zinc-600"
                      />
                      <span>{getEraLabel(era)}</span>
                      <span className="text-xs text-zinc-500 ml-auto">
                        ({densityData[era] || 0})
                      </span>
                    </label>
                  ))}
                  {selectedEras.size > 0 && (
                    <button
                      onClick={() => setSelectedEras(new Set())}
                      className="w-full mt-2 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded hover:border-zinc-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-3 h-3" />
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Density Visualization */}
        {selectedEras.size === 0 && (
          <div className="mb-8 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-3 text-center">Collection Density by Era</p>
            <div className="flex items-end gap-2 h-24">
              {eras.map((era) => {
                const count = densityData[era] || 0;
                const maxCount = Math.max(...Object.values(densityData));
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={era} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full bg-zinc-800 rounded-t" style={{ height: `${height}%` }}>
                      <div className={`absolute inset-0 rounded-t ${getEraColor(era).split(' ')[1]}`} />
                    </div>
                    <span className="text-xs text-zinc-500">{getEraLabel(era)}</span>
                    <span className="text-xs font-light text-zinc-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline Navigation (Quick Jump) */}
        {timelineMarkers.length > 5 && (
          <div className="mb-8 bg-zinc-900/30 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 mb-3 text-center">Quick Navigation</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {timelineMarkers.slice(0, 10).map((marker) => (
                <button
                  key={marker.key}
                  onClick={() => {
                    const element = document.querySelector(`[data-timeline-key="${marker.key}"]`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded transition-colors flex items-center gap-1"
                >
                  <Hash className="w-3 h-3" />
                  {marker.label} ({marker.count})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-zinc-800" />

        {/* Timeline entries */}
        <div className="space-y-16">
          {timelineData.map(({ era, key, items }, groupIndex) => (
            <div key={key} data-timeline-key={key} className="relative scroll-mt-24">
              {/* Era marker */}
              <div className="flex items-start md:items-center gap-6 md:gap-8">
                {/* Left side (mobile) / Right side (desktop) */}
                <div className="flex-1 md:flex-none md:w-1/2 md:pr-8 md:text-right">
                  <div className={`inline-block border px-6 py-3 rounded ${getEraColor(era)}`}>
                    <div className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-1">
                      {getEraLabel(era)}
                    </div>
                    <div className="text-lg font-light text-zinc-200">
                      {zoomLevel === "era" 
                        ? getEraLabel(era) 
                        : zoomLevel === "year" 
                        ? key.split('-')[1] 
                        : key.split('-')[1]}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <span>{items.length} {items.length === 1 ? 'garment' : 'garments'}</span>
                      {zoomLevel === "decade" && key.split('-')[1] && (
                        <span className="text-zinc-600">•</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline dot */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-zinc-700 border-2 border-zinc-950 z-10" />

                {/* Right side (mobile) / Left side (desktop) */}
                <div className="flex-1 md:flex-none md:w-1/2 md:pl-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((garment) => (
                      <Link
                        key={garment.id}
                        href={`/garments/${garment.slug}`}
                        className="group border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300"
                      >
                        <div className="relative w-full aspect-[3/4] bg-zinc-900 overflow-hidden">
                          {garment.thumbnailUrl || (garment.images && garment.images[0]) ? (
                            <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                              <p>Thumbnail</p>
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                              <p>Image</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/20 transition-colors duration-300" />
                        </div>
                        <div className="p-4 space-y-1">
                          <h3 className="text-sm font-light tracking-tight group-hover:text-zinc-200 transition-colors line-clamp-2">
                            {garment.name || garment.label || garment.editorial_title}
                          </h3>
                          <p className="text-xs text-zinc-400 font-light">
                            {garment.work_type || 'Garment'}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {scrollPosition > 500 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-zinc-900/80 border border-zinc-700 p-3 rounded-full text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all duration-300 backdrop-blur-sm z-40"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

