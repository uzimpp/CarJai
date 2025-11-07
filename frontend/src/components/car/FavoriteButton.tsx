"use client";

import { useState, useEffect } from "react";
import { favoritesAPI } from "@/lib/favoritesAPI";

interface FavoriteButtonProps {
  carId: number;
  isFavorited: boolean;
  onToggle?: (carId: number, isFavorited: boolean) => void;
  className?: string;
}

export default function FavoriteButton({
  carId,
  isFavorited,
  onToggle,
  className = "",
}: FavoriteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localFavorited, setLocalFavorited] = useState(isFavorited);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalFavorited(isFavorited);
  }, [isFavorited]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if inside a Link
    e.stopPropagation(); // Prevent event bubbling

    if (isLoading) return;

    setIsLoading(true);
    
    // Optimistic update
    const newFavoriteState = !localFavorited;
    setLocalFavorited(newFavoriteState);

    try {
      await favoritesAPI.toggleFavorite(carId, localFavorited);
      
      // Notify parent component
      if (onToggle) {
        onToggle(carId, newFavoriteState);
      }
    } catch (error) {
      // Revert optimistic update on error
      setLocalFavorited(localFavorited);
      console.error("Failed to toggle favorite:", error);
      
      // You could add a toast notification here
      alert("Failed to update favorite. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        relative p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md
        hover:bg-white hover:scale-110 active:scale-95
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      aria-label={localFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      {/* Heart Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className={`
          w-5 h-5 transition-all duration-300 ease-out
          ${localFavorited 
            ? "fill-red-500 text-red-500 scale-110" 
            : "fill-none text-gray-600 hover:text-red-400"
          }
          ${isLoading ? "animate-pulse" : ""}
        `}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
}