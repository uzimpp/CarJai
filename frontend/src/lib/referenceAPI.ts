// 
import { apiCall } from "@/lib/apiCall";

export type ReferenceOption = { code: string; label: string };
export type ReferenceData = {
  bodyTypes: ReferenceOption[];
  transmissions: ReferenceOption[];
  fuelTypes: ReferenceOption[];
  drivetrains: ReferenceOption[];
};

export const referenceAPI = {
  async getAll(lang: "en" | "th" = "en"): Promise<{
    success: boolean;
    data: ReferenceData;
  }> {
    const qs = new URLSearchParams({ lang }).toString();
    return apiCall(`/api/reference-data?${qs}`, { method: "GET" });
  },

  async getBrands(): Promise<{ success: boolean; data: string[] }> {
    return apiCall('/api/reference-data/brands', { method: "GET" });
  },

  async getModels(brand: string): Promise<{ success: boolean; data: string[] }> {
    if (!brand) {
      return { success: true, data: [] };
    }
    const qs = new URLSearchParams({ brand }).toString();
    return apiCall(`/api/reference-data/models?${qs}`, { method: "GET" });
  },

  async getSubModels(brand: string, model: string): Promise<{ success: boolean; data: string[] }> {
    if (!brand || !model) {
      return { success: true, data: [] };
    }
    const qs = new URLSearchParams({ brand, model }).toString();
    return apiCall(`/api/reference-data/submodels?${qs}`, { method: "GET" });
  },
};