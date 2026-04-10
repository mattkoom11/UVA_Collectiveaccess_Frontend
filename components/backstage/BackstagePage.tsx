"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sampleGarments, type Garment as SampleGarment } from "@/data/sampleGarments";
import { getAllGarments, getGarmentById } from "@/lib/garments";
import { Garment } from "@/types/garment";
import { shows, getShowById, getGarmentsForShow } from "@/data/shows";
import PageLayout from "@/components/layout/PageLayout";
import Backstage3D from "@/components/backstage/Backstage3D";
import { ErrorBoundary } from "@/components/backstage/ErrorBoundary";

interface BackstagePageProps {
  garmentId: string;
}

export default function BackstagePage({ garmentId }: BackstagePageProps) {
  const searchParams = useSearchParams();
  const showId = searchParams.get("show") || "";
  
  // Check both sampleGarments and main garments
  let garment: SampleGarment | Garment | undefined = sampleGarments.find(g => g.id === garmentId);
  if (!garment) {
    garment = getGarmentById(garmentId);
  }
  
  const show = showId ? getShowById(showId) : null;
  const relatedGarments = show && garment
    ? getGarmentsForShow(show, sampleGarments).filter(g => g.id !== garmentId)
    : [];

  // Helper to get display values from either garment type
  const getTitle = () => {
    if (!garment) return "Unknown";
    return 'title' in garment ? garment.title : (garment.name || garment.label || garment.editorial_title || "Untitled");
  };

  const getYear = () => {
    if (!garment) return "";
    return 'year' in garment ? garment.year : (garment.date || garment.decade || "");
  };

  const getDesigner = () => {
    if (!garment) return "";
    return 'designer' in garment ? garment.designer : "";
  };

  const getPrimaryImage = () => {
    if (!garment) return "";
    return 'primaryImage' in garment ? garment.primaryImage : (garment.images?.[0] || "");
  };

  const getMaterials = () => {
    if (!garment) return [];
    if ('materials' in garment && Array.isArray(garment.materials)) {
      return garment.materials;
    }
    if ('materials' in garment && typeof garment.materials === 'string') {
      return [garment.materials];
    }
    return Array.isArray(garment.materials) ? garment.materials : [];
  };

  const getColors = () => {
    if (!garment) return [];
    return garment.colors || [];
  };

  const getCollection = () => {
    if (!garment) return "";
    return 'collection' in garment ? garment.collection : (garment.collection || "");
  };

  const getAccessionNumber = () => {
    if (!garment) return "";
    return 'accessionNumber' in garment ? garment.accessionNumber : (garment.accessionNumber || "");
  };

  const getSilhouette = () => {
    if (!garment) return "";
    return 'silhouette' in garment ? garment.silhouette : (garment.work_type || "");
  };

  const getTags = () => {
    if (!garment) return [];
    return 'tags' in garment ? garment.tags : [];
  };

  if (!garment) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-light mb-4">Garment Not Found</h1>
            <Link href="/" className="text-sm uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-200 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        {/* Breadcrumb Navigation */}
        <section className="border-b border-zinc-800 bg-zinc-900/50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <nav className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-light text-zinc-400">
              <Link href="/" className="hover:text-zinc-200 transition-colors">
                Home
              </Link>
              {show && (
                <>
                  <span>•</span>
                  <Link
                    href={`/runway?show=${show.id}`}
                    className="hover:text-zinc-200 transition-colors"
                  >
                    {show.title}
                  </Link>
                </>
              )}
              <span>•</span>
              <span className="text-zinc-200">{getTitle()}</span>
            </nav>
          </div>
        </section>

        {/* 3D Backstage Viewer */}
        <section className="w-full h-[calc(100vh-300px)] min-h-[600px] border-b border-zinc-800 relative">
          <ErrorBoundary>
            <Backstage3D
              onGarmentSelected={(id) => {
                // Use router for navigation instead of window.location
                if (typeof window !== 'undefined') {
                  window.location.href = `/backstage/${id}`;
                }
              }}
              garmentId={garmentId}
              garmentPositions={[[0, 0.45, -8]]}
            />
          </ErrorBoundary>
        </section>

        {/* Selected Garment Details */}
        <section className="border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
              {/* Garment Image */}
              <div className="relative w-full aspect-[3/4] bg-zinc-900 overflow-hidden border border-zinc-800">
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                  {/* Placeholder for image */}
                  <div className="text-center">
                    <p className="mb-2">Primary Image</p>
                    <p className="text-xs text-zinc-700">{getPrimaryImage() || "No image available"}</p>
                  </div>
                </div>
              </div>

              {/* Garment Details */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-3">
                    {getTitle()}
                  </h1>
                  <p className="text-lg text-zinc-400 font-light">
                    {getYear()}{getDesigner() ? ` • ${getDesigner()}` : ""}
                  </p>
                </div>

                {/* Metadata Sidebar */}
                <div className="space-y-4 pt-6 border-t border-zinc-800">
                  {getSilhouette() && (
                    <div>
                      <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">
                        Silhouette
                      </h3>
                      <p className="text-sm text-zinc-300 font-light">{getSilhouette()}</p>
                    </div>
                  )}

                  {getMaterials().length > 0 && (
                    <div>
                      <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">
                        Materials
                      </h3>
                      <p className="text-sm text-zinc-300 font-light">
                        {getMaterials().join(", ")}
                      </p>
                    </div>
                  )}

                  {getColors().length > 0 && (
                    <div>
                      <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">
                        Colors
                      </h3>
                      <p className="text-sm text-zinc-300 font-light">
                        {getColors().join(", ")}
                      </p>
                    </div>
                  )}

                  {getCollection() && (
                    <div>
                      <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">
                        Collection
                      </h3>
                      <p className="text-sm text-zinc-300 font-light">{getCollection()}</p>
                    </div>
                  )}

                  {getAccessionNumber() && (
                    <div>
                      <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">
                        Accession Number
                      </h3>
                      <p className="text-sm text-zinc-300 font-light font-mono">
                        {getAccessionNumber()}
                      </p>
                    </div>
                  )}

                  {getTags().length > 0 && (
                    <div>
                      <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {getTags().map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs text-zinc-400 border border-zinc-700 px-3 py-1 font-light"
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
          <section className="bg-zinc-900/30">
            <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-2">
                  From This Show
                </h2>
                <p className="text-sm text-zinc-400 font-light">
                  Other garments from {show?.title}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {relatedGarments.map((relatedGarment) => (
                  <Link
                    key={relatedGarment.id}
                    href={`/backstage/${relatedGarment.id}?show=${showId}`}
                    className="group border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300"
                  >
                    {/* Related Garment Image */}
                    <div className="relative w-full aspect-[3/4] bg-zinc-900 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                        {/* Placeholder for image */}
                        <div className="text-center">
                          <p className="mb-1">Primary Image</p>
                          <p className="text-[0.65rem] text-zinc-700 truncate max-w-[200px]">
                            {relatedGarment.primaryImage}
                          </p>
                        </div>
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/20 transition-colors duration-300" />
                    </div>

                    {/* Related Garment Info */}
                    <div className="p-4 space-y-2">
                      <h3 className="text-base font-light tracking-tight group-hover:text-zinc-200 transition-colors">
                        {relatedGarment.title}
                      </h3>
                      <p className="text-xs text-zinc-400 font-light">
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

