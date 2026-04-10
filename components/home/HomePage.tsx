"use client";

import { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Garment } from "@/types/garment";

export default function HomePage() {
  const [garments, setGarments] = useState<Garment[]>([]);

  useEffect(() => {
    fetch("/api/garments")
      .then((r) => r.json())
      .then((data) => setGarments(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const total = garments.length;
  const types = [...new Set(garments.map((g) => g.work_type).filter(Boolean))];
  const eras = [...new Set(garments.map((g) => g.era).filter(Boolean))];
  const recent = garments.slice(0, 6);

  return (
    <PageLayout>
      {/* Hero — fluid display title, comfortable measure for intro */}
      <section className="border-b border-archive-border py-[var(--space-3xl)] md:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-archive-muted-subtle">
            University of Virginia
          </p>
          <h1 className="hero-display">
            Historic Clothing Collection
          </h1>
          <p className="text-base md:text-lg text-archive-muted font-light max-w-[min(36rem,70ch)] mx-auto leading-[1.7]">
            A digital catalog of historic garments from the University of Virginia archive.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/collection"
              className="px-6 py-3 text-sm uppercase tracking-[0.15em] font-light border border-archive-border-hover text-archive-fg/90 hover:bg-archive-surface transition-colors duration-200 ease-out"
            >
              Browse Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Collection stats — slight rhythm: first metric reads as anchor */}
      {total > 0 && (
        <section className="border-b border-archive-border py-[var(--space-2xl)]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-archive-border">
              <div className="bg-archive-bg px-8 py-12 md:py-14 text-center space-y-2">
                <div
                  className="text-5xl md:text-6xl font-light tabular-nums text-archive-fg"
                  style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                >
                  {total.toLocaleString()}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-archive-muted">Garments</div>
              </div>
              <div className="bg-archive-bg px-8 py-10 text-center space-y-1">
                <div
                  className="text-4xl md:text-5xl font-light tabular-nums text-archive-fg"
                  style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                >
                  {types.length}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-archive-muted">Types</div>
              </div>
              <div className="bg-archive-bg px-8 py-10 text-center space-y-1">
                <div
                  className="text-4xl md:text-5xl font-light tabular-nums text-archive-fg"
                  style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                >
                  {eras.length}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-archive-muted">Eras</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Garments */}
      {recent.length > 0 && (
        <section className="border-b border-archive-border py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-light text-archive-fg/90 uppercase tracking-[0.2em]">
                From the Archive
              </h2>
              <Link
                href="/collection"
                className="text-sm text-archive-muted hover:text-archive-fg transition-colors duration-200 flex items-center gap-2"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recent.map((garment) => (
                <Link
                  key={garment.id}
                  href={`/garments/${garment.slug}`}
                  className="group border border-archive-border hover:border-archive-border-hover transition-colors duration-200"
                >
                  <div className="aspect-[3/4] bg-archive-surface flex flex-col items-center justify-center p-3 gap-2">
                    <div className="w-8 h-8 border border-archive-border flex items-center justify-center">
                      <svg className="w-4 h-4 text-archive-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-[8px] uppercase tracking-widest text-archive-muted-subtle text-center">
                      {garment.accessionNumber}
                    </span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <div className="text-[9px] uppercase tracking-widest text-archive-muted truncate">
                      {garment.work_type || "Garment"}
                    </div>
                    <div
                      className="text-sm leading-tight text-archive-fg truncate"
                      style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                    >
                      {garment.label}
                    </div>
                    {garment.date && (
                      <div className="text-[10px] text-archive-muted">{garment.date}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Types index */}
      {types.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-archive-muted mb-8">Browse by Type</h2>
            <div className="flex flex-wrap gap-3">
              {types.map((type) => (
                <Link
                  key={type}
                  href={`/collection?type=${encodeURIComponent(type!)}`}
                  className="px-4 py-2 border border-archive-border text-sm text-archive-muted hover:border-archive-border-hover hover:text-archive-fg transition-colors duration-200 uppercase tracking-[0.1em] font-light"
                >
                  {type}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </PageLayout>
  );
}
