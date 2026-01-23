"use client";

import { useState, useEffect, useCallback } from "react";

const FAVORITES_KEY = "uva-fashion-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error("Error saving favorites:", error);
      }
    }
  }, [favorites, isLoading]);

  const addFavorite = useCallback((garmentId: string) => {
    setFavorites((prev) => {
      if (!prev.includes(garmentId)) {
        return [...prev, garmentId];
      }
      return prev;
    });
  }, []);

  const removeFavorite = useCallback((garmentId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== garmentId));
  }, []);

  const toggleFavorite = useCallback((garmentId: string) => {
    setFavorites((prev) => {
      if (prev.includes(garmentId)) {
        return prev.filter((id) => id !== garmentId);
      } else {
        return [...prev, garmentId];
      }
    });
  }, []);

  const isFavorite = useCallback(
    (garmentId: string) => favorites.includes(garmentId),
    [favorites]
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  };
}

