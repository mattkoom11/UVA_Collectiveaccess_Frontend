"use client";

import { Exhibition } from "@/data/exhibitions";
import { Garment } from "@/types/garment";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ExhibitionDetailClientProps {
  exhibition: Exhibition;
  garments: Garment[];
}

export default function ExhibitionDetailClient({ exhibition, garments }: ExhibitionDetailClientProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Back Button */}
        <Link
          href="/exhibitions"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Exhibitions
        </Link>

        {/* Header */}
        <div className="mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
            {exhibition.title}
          </h1>
          {exhibition.subtitle && (
            <p className="text-lg md:text-xl text-zinc-400 font-light mb-6">
              {exhibition.subtitle}
            </p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
            {exhibition.curator && (
              <span>Curated by {exhibition.curator}</span>
            )}
            {exhibition.startDate && (
              <span>
                {exhibition.startDate}
                {exhibition.endDate ? ` – ${exhibition.endDate}` : ""}
              </span>
            )}
            <span>{garments.length} garments</span>
          </div>
        </div>

        {/* Exhibition Image */}
        {exhibition.imageUrl && (
          <div className="mb-12 aspect-[16/9] bg-zinc-900 flex items-center justify-center text-zinc-600">
            <span>Image: {exhibition.imageUrl}</span>
          </div>
        )}

        {/* Description */}
        <div className="mb-12 max-w-3xl">
          <p className="text-base md:text-lg text-zinc-300 font-light leading-relaxed whitespace-pre-line">
            {exhibition.description}
          </p>
        </div>

        {/* Garments Grid */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-light mb-8 text-zinc-300">
            Garments in This Exhibition
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {garments.map((garment) => (
              <Link
                key={garment.id}
                href={`/garments/${garment.slug}`}
                className="group border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300 hover:bg-zinc-900"
              >
                <div className="relative w-full aspect-[3/4] bg-zinc-900 overflow-hidden">
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
                <div className="p-6 space-y-3">
                  <div>
                    <h3 className="text-lg md:text-xl font-light tracking-tight mb-2 group-hover:text-zinc-200 transition-colors">
                      {garment.name || garment.label || garment.editorial_title}
                    </h3>
                    <p className="text-sm text-zinc-400 font-light">
                      {garment.decade || garment.date || ''} {garment.work_type ? `• ${garment.work_type}` : ''}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

