// Favorites API utilities
import { apiCall } from "@/lib/apiCall";
import type { CarListing } from "@/types/car";
import type { FavoriteResponse, FavoritesListResponse } from "@/types/favorite";

// Favorites API functions
export const favoritesAPI = {
  // Add a car to favorites
  async addFavorite(carId: number): Promise<FavoriteResponse> {
    return apiCall<FavoriteResponse>(`/api/favorites/${carId}`, {
      method: "POST",
    });
  },

  // Remove a car from favorites
  async removeFavorite(carId: number): Promise<FavoriteResponse> {
    return apiCall<FavoriteResponse>(`/api/favorites/${carId}`, {
      method: "DELETE",
    });
  },

  // Get user's favorite cars
  async getFavorites(): Promise<CarListing[]> {
    const response = await apiCall<FavoritesListResponse>("/api/favorites/my");
    return response.data;
  },

  // Toggle favorite status (convenience method)
  async toggleFavorite(
    carId: number,
    isFavorited: boolean
  ): Promise<FavoriteResponse> {
    if (isFavorited) {
      return this.removeFavorite(carId);
    } else {
      return this.addFavorite(carId);
    }
  },
};
