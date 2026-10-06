"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Garment, Era } from "@/types/garment";
import { getEraFromDecade } from "@/types/garment";
import { Filter, X, ChevronDown, ArrowUp, Hash } from "lucide-react";
import GarmentCard from "./GarmentCard";

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
        const year = garment.yearApprox || parseInt(garment.date || garment.decade?.replace('s', '') || '0', 10);
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
        const timeValue = zoomLevel === "era" ? 0 : parseInt(parts[1]?.replace('s', '') || '0', 10);
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
      case 'pre-1920': return 'border-archive-border bg-archive-surface/30';
      case '1920-1950': return 'border-amber-700/50 bg-amber-950/20';
      case '1950-1980': return 'border-blue-700/50 bg-blue-950/20';
      case '1980+': return 'border-purple-700/50 bg-purple-950/20';
      default: return 'border-archive-border bg-archive-surface/30';
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

  // Count garments with no resolvable date/era — shown separately so they aren't silently dropped
  const undatedCount = useMemo(() => filteredGarments.filter(g => {
    const era = g.era || getEraFromDecade(g.decade, g.yearApprox, g.date);
    return !era;
  }).length, [filteredGarments]);

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
    timelineData.forEach(({ era, key, timeValue, count }) => {
      const label = zoomLevel === "era"
        ? getEraLabel(era)
        : String(timeValue || era);
      markers.push({ label, era, count, key });
    });
    return markers;
  }, [timelineData, zoomLevel]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20" ref={timelineRef}>
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
            Timeline View
          </h2>
          <p className="text-sm text-archive-muted font-light">
            Explore garments chronologically across fashion eras
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2 bg-archive-surface/50 border border-archive-border">
            <button
              onClick={() => setZoomLevel("era")}
              className={`px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors ${
 zoomLevel === "era"
                  ? "bg-archive-surface-muted text-archive-fg"
                  : "text-archive-muted hover:text-archive-fg"
              }`}
            >
              Era
            </button>
            <button
              onClick={() => setZoomLevel("decade")}
              className={`px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors ${
 zoomLevel === "decade"
                  ? "bg-archive-surface-muted text-archive-fg"
                  : "text-archive-muted hover:text-archive-fg"
              }`}
            >
              Decade
            </button>
            <button
              onClick={() => setZoomLevel("year")}
              className={`px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors ${
 zoomLevel === "year"
                  ? "bg-archive-surface-muted text-archive-fg"
                  : "text-archive-muted hover:text-archive-fg"
              }`}
            >
              Year
            </button>
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`bg-archive-surface/50 border border-archive-border px-4 py-2 text-sm text-archive-muted hover:text-archive-fg uppercase tracking-[0.1em] font-light hover:border-archive-border-hover transition-colors flex items-center gap-2 ${
 selectedEras.size > 0 ? "border-archive-border-hover text-archive-fg" : ""
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter Eras {selectedEras.size > 0 && `(${selectedEras.size})`}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {showFilters && (
              <div className="absolute top-full right-0 mt-2 bg-archive-surface border border-archive-border shadow-xl z-50 min-w-[200px] p-4">
                <div className="space-y-2">
                  {eras.map((era) => (
                    <label
                      key={era}
                      className="flex items-center gap-2 cursor-pointer text-sm text-archive-muted-subtle hover:text-archive-fg"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEras.has(era)}
                        onChange={() => toggleEra(era)}
                        className="w-4 h-4 border-archive-border bg-archive-surface-muted text-archive-muted focus:ring-archive-border-hover"
                      />
                      <span>{getEraLabel(era)}</span>
                      <span className="text-xs text-archive-muted ml-auto">
                        ({densityData[era] || 0})
                      </span>
                    </label>
                  ))}
                  {undatedCount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-archive-muted pt-1 border-t border-archive-border">
                      <span>Undated</span>
                      <span className="text-xs ml-auto">({undatedCount})</span>
                    </div>
                  )}
                  {selectedEras.size > 0 && (
                    <button
                      onClick={() => setSelectedEras(new Set())}
                      className="w-full mt-2 text-xs text-archive-muted hover:text-archive-fg border border-archive-border px-3 py-1.5 hover:border-archive-border-hover transition-colors flex items-center justify-center gap-2"
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
          <div className="mb-8 bg-archive-surface/30 border border-archive-border p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-archive-muted mb-3 text-center">Collection Density by Era</p>
            <div className="flex items-end gap-2 h-24">
              {eras.map((era) => {
                const count = densityData[era] || 0;
                const maxCount = Math.max(...Object.values(densityData), undatedCount);
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={era} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full bg-archive-surface-muted rounded-t" style={{ height: `${height}%` }}>
                      <div className={`absolute inset-0 rounded-t ${getEraColor(era).split(' ')[1]}`} />
                    </div>
                    <span className="text-xs text-archive-muted">{getEraLabel(era)}</span>
                    <span className="text-xs font-light text-archive-muted">{count}</span>
                  </div>
                );
              })}
              {undatedCount > 0 && (
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full bg-archive-surface-muted rounded-t" style={{ height: `${(undatedCount / Math.max(...Object.values(densityData), undatedCount)) * 100}%` }}>
                    <div className="absolute inset-0 rounded-t bg-archive-border-hover/40" />
                  </div>
                  <span className="text-xs text-archive-muted">Undated</span>
                  <span className="text-xs font-light text-archive-muted">{undatedCount}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline Navigation (Quick Jump) */}
        {timelineMarkers.length > 5 && (
          <div className="mb-8 bg-archive-surface/30 border border-archive-border p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-archive-muted mb-3 text-center">Quick Navigation</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {timelineMarkers.slice(0, 10).map((marker) => (
                <button
                  key={marker.key}
                  onClick={() => {
                    const element = document.querySelector(`[data-timeline-key="${marker.key}"]`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="px-3 py-1.5 text-xs text-archive-muted hover:text-archive-fg border border-archive-border hover:border-archive-border-hover transition-colors flex items-center gap-1"
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
        {timelineData.map((group) => (
          <section key={group.key} data-timeline-key={group.key} className="relative">
            <div
              className="sticky z-10 bg-archive-bg py-2 border-b border-archive-border mb-4"
              style={{ top: "var(--header-h, 73px)" }}
            >
              <h3 className="text-xs uppercase tracking-[0.2em] text-archive-muted">
                {group.timeValue || group.era}
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
              {group.items.map((garment) => (
                <GarmentCard key={garment.id} garment={garment} variant="research" />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Scroll to Top Button */}
      {scrollPosition > 500 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-archive-surface/80 border border-archive-border p-3 rounded-full text-archive-muted hover:text-archive-fg hover:border-archive-border-hover transition-all duration-300 backdrop-blur-sm z-40"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

