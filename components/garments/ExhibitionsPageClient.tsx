"use client";

import { Exhibition } from "@/data/exhibitions";
import { Garment } from "@/types/garment";
import { getGarmentById } from "@/lib/garments";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ExhibitionsPageClientProps {
  allGarments: Garment[];
  exhibitions: Exhibition[];
}

export default function ExhibitionsPageClient({ allGarments, exhibitions }: ExhibitionsPageClientProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="mb-12 md:mb-16 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
            Virtual Exhibitions
          </h1>
          <p className="text-sm md:text-base text-zinc-400 font-light max-w-2xl mx-auto">
            Curated collections exploring themes, eras, and stories from the archive
          </p>
        </div>

        {/* Featured Exhibitions */}
        {exhibitions.filter(e => e.featured).length > 0 && (
          <div className="mb-16">
            <h2 className="text-xl md:text-2xl font-light mb-8 text-zinc-300">Featured</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {exhibitions
                .filter(e => e.featured)
                .map((exhibition) => (
                  <Link
                    key={exhibition.id}
                    href={`/exhibitions/${exhibition.id}`}
                    className="group border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300 hover:bg-zinc-900"
                  >
                    <div className="aspect-[16/9] bg-zinc-900 flex items-center justify-center text-zinc-600">
                      {exhibition.imageUrl ? (
                        <span>Image: {exhibition.imageUrl}</span>
                      ) : (
                        <span>Exhibition Image</span>
                      )}
                    </div>
                    <div className="p-6 space-y-3">
                      <div>
                        <h3 className="text-xl md:text-2xl font-light mb-2 group-hover:text-zinc-200 transition-colors">
                          {exhibition.title}
                        </h3>
                        {exhibition.subtitle && (
                          <p className="text-sm text-zinc-400 font-light mb-2">
                            {exhibition.subtitle}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 font-light leading-relaxed line-clamp-3">
                        {exhibition.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 pt-2">
                        <span>{exhibition.garmentIds.length} garments</span>
                        <span>•</span>
                        <span className="group-hover:text-zinc-300 transition-colors flex items-center gap-1">
                          View Exhibition <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* All Exhibitions */}
        <div>
          <h2 className="text-xl md:text-2xl font-light mb-8 text-zinc-300">All Exhibitions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exhibitions.map((exhibition) => (
              <Link
                key={exhibition.id}
                href={`/exhibitions/${exhibition.id}`}
                className="group border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300 hover:bg-zinc-900"
              >
                <div className="aspect-[4/3] bg-zinc-900 flex items-center justify-center text-zinc-600 text-sm">
                  {exhibition.imageUrl ? (
                    <span>Image: {exhibition.imageUrl}</span>
                  ) : (
                    <span>Exhibition Image</span>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-lg font-light group-hover:text-zinc-200 transition-colors">
                    {exhibition.title}
                  </h3>
                  {exhibition.subtitle && (
                    <p className="text-xs text-zinc-400 font-light">
                      {exhibition.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-zinc-500 font-light line-clamp-2">
                    {exhibition.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

