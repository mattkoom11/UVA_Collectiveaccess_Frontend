"use client";

import Image from "next/image";
import { useState } from "react";
import { Garment } from "@/types/garment";

interface GarmentImageProps {
  garment: Garment;
  aspectClass?: string;
  sizes?: string;
}

export function getImageSrc(garment: Garment): string | undefined {
  return garment.thumbnailUrl || garment.imageUrl || garment.images?.[0] || undefined;
}

export default function GarmentImage({
  garment,
  aspectClass = "aspect-[3/4]",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: GarmentImageProps) {
  const imageSrc = getImageSrc(garment);
  const [error, setError] = useState(false);

  return (
    <div className={`relative w-full ${aspectClass} bg-zinc-900 overflow-hidden`}>
      {imageSrc && !error ? (
        imageSrc.startsWith("http://") ? (
          // Plain img for HTTP sources (e.g. local CA server) — Next.js Image
          // optimization pipeline breaks on non-HTTPS URLs in dev.
          <img
            src={imageSrc}
            alt={garment.editorial_title || garment.name || garment.label}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setError(true)}
          />
        ) : (
        <Image
          src={imageSrc}
          alt={garment.editorial_title || garment.name || garment.label}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes={sizes}
          onError={() => setError(true)}
        />
        )
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
          <div className="text-center space-y-1">
            <div className="w-10 h-10 mx-auto border border-zinc-700 rounded flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </div>
            <p className="text-xs text-zinc-700">{garment.work_type || "Garment"}</p>
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/20 transition-colors duration-300" />
    </div>
  );
}
