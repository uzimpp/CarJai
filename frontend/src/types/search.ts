export interface SearchCarsParams {
  q?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  provinceId?: number;
  bodyType?: string; // Display code for filtering (e.g., "PICKUP")
  transmission?: string; // Display code for filtering (e.g., "AT", "MANUAL") 
  drivetrain?: string; // Display code for filtering (e.g., "FWD", "AWD")
  fuelTypes?: string[]; // Display codes for filtering (e.g., ["GASOLINE", "DIESEL"])
  colors?: string[]; // Display codes for filtering (e.g., ["WHITE", "BLACK"])
}
