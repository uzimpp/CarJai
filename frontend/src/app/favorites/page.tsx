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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !roles?.buyer || !profiles?.buyerComplete) {
    return null;
  }

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      <h1 className="text-3 bold">My Favorites</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchFavorites}
            className="mt-2 text-red-700 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {favoritesLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-maroon mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">
              Loading favorites...
            </p>
          </div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
            <span className="text-5xl">💝</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No Favorites Yet
          </h2>
          <p className="text-gray-600 mb-6">
            Start exploring cars and tap the heart icon to save your favorites
          </p>
          <a
            href="/browse"
            className="inline-flex items-center px-6 py-3 bg-maroon text-white font-medium rounded-lg hover:bg-maroon/90 transition-colors"
          >
            Browse Cars
          </a>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-gray-600">
              {favorites.length} car{favorites.length !== 1 ? "s" : ""} saved
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
