"use client";

import Link from "next/link";
import { sampleGarments } from "@/data/sampleGarments";
import PageLayout from "@/components/layout/PageLayout";

export default function CollectionPage() {
  // Helper function to get first line of eraStory
  const getFirstLine = (text: string): string => {
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

        {/* Garment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {sampleGarments.map((garment) => (
            <Link
              key={garment.id}
              href={`/collection/${garment.id}`}
              className="group border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300 hover:bg-zinc-900"
            >
              {/* Card Image */}
              <div className="relative w-full aspect-[3/4] bg-zinc-900 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                  {/* Placeholder for image - replace with Next/Image when ready */}
                  <div className="text-center">
                    <p className="mb-2">Primary Image</p>
                    <p className="text-xs text-zinc-700">{garment.primaryImage}</p>
                  </div>
                </div>
                {/* Hover overlay effect */}
                <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/20 transition-colors duration-300" />
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-3">
                <div>
                  <h2 className="text-lg md:text-xl font-light tracking-tight mb-2 group-hover:text-zinc-200 transition-colors">
                    {garment.title}
                  </h2>
                  <p className="text-sm text-zinc-400 font-light">
                    {garment.year} • {garment.designer}
                  </p>
                </div>
                
                {/* Era Story Excerpt */}
                <p className="text-xs md:text-sm text-zinc-500 font-light leading-relaxed line-clamp-2">
                  {getFirstLine(garment.eraStory)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

