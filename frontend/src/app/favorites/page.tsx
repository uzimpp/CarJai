"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import { favoritesAPI } from "@/lib/favoritesAPI";
import { CarListing } from "@/types/car";
import CarCard from "@/components/car/CarCard";

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, roles, profiles } = useUserAuth();
  const [favorites, setFavorites] = useState<CarListing[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/signin?redirect=/favorites");
        return;
      }

      if (!roles?.buyer) {
        router.push("/signup/role/buyer");
        return;
      }

      if (roles.buyer && !profiles?.buyerComplete) {
        router.push("/signup/role/buyer");
        return;
      }

      // Fetch favorites if user is authenticated buyer with complete profile
      fetchFavorites();
    }
  }, [isLoading, isAuthenticated, roles, profiles, router]);

  const fetchFavorites = async () => {
    try {
      setFavoritesLoading(true);
      setError(null);
      const favoriteCars = await favoritesAPI.getFavorites();
      setFavorites(favoriteCars);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load favorites");
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleFavoriteToggle = (carId: number, isFavorited: boolean) => {
    if (!isFavorited) {
      // Remove from favorites list
      setFavorites((prev) => prev.filter((car) => car.id !== carId));
    }
    // Note: We don't add cars here since this is the favorites page
    // Cars are added from the browse page
  };

  if (isLoading) {
    return (
      <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-maroon mx-auto"></div>
            <p className="mt-4 text-0 text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !roles?.buyer || !profiles?.buyerComplete) {
    return null;
  }

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      <div className="mb-(--space-xl)">
        <h1 className="text-4 font-bold text-gray-900 mb-(--space-2xs)">
          My Favorites
        </h1>
        <p className="text-0 text-gray-600">Your saved cars for easy access</p>
      </div>

      {error && (
        <div className="mb-6 p-(--space-m) bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-0 text-red-600 font-medium mb-2">{error}</p>
              <button
                onClick={fetchFavorites}
                className="text-0 text-red-700 underline hover:no-underline font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {favoritesLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-maroon mx-auto"></div>
            <p className="mt-4 text-0 text-gray-600 font-medium">
              Loading favorites...
            </p>
          </div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h2 className="text-2 font-bold text-gray-900 mb-2">
            No Favorites Yet
          </h2>
          <p className="text-0 text-gray-600 mb-6 max-w-md mx-auto">
            Start exploring cars and tap the heart icon to save your favorites
          </p>
          <button
            onClick={() => router.push("/browse")}
            className="px-(--space-l) py-(--space-s) bg-maroon hover:bg-red text-white font-medium rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            Browse Cars
          </button>
        </div>
      ) : (
        <>
          <div className="mb-(--space-l)">
            <p className="text-0 text-gray-600">
              {favorites.length} car{favorites.length !== 1 ? "s" : ""} saved
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-(--space-m)">
            {favorites.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                variant="browse"
                favorite={{
                  isFavorited: true,
                  onToggle: handleFavoriteToggle,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
