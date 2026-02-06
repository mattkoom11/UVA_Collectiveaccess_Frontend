"use client";

import { useMemo } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { Garment } from "@/types/garment";
import { getGarmentById } from "@/lib/garments";
import Link from "next/link";
import Image from "next/image";
import { Heart, Trash2 } from "lucide-react";
import EmptyState from "./EmptyState";

interface FavoritesPageClientProps {
  allGarments: Garment[];
}

export default function FavoritesPageClient({ allGarments }: FavoritesPageClientProps) {
  const { favorites, removeFavorite, clearFavorites, isLoading } = useFavorites();

  const favoriteGarments = useMemo(() => {
    return favorites
      .map((id) => getGarmentById(id))
      .filter((g): g is Garment => g !== undefined);
  }, [favorites]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
        <p className="text-zinc-400">Loading favorites...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="mb-12 md:mb-16 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4">
            My Favorites
          </h1>
          <p className="text-sm md:text-base text-zinc-400 font-light max-w-2xl mx-auto">
            {favoriteGarments.length === 0
              ? "No favorites yet. Start exploring the collection!"
              : `${favoriteGarments.length} ${favoriteGarments.length === 1 ? "garment" : "garments"} saved`}
          </p>
        </div>

        {/* Actions */}
        {favoriteGarments.length > 0 && (
          <div className="print-hide mb-8 flex justify-center">
            <button
              onClick={clearFavorites}
              className="text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-700 px-4 py-2 hover:border-zinc-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Favorites
            </button>
          </div>
        )}

        {/* Favorites Grid */}
        {favoriteGarments.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            description="Save garments you love by clicking the heart on any garment. They’ll appear here."
            actionLabel="Browse collection"
            actionHref="/collection"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
            {favoriteGarments.map((garment) => (
              <div
                key={garment.id}
                className="group border border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 transition-all duration-300 hover:bg-zinc-900 relative"
              >
                {/* Remove from favorites button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFavorite(garment.id);
                    }}
                    className="p-2 rounded-full bg-black/60 backdrop-blur-sm border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-700/50 transition-all"
                    aria-label="Remove from favorites"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <Link href={`/garments/${garment.slug}`}>
                  {/* Card Image */}
                  <div className="relative w-full aspect-[3/4] bg-zinc-900 overflow-hidden">
                    {garment.thumbnailUrl || (garment.images && garment.images[0]) ? (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                        <div className="text-center">
                          <p className="mb-2">Thumbnail</p>
                          <p className="text-xs text-zinc-700">
                            {garment.thumbnailUrl || garment.images[0]}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
                        <p>Image Placeholder</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/20 transition-colors duration-300" />
                  </div>

                  {/* Card Content */}
                  <div className="p-6 space-y-3">
                    <div>
                      <h2 className="text-lg md:text-xl font-light tracking-tight mb-2 group-hover:text-zinc-200 transition-colors">
                        {garment.name || garment.label || garment.editorial_title}
                      </h2>
                      <p className="text-sm text-zinc-400 font-light">
                        {garment.decade || garment.date || ''} {garment.work_type ? `• ${garment.work_type}` : ''}
                      </p>
                    </div>
                    
                    {/* Description Excerpt */}
                    {(garment.tagline || garment.description || garment.aesthetic_description) && (
                      <p className="text-xs md:text-sm text-zinc-500 font-light leading-relaxed line-clamp-2">
                        {garment.tagline || garment.description || garment.aesthetic_description}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

