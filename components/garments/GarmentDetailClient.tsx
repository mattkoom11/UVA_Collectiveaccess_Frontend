"use client";

import { useState, useEffect } from "react";
import { Garment, getEraFromDecade, getGarmentTypeFromWorkType } from "@/types/garment";
import Link from "next/link";
import Image from "next/image";
import Garment3DViewer from "./Garment3DViewer";
import ImageGallery from "./ImageGallery";
import { Share2, Download, ExternalLink, Printer, BookOpen } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import CompareButton from "./CompareButton";
import SocialShare from "./SocialShare";
import { getEducationalContentByEra, getEducationalContentByMaterial } from "@/data/educationalContent";
import { getAnalytics } from "@/lib/analytics";

interface GarmentDetailClientProps {
  garment: Garment;
  relatedGarments: Garment[];
}

export default function GarmentDetailClient({ garment, relatedGarments }: GarmentDetailClientProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"images" | "3d">("images");

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

  // Track garment view
  useEffect(() => {
    const analytics = getAnalytics();
    analytics.trackGarmentView(garment.id, editorialTitle);
  }, [garment.id, editorialTitle]);


  return (
    <>
      <div className="min-h-screen bg-archive-bg text-archive-fg">
        {/* Hero section - full width, magazine-style */}
        <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Background image overlay */}
          {garment.images && garment.images.length > 0 && (
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-gradient-to-b from-archive-bg via-archive-bg/80 to-archive-bg" />
            </div>
          )}
          
          {/* Hero content */}
          <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
            {/* Category badge */}
            <div className="inline-block mb-8">
              <span className="text-xs uppercase tracking-[0.3em] text-archive-muted border border-archive-border px-6 py-2">
                {garment.work_type || "Garment"}
              </span>
            </div>
            
            {/* Editorial title - Vogue-style large typography */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-6 leading-[0.95]">
              {editorialTitle}
            </h1>
            
            {/* Editorial subtitle - elegant tagline */}
            <p className="text-lg md:text-xl text-archive-fg font-light tracking-wide mb-6 max-w-2xl mx-auto">
              {editorialSubtitle}
            </p>
            
            {/* Tagline - 1-2 sentence editorial hook */}
            {tagline && (
              <p className="text-base md:text-lg text-archive-muted font-light italic tracking-wide mb-12 max-w-xl mx-auto">
                {tagline}
              </p>
            )}
            
            {/* Action buttons */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <FavoriteButton garmentId={garment.id} variant="button" />
              <CompareButton garmentId={garment.id} variant="button" />
              <SocialShare
                url={`/garments/${garment.slug}`}
                title={editorialTitle}
                description={tagline || aestheticDescription}
              />
              <button
                onClick={() => window.print()}
                className="text-xs uppercase tracking-[0.2em] text-archive-muted hover:text-archive-fg transition-colors border border-archive-border px-4 py-2 hover:border-archive-border-hover flex items-center gap-2 print-hide"
                aria-label="Print page"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
            
            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-4 mb-12 mt-12">
              <div className="h-px w-16 bg-archive-border" />
              <div className="w-2 h-2 border border-archive-border rotate-45" />
              <div className="h-px w-16 bg-archive-border" />
            </div>
          </div>
        </section>

        {/* Main editorial content */}

        {/* Two-column layout: images (left) + metadata (right) */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
            {/* Left column: images + editorial prose */}
            <div className="w-full lg:w-[55%] min-w-0">
              {/* Tab bar — only show 3D tab if model exists */}
              {garment.model3d_url && (
                <div className="flex gap-0 border-b border-archive-border mb-6">
                  {(["images", "3d"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors ${
                        activeTab === tab
                          ? "border-b-2 border-archive-fg text-archive-fg -mb-px"
                          : "text-archive-muted hover:text-archive-fg"
                      }`}
                    >
                      {tab === "images" ? "Images" : "3D Model"}
                    </button>
                  ))}
                </div>
              )}

              {/* Primary image */}
              {activeTab === "images" && garment.images && garment.images.length > 0 && (
                <div
                  className="relative w-full aspect-[3/4] mb-6 overflow-hidden cursor-pointer group"
                  onClick={() => handleImageClick(0)}
                >
                  {garment.images[0] ? (
                    <Image
                      src={garment.images[0]}
                      alt={editorialTitle}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 1024px) 100vw, 55vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-archive-surface flex items-center justify-center">
                      <span className="text-archive-muted text-sm">No image</span>
                    </div>
                  )}
                </div>
              )}

              {/* Additional images */}
              {activeTab === "images" && garment.images && garment.images.length > 1 && (
                <div className="grid grid-cols-3 gap-2 mb-10">
                  {garment.images.slice(1, 4).map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-[3/4] overflow-hidden cursor-pointer group"
                      onClick={() => handleImageClick(i + 1)}
                    >
                      <Image
                        src={img}
                        alt={`${editorialTitle} — view ${i + 2}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 1024px) 33vw, 18vw"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 3D Viewer tab content — only mounts when 3D tab is active */}
              {garment.model3d_url && activeTab === "3d" && (
                <div className="mb-10">
                  <Garment3DViewer
                    modelUrl={garment.model3d_url}
                    garmentId={garment.id}
                    garment={garment}
                  />
                </div>
              )}

              {/* Aesthetic description */}
              <div className="mb-10">
                <p className="text-base text-archive-muted font-light leading-[1.8]">
                  {aestheticDescription}
                </p>
              </div>

              {/* Editorial prose — full width below images */}
              {(story || context || curatorNote) && (
                <div className="space-y-10 pt-4 border-t border-archive-border">
                  {story && (
                    <section>
                      <h2 className="text-xs uppercase tracking-[0.3em] text-archive-muted mb-4">The Story</h2>
                      <p className="text-base text-archive-muted font-light leading-[1.8]">{story}</p>
                    </section>
                  )}
                  {context && (
                    <section>
                      <h2 className="text-xs uppercase tracking-[0.3em] text-archive-muted mb-4">Historical Context</h2>
                      <p className="text-base text-archive-muted font-light leading-[1.8]">{context}</p>
                    </section>
                  )}
                  {curatorNote && (
                    <section>
                      <h2 className="text-xs uppercase tracking-[0.3em] text-archive-muted mb-4">Curator&apos;s Note</h2>
                      <p className="text-base italic text-archive-muted font-light leading-[1.8]">{curatorNote}</p>
                    </section>
                  )}
                </div>
              )}
            </div>

            {/* Right column: metadata panel (sticky on desktop) */}
            <div
              className="w-full lg:w-[45%] shrink-0 lg:sticky"
              style={{ top: "calc(var(--header-h, 73px) + 1.5rem)", maxHeight: "calc(100vh - var(--header-h, 73px) - 3rem)", overflowY: "auto" }}
            >
              {/* Work type badge */}
              <div className="mb-4">
                <span className="text-xs uppercase tracking-[0.2em] border border-archive-border text-archive-muted px-3 py-1">
                  {garment.work_type || "Garment"}
                </span>
              </div>

              {/* Title */}
              <p
                className="text-2xl font-light text-archive-fg mb-1 leading-snug"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}
              >
                {editorialTitle}
              </p>

              {/* Accession number */}
              {garment.accessionNumber && (
                <p className="font-mono text-sm text-archive-muted mb-6">
                  {garment.accessionNumber}
                </p>
              )}

              {/* Metadata definition list */}
              <dl className="space-y-0 mb-8">
                {[
                  { label: "Era", value: era },
                  { label: "Type", value: garment.work_type },
                  { label: "Date", value: garment.date },
                  { label: "Decade", value: garment.decade },
                  { label: "Materials", value: Array.isArray(garment.materials) ? garment.materials.join(", ") : garment.materials },
                  { label: "Colors", value: garment.colors?.join(", ") },
                  { label: "Dimensions", value: garment.dimensions },
                  { label: "Condition", value: garment.condition },
                  { label: "Provenance", value: garment.provenance },
                  { label: "Collection", value: garment.collection },
                  { label: "Storage Location", value: garment.storageLocation },
                ]
                  .filter(({ value }) => value)
                  .map(({ label, value }) => (
                    <div key={label} className="flex gap-4 py-2 border-b border-archive-border/40">
                      <dt className="text-[11px] uppercase tracking-[0.15em] text-archive-muted w-32 shrink-0 pt-0.5">
                        {label}
                      </dt>
                      <dd className="text-sm text-archive-fg flex-1">
                        {String(value)}
                      </dd>
                    </div>
                  ))}
              </dl>

              {/* Actions */}
              <div className="flex gap-3 flex-wrap mb-6">
                <FavoriteButton garmentId={garment.id} variant="button" />
                <CompareButton garmentId={garment.id} variant="button" />
              </div>

              {/* Back link */}
              <Link
                href="/collection"
                className="text-xs uppercase tracking-[0.2em] text-archive-muted hover:text-archive-fg transition-colors"
              >
                ← Back to Collection
              </Link>
            </div>
          </div>
        </div>

        {/* Related garments */}
        <div className="max-w-6xl mx-auto px-4 pb-20">
          {relatedGarments.length > 0 && (
            <section className="border-t border-archive-border pt-12">
              <h2 className="text-xs uppercase tracking-[0.3em] text-archive-muted mb-8 text-center">
                Related Garments
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedGarments.map((related) => (
                  <Link
                    key={related.id}
                    href={`/garments/${related.slug}`}
                    className="group border border-archive-border bg-archive-surface hover:border-archive-muted transition-all duration-300"
                  >
                    <div className="relative w-full aspect-[3/4] bg-archive-surface overflow-hidden">
                      {(related.thumbnailUrl || (related.images && related.images[0])) ? (
                        <Image
                          src={related.thumbnailUrl || related.images[0]}
                          alt={related.name || related.label || related.editorial_title || "Related garment"}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-archive-muted text-xs">
                          <p>No image</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-1">
                      <h3 className="text-sm font-light tracking-tight group-hover:text-archive-fg transition-colors line-clamp-2">
                        {related.name || related.label || related.editorial_title}
                      </h3>
                      <p className="text-xs text-archive-muted font-light">
                        {related.decade || related.date || ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
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

