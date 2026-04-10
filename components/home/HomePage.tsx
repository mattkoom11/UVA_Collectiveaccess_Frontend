"use client";

import { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Garment } from "@/types/garment";

export default function HomePage() {
  const router = useRouter();
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
      {/* Hero */}
      <section className="border-b border-zinc-800 py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">University of Virginia</p>
          <h1
            className="text-4xl md:text-6xl font-light leading-tight"
            style={{ fontFamily: "var(--font-display), Georgia, serif", color: "#f0ede8" }}
          >
            Historic Clothing Collection
          </h1>
          <p className="text-base md:text-lg text-zinc-400 font-light max-w-xl mx-auto">
            A digital catalog of historic garments from the University of Virginia archive.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/collection"
              className="px-6 py-3 text-sm uppercase tracking-[0.15em] font-light border border-zinc-400 text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Browse Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Collection Stats */}
      {total > 0 && (
        <section className="border-b border-zinc-800 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-3 gap-px bg-zinc-800">
              <div className="bg-zinc-950 px-8 py-10 text-center space-y-1">
                <div
                  className="text-4xl md:text-5xl font-light"
                  style={{ fontFamily: "var(--font-display), Georgia, serif", color: "#f0ede8" }}
                >
                  {total.toLocaleString()}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Garments</div>
              </div>
              <div className="bg-zinc-950 px-8 py-10 text-center space-y-1">
                <div
                  className="text-4xl md:text-5xl font-light"
                  style={{ fontFamily: "var(--font-display), Georgia, serif", color: "#f0ede8" }}
                >
                  {types.length}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Types</div>
              </div>
              <div className="bg-zinc-950 px-8 py-10 text-center space-y-1">
                <div
                  className="text-4xl md:text-5xl font-light"
                  style={{ fontFamily: "var(--font-display), Georgia, serif", color: "#f0ede8" }}
                >
                  {eras.length}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Eras</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Garments */}
      {recent.length > 0 && (
        <section className="border-b border-zinc-800 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-light text-zinc-300 uppercase tracking-[0.15em] text-sm">
                From the Archive
              </h2>
              <Link
                href="/collection"
                className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-2"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recent.map((garment) => (
                <Link
                  key={garment.id}
                  href={`/garments/${garment.slug}`}
                  className="group border border-zinc-800 hover:border-zinc-600 transition-colors"
                >
                  <div className="aspect-[3/4] bg-zinc-900 flex flex-col items-center justify-center p-3 gap-2">
                    <div className="w-8 h-8 border border-zinc-700 flex items-center justify-center">
                      <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-[8px] uppercase tracking-widest text-zinc-600 text-center">
                      {garment.accessionNumber}
                    </span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <div className="text-[9px] uppercase tracking-widest text-zinc-500 truncate">
                      {garment.work_type || "Garment"}
                    </div>
                    <div
                      className="text-sm leading-tight text-zinc-200 truncate"
                      style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                    >
                      {garment.label}
                    </div>
                    {garment.date && (
                      <div className="text-[10px] text-zinc-500">{garment.date}</div>
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
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-8">Browse by Type</h2>
            <div className="flex flex-wrap gap-3">
              {types.map((type) => (
                <Link
                  key={type}
                  href={`/collection?type=${encodeURIComponent(type!)}`}
                  className="px-4 py-2 border border-zinc-800 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors uppercase tracking-[0.1em] font-light"
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
