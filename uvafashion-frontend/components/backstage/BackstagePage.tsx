"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sampleGarments, type Garment } from "@/data/sampleGarments";
import { shows, getShowById, getGarmentsForShow } from "@/data/shows";
import PageLayout from "@/components/layout/PageLayout";

interface BackstagePageProps {
  garmentId: string;
}

export default function BackstagePage({ garmentId }: BackstagePageProps) {
  const searchParams = useSearchParams();
  const showId = searchParams.get("show") || "";
  
  const garment = sampleGarments.find(g => g.id === garmentId);
  const show = showId ? getShowById(showId) : null;
  const relatedGarments = show && garment
    ? getGarmentsForShow(show, sampleGarments).filter(g => g.id !== garmentId)
    : [];

  if (!garment) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-zinc-50 text-zinc-950 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-light mb-4">Garment Not Found</h1>
            <Link href="/runway" className="text-sm uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-900 transition-colors">
              ← Back to Runway
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-zinc-50 text-zinc-950">
        {/* Breadcrumb Navigation */}
        <section className="border-b border-zinc-200 bg-zinc-100/50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <nav className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-light text-zinc-600">
              <Link href="/runway" className="hover:text-zinc-900 transition-colors">
                Runway
              </Link>
              {show && (
                <>
                  <span>•</span>
                  <Link
                    href={`/runway?show=${show.id}`}
                    className="hover:text-zinc-900 transition-colors"
                  >
                    {show.title}
                  </Link>
                </>
              )}
              <span>•</span>
              <span className="text-zinc-900">{garment.title}</span>
            </nav>
          </div>
        </section>

        {/* Selected Garment */}
        <section className="border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
              {/* Garment Image */}
              <div className="relative w-full aspect-[3/4] bg-zinc-200 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">
                  {/* Placeholder for image */}
                  <div className="text-center">
                    <p className="mb-2">Primary Image</p>
                    <p className="text-xs text-zinc-500">{garment.primaryImage}</p>
                  </div>
                </div>
              </div>

              {/* Garment Details */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-3">
                    {garment.title}
                  </h1>
                  <p className="text-lg text-zinc-600 font-light">
                    {garment.year} • {garment.designer}
                  </p>
                </div>

                {/* Metadata Sidebar */}
                <div className="space-y-4 pt-6 border-t border-zinc-200">
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">
                      Silhouette
                    </h3>
                    <p className="text-sm text-zinc-700 font-light">{garment.silhouette}</p>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">
                      Materials
                    </h3>
                    <p className="text-sm text-zinc-700 font-light">
                      {garment.materials.join(", ")}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">
                      Colors
                    </h3>
                    <p className="text-sm text-zinc-700 font-light">
                      {garment.colors.join(", ")}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">
                      Collection
                    </h3>
                    <p className="text-sm text-zinc-700 font-light">{garment.collection}</p>
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">
                      Accession Number
                    </h3>
                    <p className="text-sm text-zinc-700 font-light font-mono">
                      {garment.accessionNumber}
                    </p>
                  </div>

                  {garment.tags && garment.tags.length > 0 && (
                    <div>
                      <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {garment.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs text-zinc-600 border border-zinc-300 px-3 py-1 font-light"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Garments Grid */}
        {relatedGarments.length > 0 && (
          <section className="bg-zinc-100/30">
            <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-2">
                  From This Show
                </h2>
                <p className="text-sm text-zinc-600 font-light">
                  Other garments from {show?.title}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {relatedGarments.map((relatedGarment) => (
                  <Link
                    key={relatedGarment.id}
                    href={`/backstage/${relatedGarment.id}?show=${showId}`}
                    className="group border border-zinc-200 bg-white hover:border-zinc-400 transition-all duration-300"
                  >
                    {/* Related Garment Image */}
                    <div className="relative w-full aspect-[3/4] bg-zinc-200 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs">
                        {/* Placeholder for image */}
                        <div className="text-center">
                          <p className="mb-1">Primary Image</p>
                          <p className="text-[0.65rem] text-zinc-500 truncate max-w-[200px]">
                            {relatedGarment.primaryImage}
                          </p>
                        </div>
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/5 transition-colors duration-300" />
                    </div>

                    {/* Related Garment Info */}
                    <div className="p-4 space-y-2">
                      <h3 className="text-base font-light tracking-tight group-hover:text-zinc-700 transition-colors">
                        {relatedGarment.title}
                      </h3>
                      <p className="text-xs text-zinc-500 font-light">
                        {relatedGarment.year} • {relatedGarment.designer}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
}

