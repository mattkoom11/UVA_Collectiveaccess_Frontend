"use client";

import { useState, useMemo } from "react";
import { Garment, getEraFromDecade, getGarmentTypeFromWorkType } from "@/types/garment";
import Link from "next/link";
import Image from "next/image";
import Garment3DViewer from "./Garment3DViewer";
import ImageGallery from "./ImageGallery";
import { Share2, Download, ExternalLink } from "lucide-react";
import { getEnhancedRelatedGarments } from "@/lib/relatedGarments";
import { getAllGarments } from "@/lib/garments";

interface GarmentDetailClientProps {
  garment: Garment;
  relatedGarments: Garment[];
}

export default function GarmentDetailClient({ garment, relatedGarments: initialRelatedGarments }: GarmentDetailClientProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Enhance related garments with algorithm-based recommendations
  const allGarments = useMemo(() => getAllGarments(), []);
  const relatedGarments = useMemo(() => {
    if (initialRelatedGarments.length > 0) {
      return initialRelatedGarments;
    }
    // If no explicit relations, use algorithm
    return getEnhancedRelatedGarments(garment, allGarments, 4);
  }, [garment, allGarments, initialRelatedGarments]);

  const editorialTitle = garment.editorial_title || garment.label;
  const editorialSubtitle = garment.editorial_subtitle || `${garment.work_type || "Garment"} · ${garment.decade || garment.date || ""}`;
  const tagline = garment.tagline || garment.editorial_subtitle;
  const aestheticDescription = garment.aesthetic_description || garment.description || "No description yet.";
  const story = garment.story;
  const inspiration = garment.inspiration;
  const context = garment.context;
  const curatorNote = garment.curatorNote;
  const era = garment.era || getEraFromDecade(garment.decade, garment.yearApprox, garment.date);
  const garmentType = garment.type || getGarmentTypeFromWorkType(garment.work_type);

  const handleImageClick = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: editorialTitle,
        text: tagline || aestheticDescription,
        url: window.location.href,
      }).catch(() => {
        // Fallback to copy
        navigator.clipboard.writeText(window.location.href);
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-zinc-950 text-zinc-50">
        {/* Hero section - full width, magazine-style */}
        <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Background image overlay */}
          {garment.images && garment.images.length > 0 && (
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-zinc-950" />
            </div>
          )}
          
          {/* Hero content */}
          <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
            {/* Category badge */}
            <div className="inline-block mb-8">
              <span className="text-xs uppercase tracking-[0.3em] text-zinc-400 border border-zinc-700 px-6 py-2">
                {garment.work_type || "Garment"}
              </span>
            </div>
            
            {/* Editorial title - Vogue-style large typography */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-6 leading-[0.95]">
              {editorialTitle}
            </h1>
            
            {/* Editorial subtitle - elegant tagline */}
            <p className="text-lg md:text-xl text-zinc-300 font-light tracking-wide mb-6 max-w-2xl mx-auto">
              {editorialSubtitle}
            </p>
            
            {/* Tagline - 1-2 sentence editorial hook */}
            {tagline && (
              <p className="text-base md:text-lg text-zinc-400 font-light italic tracking-wide mb-12 max-w-xl mx-auto">
                {tagline}
              </p>
            )}
            
            {/* Share button */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleShare}
                className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700 px-4 py-2 hover:border-zinc-500 flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
            
            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-4 mb-12 mt-12">
              <div className="h-px w-16 bg-zinc-700" />
              <div className="w-2 h-2 border border-zinc-700 rotate-45" />
              <div className="h-px w-16 bg-zinc-700" />
            </div>
          </div>
        </section>

        {/* Main editorial content */}
        <div className="max-w-5xl mx-auto px-4 py-16">
          {/* 3D Model Viewer - if available, otherwise show images */}
          {garment.model3d_url ? (
            <section className="mb-20">
              <Garment3DViewer modelUrl={garment.model3d_url} garmentId={garment.id} />
              <p className="text-xs text-zinc-500 italic text-center tracking-wide mt-4">
                Interactive 3D model • {editorialTitle}
              </p>
            </section>
          ) : garment.images && garment.images.length > 0 ? (
            <section className="mb-20">
              <div 
                className="relative w-full aspect-[4/5] md:aspect-[3/4] mb-8 overflow-hidden cursor-pointer group"
                onClick={() => handleImageClick(0)}
              >
                {garment.images[0] ? (
                  <Image
                    src={garment.images[0]}
                    alt={editorialTitle}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 80vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                    <div className="text-center text-zinc-500 text-sm">
                      <p>Primary Image</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-200 text-sm uppercase tracking-[0.2em]">
                    Click to View
                  </div>
                </div>
              </div>
              
              {/* Image caption */}
              <p className="text-xs text-zinc-500 italic text-center tracking-wide">
                {editorialTitle}
              </p>
            </section>
          ) : null}

          {/* Aesthetic description - flowing prose */}
          <section className="mb-20">
            <div className="max-w-3xl mx-auto">
              <div className="prose prose-invert prose-lg max-w-none">
                <p className="text-xl md:text-2xl font-light leading-relaxed text-zinc-200 text-center mb-12 tracking-wide">
                  {aestheticDescription}
                </p>
              </div>
            </div>
          </section>

          {/* Story section - if available */}
          {story && (
            <section className="mb-20">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-6 text-center">
                  The Story
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-base md:text-lg leading-relaxed text-zinc-300 text-center font-light">
                    {story}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Additional images grid - editorial style */}
          {garment.images && garment.images.length > 1 && (
            <section className="mb-20">
              <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-8 text-center">
                Additional Views
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {garment.images.slice(1).map((imageSrc, i) => (
                  <div
                    key={i}
                    className="relative aspect-[3/4] bg-zinc-900 overflow-hidden cursor-pointer group"
                    onClick={() => handleImageClick(i + 1)}
                  >
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={`${editorialTitle} - View ${i + 2}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
                        <p>Image {i + 2}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-200 text-xs uppercase tracking-[0.2em]">
                        View
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Inspiration & Context - side by side */}
          {(inspiration || context) && (
            <section className="mb-20 grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              {inspiration && (
                <div>
                  <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-4">
                    Inspiration
                  </h2>
                  <p className="text-sm md:text-base leading-relaxed text-zinc-300 font-light">
                    {inspiration}
                  </p>
                </div>
              )}
              {context && (
                <div>
                  <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-4">
                    Context
                  </h2>
                  <p className="text-sm md:text-base leading-relaxed text-zinc-300 font-light">
                    {context}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Timeline/Context block */}
          {era && (
            <section className="mb-20 bg-zinc-900/50 border border-zinc-800 p-8 md:p-12">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-6 text-center">
                  Timeline & Context
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-400 mb-3 font-light">
                      Decade
                    </h3>
                    <p className="text-lg text-zinc-200 font-light">
                      {garment.decade || garment.date || era.replace('-', '–')}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-400 mb-3 font-light">
                      Fashion Trends
                    </h3>
                    {context ? (
                      <p className="text-base leading-relaxed text-zinc-300 font-light">
                        {context}
                      </p>
                    ) : (
                      <p className="text-base leading-relaxed text-zinc-400 font-light italic">
                        {era === 'pre-1920' && 'Early 20th century fashion emphasized structured silhouettes and traditional craftsmanship.'}
                        {era === '1920-1950' && 'This era saw dramatic shifts from the liberated flapper style to wartime utility, then post-war elegance.'}
                        {era === '1950-1980' && 'Mid-century fashion balanced sophisticated elegance with emerging youth culture and ready-to-wear innovation.'}
                        {era === '1980+' && 'Late 20th century fashion embraced bold expressions, designer labels, and diverse stylistic movements.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Curator's Note */}
          {curatorNote && (
            <section className="mb-20 border-t border-zinc-800 pt-12">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-6 text-center">
                  Curator's Note
                </h2>
                <p className="text-base md:text-lg leading-relaxed text-zinc-300 font-light italic text-center">
                  {curatorNote}
                </p>
              </div>
            </section>
          )}

          {/* Technical details - elegant presentation */}
          <section className="mb-20 border-t border-zinc-800 pt-12">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-8 text-center">
                Metadata
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-sm">
                {garment.accessionNumber && (
                  <>
                    <dt className="text-zinc-400 font-light">Accession Number</dt>
                    <dd className="text-zinc-200 font-mono">{garment.accessionNumber}</dd>
                  </>
                )}
                {garmentType && (
                  <>
                    <dt className="text-zinc-400 font-light">Garment Type</dt>
                    <dd className="text-zinc-200 capitalize">{garmentType}</dd>
                  </>
                )}
                {garment.date && (
                  <>
                    <dt className="text-zinc-400 font-light">Date</dt>
                    <dd className="text-zinc-200">{garment.date}</dd>
                  </>
                )}
                {garment.decade && (
                  <>
                    <dt className="text-zinc-400 font-light">Decade</dt>
                    <dd className="text-zinc-200">{garment.decade}</dd>
                  </>
                )}
                {garment.yearApprox && (
                  <>
                    <dt className="text-zinc-400 font-light">Year (approx.)</dt>
                    <dd className="text-zinc-200">{garment.yearApprox}</dd>
                  </>
                )}
                {garment.colors && garment.colors.length > 0 && (
                  <>
                    <dt className="text-zinc-400 font-light">Colors</dt>
                    <dd className="text-zinc-200">{garment.colors.join(", ")}</dd>
                  </>
                )}
                {garment.materials && (
                  <>
                    <dt className="text-zinc-400 font-light">Materials</dt>
                    <dd className="text-zinc-200">
                      {Array.isArray(garment.materials) 
                        ? garment.materials.join(", ")
                        : garment.materials}
                    </dd>
                  </>
                )}
                {garment.dimensions && (
                  <>
                    <dt className="text-zinc-400 font-light">Dimensions</dt>
                    <dd className="text-zinc-200">{garment.dimensions}</dd>
                  </>
                )}
                {garment.function && garment.function.length > 0 && (
                  <>
                    <dt className="text-zinc-400 font-light">Function</dt>
                    <dd className="text-zinc-200">{garment.function.join(", ")}</dd>
                  </>
                )}
                {garment.gender && (
                  <>
                    <dt className="text-zinc-400 font-light">Gender</dt>
                    <dd className="text-zinc-200">{garment.gender}</dd>
                  </>
                )}
                {garment.age && (
                  <>
                    <dt className="text-zinc-400 font-light">Age</dt>
                    <dd className="text-zinc-200">{garment.age}</dd>
                  </>
                )}
                {garment.collection && (
                  <>
                    <dt className="text-zinc-400 font-light">Collection</dt>
                    <dd className="text-zinc-200">{garment.collection}</dd>
                  </>
                )}
                {garment.provenance && (
                  <>
                    <dt className="text-zinc-400 font-light">Provenance</dt>
                    <dd className="text-zinc-200">{garment.provenance}</dd>
                  </>
                )}
                {garment.condition && (
                  <>
                    <dt className="text-zinc-400 font-light">Condition</dt>
                    <dd className="text-zinc-200">{garment.condition}</dd>
                  </>
                )}
              </dl>
            </div>
          </section>

          {/* Related garments */}
          {relatedGarments.length > 0 && (
            <section className="mb-20 border-t border-zinc-800 pt-12">
              <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-xs uppercase tracking-[0.3em] text-zinc-400 mb-8 text-center">
                  Related Garments
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {relatedGarments.map((related) => (
                    <Link
                      key={related.id}
                      href={`/garments/${related.slug}`}
                      className="group border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300"
                    >
                      <div className="relative w-full aspect-[3/4] bg-zinc-900 overflow-hidden">
                        {related.thumbnailUrl || (related.images && related.images[0]) ? (
                          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                            <p>Thumbnail</p>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                            <p>Image</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/20 transition-colors duration-300" />
                      </div>
                      <div className="p-4 space-y-1">
                        <h3 className="text-sm font-light tracking-tight group-hover:text-zinc-200 transition-colors line-clamp-2">
                          {related.name || related.label || related.editorial_title}
                        </h3>
                        <p className="text-xs text-zinc-400 font-light">
                          {related.decade || related.date || ''}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Navigation */}
          <section className="text-center pt-8 border-t border-zinc-800">
            <Link
              href="/collection"
              className="inline-block text-xs uppercase tracking-[0.25em] text-zinc-400 hover:text-zinc-200 transition border border-zinc-700 px-6 py-3 hover:border-zinc-500"
            >
              ← Back to Collection
            </Link>
          </section>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {galleryOpen && garment.images && garment.images.length > 0 && (
        <ImageGallery
          images={garment.images}
          title={editorialTitle}
          startIndex={galleryIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
}

