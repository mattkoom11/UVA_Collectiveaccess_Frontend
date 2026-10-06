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
    <div className="min-h-screen bg-archive-bg text-archive-fg">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Back Button */}
        <Link
          href="/exhibitions"
          className="inline-flex items-center gap-2 text-sm text-archive-muted hover:text-archive-fg transition-colors mb-8"
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
            <p className="text-lg md:text-xl text-archive-muted font-light mb-6">
              {exhibition.subtitle}
            </p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-archive-muted">
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
          <div className="mb-12 aspect-[16/9] bg-archive-surface flex items-center justify-center text-archive-muted">
            <span>Image: {exhibition.imageUrl}</span>
          </div>
        )}

        {/* Description */}
        <div className="mb-12 max-w-3xl space-y-6">
          <p className="text-base md:text-lg text-archive-muted-subtle font-light leading-relaxed whitespace-pre-line">
            {exhibition.description}
          </p>
          
          {/* Curator Note */}
          {exhibition.curatorNote && (
            <div className="border-l-2 border-archive-border pl-6 italic text-archive-muted font-light">
              <p className="text-sm md:text-base">{exhibition.curatorNote}</p>
              {exhibition.curator && (
                <p className="text-xs mt-2 not-italic">— {exhibition.curator}</p>
              )}
            </div>
          )}

          {/* Extended Narrative */}
          {exhibition.narrative && (
            <div className="pt-6 border-t border-archive-border">
              <h2 className="text-xl font-light mb-4 text-archive-fg">Exhibition Narrative</h2>
              <div className="prose prose-invert prose-lg max-w-none">
                <p className="text-base md:text-lg text-archive-muted-subtle font-light leading-relaxed whitespace-pre-line">
                  {exhibition.narrative}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Garments Grid */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-light mb-8 text-archive-muted-subtle">
            Garments in This Exhibition
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {garments.map((garment) => (
              <a
                key={garment.id}
                href={`/garments/${garment.slug}`}
                className="group border border-archive-border bg-archive-surface/50 hover:border-archive-border-hover transition-all duration-300 hover:bg-archive-surface"
              >
                <div className="relative w-full aspect-[3/4] bg-archive-surface overflow-hidden">
                  {garment.thumbnailUrl || (garment.images && garment.images.length > 0) ? (
                    <div className="absolute inset-0 flex items-center justify-center text-archive-muted text-sm">
                      <div className="text-center">
                        <p className="mb-2">Thumbnail</p>
                        <p className="text-xs text-archive-muted">
                          {garment.thumbnailUrl || garment.images[0]}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-archive-muted text-sm">
                      <p>Image Placeholder</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-archive-bg/0 group-hover:bg-archive-bg/20 transition-colors duration-300" />
                </div>
                <div className="p-6 space-y-3">
                  <div>
                    <h3 className="text-lg md:text-xl font-light tracking-tight mb-2 group-hover:text-archive-fg transition-colors">
                      {garment.name || garment.label || garment.editorial_title}
                    </h3>
                    <p className="text-sm text-archive-muted font-light">
                      {garment.decade || garment.date || ''} {garment.work_type ? `• ${garment.work_type}` : ''}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

