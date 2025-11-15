"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { shows, getGarmentsForShow, type Show } from "@/data/shows";
import { sampleGarments } from "@/data/sampleGarments";
import PageLayout from "@/components/layout/PageLayout";

export default function RunwayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showParam = searchParams.get("show");
  const [selectedShowId, setSelectedShowId] = useState<string>(
    showParam || shows[0]?.id || ""
  );
  const [showDescriptionVisible, setShowDescriptionVisible] = useState(false);

  useEffect(() => {
    if (showParam && showParam !== selectedShowId) {
      setSelectedShowId(showParam);
    }
  }, [showParam, selectedShowId]);

  const selectedShow = shows.find(s => s.id === selectedShowId) || shows[0];
  const showGarments = selectedShow ? getGarmentsForShow(selectedShow, sampleGarments) : [];

  const handleShowChange = (newShowId: string) => {
    setSelectedShowId(newShowId);
    router.push(`/runway?show=${newShowId}`);
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-zinc-950 text-zinc-50">
        {/* Show Selector */}
        <section className="border-b border-zinc-800 bg-zinc-900/30">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
                  Runway
                </h1>
                <p className="text-sm md:text-base text-zinc-400 font-light max-w-2xl">
                  Curated fashion shows organized by theme, era, and style
                </p>
              </div>
              
              {/* Show Dropdown */}
              <div className="flex-shrink-0">
                <select
                  value={selectedShowId}
                  onChange={(e) => handleShowChange(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-100 px-6 py-3 text-sm uppercase tracking-[0.1em] font-light focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"
                >
                  {shows.map((show) => (
                    <option key={show.id} value={show.id}>
                      {show.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Show Description */}
        {selectedShow?.description && (
          <section className="border-b border-zinc-800 bg-zinc-900/20">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => setShowDescriptionVisible(!showDescriptionVisible)}
                  className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0 pt-1"
                >
                  {showDescriptionVisible ? "Hide" : "View"} Show Description
                </button>
                {showDescriptionVisible && (
                  <p className="text-sm md:text-base text-zinc-300 font-light leading-relaxed">
                    {selectedShow.description}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Runway - Horizontal Scroll */}
        <section className="py-12 md:py-16">
          {showGarments.length > 0 ? (
            <div className="relative">
              {/* Scrollable Container */}
              <div className="overflow-x-auto scrollbar-hide pb-4">
                <div className="flex gap-6 md:gap-8 px-4 md:px-8 min-w-max">
                  {showGarments.map((garment) => (
                    <Link
                      key={garment.id}
                      href={`/backstage/${garment.id}?show=${selectedShowId}`}
                      className="group flex-shrink-0 w-64 md:w-80 transition-transform hover:scale-105"
                    >
                      <div className="border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300">
                        {/* Garment Image */}
                        <div className="relative w-full aspect-[3/4] bg-zinc-900 overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                            {/* Placeholder for image */}
                            <div className="text-center">
                              <p className="mb-1">Primary Image</p>
                              <p className="text-[0.65rem] text-zinc-700 truncate max-w-[200px]">
                                {garment.primaryImage}
                              </p>
                            </div>
                          </div>
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/20 transition-colors duration-300" />
                        </div>

                        {/* Garment Info */}
                        <div className="p-4 space-y-2">
                          <h3 className="text-base md:text-lg font-light tracking-tight group-hover:text-zinc-200 transition-colors">
                            {garment.title}
                          </h3>
                          <p className="text-xs text-zinc-400 font-light">
                            {garment.year} • {garment.designer}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Scroll Indicator */}
              {showGarments.length > 3 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 uppercase tracking-[0.2em] hidden md:block">
                  ← Scroll →
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 text-center py-16">
              <p className="text-zinc-500 font-light">
                No garments found for this show.
              </p>
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}

