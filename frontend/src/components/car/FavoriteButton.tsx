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
        relative
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        ${
          localFavorited
            ? "text-red"
            : "text-gray-600 hover:text-maroon"
        }
        flex items-center justify-center
        ${className}
      `}
      aria-label={localFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      {/* Heart Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8"
        viewBox="0 0 24 24"
      >
        <path
          fill={localFavorited ? "currentColor" : "none"}
          stroke="currentColor"
          d="M12 10.375a4.375 4.375 0 0 0-8.75 0c0 1.127.159 2.784 1.75 4.375L12 20s5.409-3.659 7-5.25s1.75-3.248 1.75-4.375a4.375 4.375 0 0 0-8.75 0"
        />
      </svg>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-red border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
}
