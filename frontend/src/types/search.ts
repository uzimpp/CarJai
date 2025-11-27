export interface SearchCarsParams {
  q?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  provinceId?: number;
  bodyType?: string[]; // Display codes for filtering (e.g., ["PICKUP", "SUV"])
  transmission?: string[]; // Display codes for filtering (e.g., ["AT", "MANUAL"])
  drivetrain?: string[]; // Display codes for filtering (e.g., ["FWD", "AWD"])
  fuelTypes?: string[]; // Display codes for filtering (e.g., ["GASOLINE", "DIESEL"])
  colors?: string[]; // Display codes for filtering (e.g., ["WHITE", "BLACK"])
  conditionRating?: number; // Minimum condition rating filter (1-5)
  sortBy?: string; // Sort field: "price", "year", "mileage", "created_at", "condition_rating"
  sortOrder?: "asc" | "desc"; // Sort order
}
