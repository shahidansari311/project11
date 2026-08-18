import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { favoriteService } from "../services/favorite.service";

interface FavoritesContextType {
  favoriteIds: Set<string>;
  toggleFavorite: (propertyId: string) => Promise<void>;
  isFavorite: (propertyId: string) => boolean;
  refreshFavorites: () => Promise<void>;
  clearFavorites: () => void;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync("refresh_token");
      if (!token) {
        setFavoriteIds(new Set());
        return;
      }
      const response = await favoriteService.getFavoriteIds();
      if (response && response.data) {
        setFavoriteIds(new Set(response.data));
      }
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      setFavoriteIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const toggleFavorite = async (propertyId: string) => {
    // Optimistic update
    const wasFavorite = favoriteIds.has(propertyId);
    setFavoriteIds((prev) => {
      const newSet = new Set(prev);
      if (wasFavorite) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });

    try {
      const response = await favoriteService.toggleFavorite(propertyId);
      // Sync exactly with backend state just in case
      if (response && response.data) {
        setFavoriteIds((prev) => {
          const newSet = new Set(prev);
          if (response.data.favorited) {
            newSet.add(propertyId);
          } else {
            newSet.delete(propertyId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      // Revert on failure
      setFavoriteIds((prev) => {
        const newSet = new Set(prev);
        if (wasFavorite) {
          newSet.add(propertyId);
        } else {
          newSet.delete(propertyId);
        }
        return newSet;
      });
    }
  };

  const isFavorite = useCallback(
    (propertyId: string) => favoriteIds.has(propertyId),
    [favoriteIds]
  );

  const clearFavorites = useCallback(() => {
    setFavoriteIds(new Set());
  }, []);

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, toggleFavorite, isFavorite, refreshFavorites, clearFavorites, isLoading }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
