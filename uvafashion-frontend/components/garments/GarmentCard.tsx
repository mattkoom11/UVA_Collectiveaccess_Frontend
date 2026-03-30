"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Garment } from "@/types/garment";

interface Props {
  garment: Garment;
  variant?: "runway" | "grid";
}

function getImageSrc(garment: Garment): string | undefined {
  return garment.thumbnailUrl || garment.imageUrl || garment.images?.[0] || undefined;
}

function getEraBadgeText(garment: Garment): string | undefined {
  if (garment.era) return garment.era;
  if (garment.decade) return garment.decade;
  return undefined;
}

function getMaterials(garment: Garment): string[] {
  if (!garment.materials) return [];
  if (Array.isArray(garment.materials)) return garment.materials.slice(0, 3);
  return [garment.materials];
}

function getSubtitle(garment: Garment): string {
  const date = garment.date || (garment.decade ? `circa ${garment.decade}` : null);
  if (!date) return garment.collection || "";
  if (garment.collection) return `${date} · ${garment.collection}`;
  return date;
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
    <Link
      href={`/garments/${garment.slug}`}
      className={`${base} flex flex-col border transition-all duration-200`}
      style={{
        borderColor: "var(--border)",
        backgroundColor: "#0f0e0c",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
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
            <div className="w-10 h-10 border border-zinc-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            {garment.accessionNumber && (
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 text-center">
                {garment.accessionNumber}
              </span>
            )}
          </div>
        )}

        {/* Era badge overlay */}
        {eraBadge && (
          <div
            className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 text-[10px] uppercase tracking-widest"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              color: "#f0ede8",
              background: "rgba(15,14,12,0.85)",
              borderLeft: "2px solid #e8e4de",
              letterSpacing: "0.15em",
            }}
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
      <div className="p-3 space-y-1.5">
        {/* Type + accession row */}
        <div className="flex items-center justify-between gap-2">
          <div
            className="text-[9px] uppercase"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              letterSpacing: "0.25em",
              color: "var(--muted)",
            }}
          >
            {garment.work_type || "Garment"}
          </div>
          {garment.accessionNumber && (
            <div className="text-[9px] tabular-nums" style={{ color: "var(--muted)", opacity: 0.6 }}>
              {garment.accessionNumber}
            </div>
          )}
        </div>

        {/* Title */}
        <div
          className="text-lg leading-tight"
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            color: "#f0ede8",
          }}
        >
          {garment.label}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div
            className="text-sm italic"
            style={{
              fontFamily: "var(--font-body), Georgia, serif",
              color: "var(--muted)",
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Material tags */}
        {materials.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {materials.map((mat, i) => (
              <span
                key={i}
                className="text-[11px] px-1.5 py-0.5"
                style={{
                  fontFamily: "var(--font-body), Georgia, serif",
                  color: "var(--muted)",
                  border: "1px solid #252525",
                }}
              >
                {mat}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
