"use client";

import { useMemo } from "react";
import { Garment } from "@/types/garment";
import { getEraFromDecade } from "@/types/garment";
import Link from "next/link";
import Image from "next/image";

interface TimelineViewProps {
  garments: Garment[];
}

export default function TimelineView({ garments }: TimelineViewProps) {
  // Group garments by era and decade
  const timelineData = useMemo(() => {
    const grouped: Record<string, Garment[]> = {};

    garments.forEach(garment => {
      const era = garment.era || getEraFromDecade(garment.decade, garment.yearApprox, garment.date);
      const decade = garment.decade || garment.date || 'Unknown';
      const key = `${era || 'Unknown'}-${decade}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(garment);
    });

    // Sort by era and decade
    return Object.entries(grouped)
      .map(([key, items]) => {
        const [era, decade] = key.split('-');
        const year = parseInt(decade.replace('s', '')) || 0;
        return { era, decade, year, items };
      })
      .sort((a, b) => {
        // Sort by era first
        const eraOrder: Record<string, number> = {
          'pre-1920': 1,
          '1920-1950': 2,
          '1950-1980': 3,
          '1980+': 4,
        };
        const eraDiff = (eraOrder[a.era] || 99) - (eraOrder[b.era] || 99);
        if (eraDiff !== 0) return eraDiff;
        // Then by year
        return a.year - b.year;
      });
  }, [garments]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
          Timeline View
        </h2>
        <p className="text-sm text-zinc-400 font-light">
          Explore garments chronologically across fashion eras
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-zinc-800" />

        {/* Timeline entries */}
        <div className="space-y-16">
          {timelineData.map(({ era, decade, items }, groupIndex) => (
            <div key={`${era}-${decade}`} className="relative">
              {/* Era marker */}
              <div className="flex items-start md:items-center gap-6 md:gap-8">
                {/* Left side (mobile) / Right side (desktop) */}
                <div className="flex-1 md:flex-none md:w-1/2 md:pr-8 md:text-right">
                  <div className={`inline-block border px-6 py-3 rounded ${getEraColor(era)}`}>
                    <div className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-1">
                      {getEraLabel(era)}
                    </div>
                    <div className="text-lg font-light text-zinc-200">
                      {decade}
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
    </div>
  );
}

