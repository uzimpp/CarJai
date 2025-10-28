// Cars API utilities - following the codebase pattern
import { apiCall } from "@/lib/apiCall";
import type { SearchCarsParams } from "@/types/search";
import type {
  Car,
  CarFormData,
  InspectionResult,
  BookResult,
  CarListing,
} from "@/types/Car";

// Type definitions now sourced from types/Car

// Cars API functions
export const carsAPI = {
  // Search/browse cars with filters
  async search(params: SearchCarsParams = {}): Promise<{
    success: boolean;
    data: {
      cars: CarListing[];
      total: number;
      page: number;
      limit: number;
    };
    message?: string;
  }> {
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
    if (params.bodyType) searchParams.append("bodyType", params.bodyType);
    if (params.fuelTypes && params.fuelTypes.length > 0) {
      params.fuelTypes.forEach((fuelType) => {
        searchParams.append("fuelTypes", fuelType);
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/api/cars/search${queryString ? `?${queryString}` : ""}`;

    return apiCall<{
      success: boolean;
      data: {
        cars: CarListing[];
        total: number;
        page: number;
        limit: number;
      };
      message?: string;
    }>(endpoint, {
      method: "GET",
    });
  },

  // Get single car details (car + images + inspection)
  async getById(carId: number): Promise<{
    success: boolean;
    data: Car;
    message?: string;
  }> {
    return apiCall<{
      success: boolean;
      data: Car;
      message?: string;
    }>(`/api/cars/${carId}`, {
      method: "GET",
    });
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

  // Upload vehicle registration book to existing car draft
  async uploadBook(
    carId: number,
    file: File
  ): Promise<{
    success: boolean;
    message?: string;
    data: BookResult;
  }> {
    const formData = new FormData();
    formData.append("file", file);
    return apiCall(`/api/cars/${carId}/book`, {
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
    data: InspectionResult;
    message: string;
    code: string;
    action: "stay" | "redirect";
    redirectToCarID: number | null;
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
    files: FileList | File[]
  ): Promise<{
    success: boolean;
    data?: {
      carId: number;
      uploadedCount: number;
      images: Array<{
        id: number;
        carId: number;
        imageType: string;
        imageSize: number;
        displayOrder: number;
        uploadedAt: string;
      }>;
    };
    message?: string;
  }> {
    const formData = new FormData();
    const fileArray = Array.from(files);
    fileArray.forEach((file) => formData.append("images", file));
    return apiCall<{
      success: boolean;
      data?: {
        carId: number;
        uploadedCount: number;
        images: Array<{
          id: number;
          carId: number;
          imageType: string;
          imageSize: number;
          displayOrder: number;
          uploadedAt: string;
        }>;
      };
      message?: string;
    }>(`/api/cars/${carId}/images`, {
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

  // Delete car image
  async deleteImage(
    imageId: number
  ): Promise<{ success: boolean; message?: string }> {
    return apiCall(`/api/cars/images/${imageId}`, {
      method: "DELETE",
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

  // Restore progress from another car
  async restoreProgress(
    targetCarId: number,
    sourceCarId: number
  ): Promise<{ success: boolean; message: string }> {
    return apiCall(`/api/cars/${targetCarId}/restore-progress`, {
      method: "POST",
      body: JSON.stringify({ sourceCarId }),
    });
  },

  // Redirect to existing draft and delete current car
  async redirectToDraft(
    currentCarId: number,
    targetCarId: number
  ): Promise<{ success: boolean; message: string; redirectToCarId: number }> {
    return apiCall(`/api/cars/${currentCarId}/redirect-to-draft`, {
      method: "POST",
      body: JSON.stringify({ targetCarId }),
    });
  },
};
