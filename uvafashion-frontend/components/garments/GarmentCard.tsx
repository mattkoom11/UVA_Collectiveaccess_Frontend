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

export default function GarmentCard({ garment, variant = "grid" }: Props) {
  const base = variant === "runway" ? "w-52" : "w-full";
  const imageSrc = getImageSrc(garment);
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/garments/${garment.slug}`}
      className={`${base} flex flex-col border border-zinc-700 bg-zinc-900 hover:border-zinc-100 transition group`}
    >
      <div className="relative aspect-[3/4] bg-zinc-800 overflow-hidden">
        {imageSrc && !imgError ? (
          <Image
            src={imageSrc}
            alt={garment.editorial_title || garment.label}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes={variant === "runway" ? "208px" : "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-600">
            <span>No Image</span>
          </div>
        )}
      </div>
      <div className="p-3 space-y-1">
        <div className="text-[0.7rem] uppercase tracking-[0.2em] text-zinc-400">
          {garment.work_type || "Garment"}
        </div>
        <div className="text-sm font-medium leading-snug">
          {garment.label}
        </div>
        <div className="text-[0.7rem] text-zinc-400">
          {garment.decade || garment.date}
        </div>
      </div>
    </Link>
  );
}
