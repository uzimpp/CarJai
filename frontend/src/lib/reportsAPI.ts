import { apiCall } from "@/lib/apiCall";

export type SubmitReportPayload = {
  topic: string;
  subTopics?: string[];
  description: string;
};



export const reportsAPI = {
  // User-facing API functions
  async submitCarReport(
    carId: number,
    payload: SubmitReportPayload
  ): Promise<{ success: boolean; id: number; message?: string }> {
    return apiCall(`/api/reports/cars/${carId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async submitSellerReport(
    sellerId: number,
    payload: SubmitReportPayload
  ): Promise<{ success: boolean; id: number; message?: string }> {
    return apiCall(`/api/reports/sellers/${sellerId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
