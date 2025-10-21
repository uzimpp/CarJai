// Cars API utilities - following the codebase pattern
import { apiCall } from "@/lib/ApiCall";
import type Car from "@/types/Car";
import type { SearchCarsParams } from "@/types/search";
import type { PaginatedCarsResponse, CarFormData } from "@/types/Car";

// Type definitions now sourced from types/Car

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
    if (params.provinceId)
      searchParams.append("provinceId", params.provinceId.toString());
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
  async getById(
    carId: number
  ): Promise<{ success: boolean; data: Car; message?: string }> {
    return apiCall<{ success: boolean; data: Car; message?: string }>(
      `/api/cars/${carId}`,
      {
        method: "GET",
      }
    );
  },

  // Get current user's cars
  async getMyCars(): Promise<{ success: boolean; data: Car[] }> {
    return apiCall(`/api/cars/my`, {
      method: "GET",
    });
  },

  // Create a new car listing (empty draft)
  async create(
    carData: Partial<CarFormData> = {}
  ): Promise<{ success: boolean; data: { id: number }; message?: string }> {
    return apiCall<{
      success: boolean;
      data: { id: number };
      message?: string;
    }>("/api/cars", {
      method: "POST",
      body: JSON.stringify({ chassisNumber: "", ...carData }),
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

  // Upload vehicle registration book
  async uploadBook(file: File): Promise<{
    success: boolean;
    data: {
      carId: number;
      chassisNumber: string;
      extracted: Record<string, unknown>;
      rawFields: Record<string, unknown>;
    };
    message?: string;
  }> {
    const formData = new FormData();
    formData.append("file", file);
    return apiCall("/api/cars/book", {
      method: "POST",
      body: formData,
    });
  },

  // Upload vehicle inspection (via URL)
  async uploadInspection(
    carId: number,
    url: string
  ): Promise<{
    success: boolean;
    data: {
      chassisMatch: boolean;
      bookChassis: string;
      inspectionChassis: string;
      inspectionData: Record<string, string>;
    };
    message?: string;
  }> {
    return apiCall(`/api/cars/${carId}/inspection`, {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },

  // Autosave draft (PATCH /draft)
  async autosaveDraft(
    carId: number,
    data: Partial<CarFormData>
  ): Promise<{
    success: boolean;
    stepStatus?: {
      step2: { ready: boolean; issues: string[] };
      step3: { ready: boolean; issues: string[] };
    };
    message?: string;
  }> {
    return apiCall(`/api/cars/${carId}/draft`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Upload car images
  async uploadImages(
    carId: number,
    files: File[]
  ): Promise<{
    success: boolean;
    data: {
      carId: number;
      uploadedCount: number;
      images: Array<{ id: number; displayOrder: number }>;
    };
    message?: string;
  }> {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    return apiCall(`/api/cars/${carId}/images`, {
      method: "POST",
      body: formData,
    });
  },

  // Reorder car images
  async reorderImages(
    carId: number,
    imageIds: number[]
  ): Promise<{ success: boolean; message: string }> {
    return apiCall(`/api/cars/${carId}/images/order`, {
      method: "PUT",
      body: JSON.stringify({ imageIds }),
    });
  },

  // Review car for publish readiness
  async reviewCar(carId: number): Promise<{
    success: boolean;
    data: { ready: boolean; issues: string[] };
  }> {
    return apiCall(`/api/cars/${carId}/review`);
  },

  // Update car status (draft → active)
  async updateStatus(
    carId: number,
    status: string
  ): Promise<{ success: boolean; message: string }> {
    return apiCall(`/api/cars/${carId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  // Discard draft
  async discardDraft(
    carId: number
  ): Promise<{ success: boolean; message: string }> {
    return apiCall(`/api/cars/${carId}/discard`, {
      method: "POST",
    });
  },
};
