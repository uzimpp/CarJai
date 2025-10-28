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
};
