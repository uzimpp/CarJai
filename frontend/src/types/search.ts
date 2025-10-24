export interface SearchCarsParams {
  q?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  provinceId?: number;
  bodyType?: string; // Display label for filtering (e.g., "Pickup")
  fuelTypes?: string[]; // Display labels for filtering (e.g., ["Gasoline", "LPG"])
}
