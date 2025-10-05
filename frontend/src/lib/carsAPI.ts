// Cars API utilities - following the codebase pattern
import { apiCall } from "./apiCall";

// Type definitions
export interface Car {
  cid: number;
  sellerId: number;
  year?: number;
  mileage?: number;
  price: number;
  province?: string;
  conditionRating?: number;
  bodyTypeId?: number;
  transmissionId?: number;
  fuelTypeId?: number;
  drivetrainId?: number;
  seats?: number;
  doors?: number;
  color?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchCarsParams {
  q?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  province?: string;
  bodyTypeId?: number;
  fuelTypeId?: number;
}

export interface PaginatedCarsResponse {
  success: boolean;
  data: {
    cars: Car[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export interface CarResponse {
  success: boolean;
  data: Car;
  message?: string;
}

// Cars API functions
export const carsAPI = {
  // Search/browse cars with filters
  async search(params: SearchCarsParams = {}): Promise<PaginatedCarsResponse> {
    const searchParams = new URLSearchParams();

    if (params.q) searchParams.append("q", params.q);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.minPrice)
      searchParams.append("minPrice", params.minPrice.toString());
    if (params.maxPrice)
      searchParams.append("maxPrice", params.maxPrice.toString());
    if (params.minYear)
      searchParams.append("minYear", params.minYear.toString());
    if (params.maxYear)
      searchParams.append("maxYear", params.maxYear.toString());
    if (params.province) searchParams.append("province", params.province);
    if (params.bodyTypeId)
      searchParams.append("bodyTypeId", params.bodyTypeId.toString());
    if (params.fuelTypeId)
      searchParams.append("fuelTypeId", params.fuelTypeId.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/cars/search${queryString ? `?${queryString}` : ""}`;

    return apiCall<PaginatedCarsResponse>(endpoint, {
      method: "GET",
    });
  },

  // Get single car details
  async getById(carId: number): Promise<CarResponse> {
    return apiCall<CarResponse>(`/api/cars/${carId}`, {
      method: "GET",
    });
  },

  // Get current user's cars
  async getMyCars(): Promise<{ success: boolean; data: Car[] }> {
    return apiCall(`/api/cars/my`, {
      method: "GET",
    });
  },

  // Create a new car listing
  async create(carData: unknown): Promise<CarResponse> {
    return apiCall<CarResponse>("/api/cars", {
      method: "POST",
      body: JSON.stringify(carData),
    });
  },

  // Update a car listing
  async update(
    carId: number,
    carData: unknown
  ): Promise<{ success: boolean; message: string }> {
    return apiCall(`/api/cars/${carId}`, {
      method: "PUT",
      body: JSON.stringify(carData),
    });
  },

  // Delete a car listing
  async delete(carId: number): Promise<{ success: boolean; message: string }> {
    return apiCall(`/api/cars/${carId}`, {
      method: "DELETE",
    });
  },
};
