import type { CarListing } from "./car";
interface FavoriteResponse {
  success: boolean;
  message: string;
}

interface FavoritesListResponse {
  success: boolean;
  data: CarListing[];
}
export type { FavoriteResponse, FavoritesListResponse };
