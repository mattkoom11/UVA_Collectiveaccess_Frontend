"use client";

import { EducationalContent } from "@/data/educationalContent";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface LearnDetailClientProps {
  content: EducationalContent;
}

export default function LearnDetailClient({ content }: LearnDetailClientProps) {
  return (
    <div className="min-h-screen bg-archive-bg text-archive-fg">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Back Button */}
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 text-sm text-archive-muted hover:text-archive-fg transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Learn
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-archive-muted mb-4">
            {content.category}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="text-lg md:text-xl text-archive-muted font-light">
              {content.subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-zinc max-w-none">
          <div className="text-base md:text-lg text-archive-muted-subtle font-light leading-relaxed whitespace-pre-line">
            {content.content.split("\n\n").map((paragraph, index) => {
              // Handle markdown-like formatting
              if (paragraph.startsWith("- **")) {
                // List item with bold
                return (
                  <div key={index} className="mb-4 pl-4 border-l-2 border-archive-border">
                    <p className="text-archive-muted-subtle">{paragraph.replace(/^- \*\*/, "**").replace(/\*\*:/, ":")}</p>
                  </div>
                );
              } else if (paragraph.startsWith("**")) {
                // Bold heading
                return (
                  <h2 key={index} className="text-xl font-light text-archive-fg mt-8 mb-4">
                    {paragraph.replace(/\*\*/g, "")}
                  </h2>
                );
              } else {
                return (
                  <p key={index} className="mb-6">
                    {paragraph}
                  </p>
                );
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

