"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

interface FavoriteButtonProps {
  garmentId: string;
  variant?: "icon" | "button";
  className?: string;
}

export default function FavoriteButton({ 
  garmentId, 
  variant = "icon",
  className = "" 
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(garmentId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(garmentId);
  };

  if (variant === "button") {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-light transition-colors border border-archive-border px-4 py-2 hover:border-archive-border-hover ${
          favorited
            ? "text-red-400 border-red-700/50 bg-red-950/20"
            : "text-archive-muted hover:text-archive-fg"
        } ${className}`}
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart className={`w-4 h-4 ${favorited ? "fill-current" : ""}`} />
        <span>{favorited ? "Favorited" : "Favorite"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full transition-all ${
        favorited
          ? "text-red-400 bg-red-950/20"
          : "text-archive-muted hover:text-archive-muted-subtle hover:bg-archive-surface/50"
      } ${className}`}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart className={`w-5 h-5 ${favorited ? "fill-current" : ""}`} />
    </button>
  );
}

