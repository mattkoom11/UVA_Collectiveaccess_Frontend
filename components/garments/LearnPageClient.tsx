"use client";

import { EducationalContent } from "@/data/educationalContent";
import { Sparkles } from "lucide-react";

interface LearnPageClientProps {
  // Held for when educational content is ready to ship — see the
  // "more to come" placeholder below.
  content: EducationalContent[];
}

export default function LearnPageClient({ content: _content }: LearnPageClientProps) {
  return (
    <div className="min-h-screen bg-archive-bg text-archive-fg">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="mb-12 md:mb-16 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
            Learn About Fashion History
          </h1>
          <p className="text-sm md:text-base text-archive-muted font-light max-w-[min(42rem,70ch)] mx-auto leading-[1.7]">
            Explore the history, materials, and techniques that shaped fashion through the ages
          </p>
        </div>

        {/* More to come */}
        <div className="flex flex-col items-center justify-center text-center py-20 md:py-28 px-4 border border-dashed border-archive-border">
          <Sparkles className="w-10 h-10 text-archive-muted mb-6" aria-hidden />
          <h2
            className="text-2xl md:text-3xl font-light tracking-tight mb-3"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            More to come!
          </h2>
          <p className="text-sm md:text-base text-archive-muted font-light max-w-md leading-[1.7]">
            We&rsquo;re building out lessons on eras, materials, and techniques.
            Check back soon.
          </p>
        </div>
      </div>
    </div>
  );
}
