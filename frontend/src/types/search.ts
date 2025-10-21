export interface SearchCarsParams {
  q?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  provinceId?: number;
  bodyTypeId?: number;
  fuelTypeId?: number;
}
