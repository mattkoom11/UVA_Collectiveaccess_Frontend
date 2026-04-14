"use client";

import Image from "next/image";
import { useState } from "react";
import { Garment } from "@/types/garment";

interface Props {
  garment: Garment;
  variant?: "runway" | "grid" | "research";
}

function getImageSrc(garment: Garment): string | undefined {
  return garment.thumbnailUrl || garment.imageUrl || garment.images?.[0] || undefined;
}

function getEraBadgeText(garment: Garment): string | undefined {
  return garment.era;
}

function getMaterials(garment: Garment): string[] {
  if (!garment.materials) return [];
  if (Array.isArray(garment.materials)) return garment.materials.slice(0, 3);
  return [garment.materials];
}

function getSubtitle(garment: Garment): string {
  return garment.collection || "";
}

export default function GarmentCard({ garment, variant = "grid" }: Props) {
  const base = variant === "runway" ? "w-52" : "w-full";
  const imageSrc = getImageSrc(garment);
  const [imgError, setImgError] = useState(false);
  const eraBadge = getEraBadgeText(garment);
  const materials = getMaterials(garment);
  const colors = garment.colors?.slice(0, 4) ?? [];
  const subtitle = getSubtitle(garment);

  return (
    <a
      href={`/garments/${garment.slug}`}
      className={`${base} flex flex-col border border-archive-border bg-archive-bg transition-[border-color,transform] duration-200 ease-out motion-safe:hover:border-archive-border-hover motion-safe:hover:-translate-y-0.5`}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-archive-surface-muted">
        {imageSrc && !imgError ? (
          <Image
            src={imageSrc}
            alt={garment.editorial_title || garment.label}
            fill
            className="object-cover"
            sizes={variant === "runway" ? "208px" : "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
            <div className="w-10 h-10 border border-archive-border flex items-center justify-center">
              <svg className="w-5 h-5 text-archive-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            {garment.accessionNumber && (
              <span className="text-[9px] uppercase tracking-widest text-archive-muted-subtle text-center">
                {garment.accessionNumber}
              </span>
            )}
          </div>
        )}

        {/* Era label */}
        {eraBadge && (
          <div
            className={`absolute top-2.5 left-2.5 z-10 rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-widest ${
              variant === "research"
                ? "bg-black/70 text-white ring-1 ring-inset ring-white/20"
                : "ring-1 ring-inset ring-archive-accent/35 bg-[color-mix(in_oklch,var(--background)_78%,transparent)] text-archive-fg"
            }`}
            style={{ fontFamily: "var(--font-display), Georgia, serif", letterSpacing: "0.15em" }}
          >
            {eraBadge}
          </div>
        )}
      </div>

      {/* Color swatch strip */}
      {colors.length > 0 && (
        <div className="flex h-1">
          {colors.map((color, i) => (
            <span key={i} className="flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>
      )}

      {/* Card body */}
      <div className={`${variant === "research" ? "p-2.5" : "p-3"} space-y-1.5`}>
        {/* Type row */}
        <div
          className="text-[9px] uppercase text-archive-muted"
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            letterSpacing: "0.25em",
          }}
        >
          {garment.work_type || "Garment"}
        </div>

        {/* Title */}
        <div
          className="text-lg leading-tight text-archive-fg"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          {garment.label}
        </div>

        {/* Accession number — research variant only */}
        {variant === "research" && garment.accessionNumber && (
          <div className="font-mono text-[10px] text-archive-muted">
            {garment.accessionNumber}
          </div>
        )}

        {/* Gender / condition — research variant only */}
        {variant === "research" && (
          (() => {
            const meta = [garment.gender, garment.condition].filter(Boolean);
            return meta.length > 0 ? (
              <div className="text-[10px] text-archive-muted leading-tight">
                {meta.join(" · ")}
              </div>
            ) : null;
          })()
        )}

        {/* Subtitle — non-research only */}
        {variant !== "research" && subtitle && (
          <div
            className="text-sm italic text-archive-muted leading-relaxed"
            style={{ fontFamily: "var(--font-body), Georgia, serif" }}
          >
            {subtitle}
          </div>
        )}

        {/* Material tags */}
        {materials.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {(variant === "research" ? materials.slice(0, 2) : materials).map((mat, i) => (
              <span
                key={i}
                className="text-[11px] px-1.5 py-0.5 border border-archive-border text-archive-muted"
                style={{ fontFamily: "var(--font-body), Georgia, serif" }}
              >
                {mat}
              </span>
            ))}
            {variant === "research" && materials.length > 2 && (
              <span
                className="text-[11px] px-1.5 py-0.5 border border-archive-border text-archive-muted"
                style={{ fontFamily: "var(--font-body), Georgia, serif" }}
              >
                +{materials.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>
    </a>
  );
}
