"use client";

import { EducationalContent } from "@/data/educationalContent";
import Link from "next/link";
import { BookOpen, Clock, Scissors, Palette, History } from "lucide-react";

interface LearnPageClientProps {
  content: EducationalContent[];
}

const categoryIcons = {
  era: Clock,
  material: Scissors,
  technique: Palette,
  history: History,
};

const categoryLabels = {
  era: "Eras",
  material: "Materials",
  technique: "Techniques",
  history: "History",
};

export default function LearnPageClient({ content }: LearnPageClientProps) {
  const contentByCategory = {
    era: content.filter((c) => c.category === "era"),
    material: content.filter((c) => c.category === "material"),
    technique: content.filter((c) => c.category === "technique"),
    history: content.filter((c) => c.category === "history"),
  };

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

        {/* Category Sections */}
        {Object.entries(contentByCategory).map(([category, items]) => {
          if (items.length === 0) return null;
          const Icon = categoryIcons[category as keyof typeof categoryIcons];

          return (
            <div key={category} className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <Icon className="w-6 h-6 text-archive-muted" />
                <h2 className="text-2xl md:text-3xl font-light">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/learn/${item.id}`}
                    className="group border border-archive-border bg-archive-surface/50 hover:border-archive-border-hover hover:bg-archive-surface transition-[border-color,background-color] duration-200 ease-out"
                  >
                    <div className="p-6 space-y-3">
                      <h3 className="text-lg md:text-xl font-light group-hover:text-archive-fg transition-colors">
                        {item.title}
                      </h3>
                      {item.subtitle && (
                        <p className="text-sm text-archive-muted font-light">
                          {item.subtitle}
                        </p>
                      )}
                      <p className="text-xs md:text-sm text-archive-muted-subtle font-light leading-[1.7] line-clamp-3">
                        {item.content.split("\n\n")[0]}
                      </p>
                      <div className="pt-2 flex items-center gap-2 text-xs text-archive-muted group-hover:text-archive-fg/90 transition-colors duration-200">
                        <BookOpen className="w-3 h-3" />
                        <span>Read more →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
