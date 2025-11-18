import { apiCall } from "@/lib/apiCall";

export type SubmitReportPayload = {
  topic: string;
  subTopics?: string[];
  description: string;
};

export type ReportType = "user" | "car";
export type ReportStatus = "pending" | "resolved" | "dismissed" | "reviewed";

export interface AdminReport {
  id: number;
  type: ReportType;
  reportedById: number;
  reportedByName: string;
  reportedByEmail: string;
  targetUserId?: number;
  targetUserName?: string;
  targetCarId?: number;
  targetCarTitle?: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AdminReportsListResponse {
  success: boolean;
  data: {
    reports: AdminReport[];
    total: number;
  };
  message?: string;
}

export interface AdminActionResponse {
  success: boolean;
  message?: string;
}

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

  // Admin API functions
  async listReports(params?: {
    type?: ReportType;
    status?: ReportStatus;
  }): Promise<AdminReportsListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append("type", params.type);
    if (params?.status) searchParams.append("status", params.status);

    const queryString = searchParams.toString();
    return apiCall<AdminReportsListResponse>(
      `/admin/reports${queryString ? `?${queryString}` : ""}`,
      {
        method: "GET",
      }
    );
  },

  async resolveReport(reportId: number): Promise<AdminActionResponse> {
    return apiCall<AdminActionResponse>(`/admin/reports/${reportId}/resolve`, {
      method: "POST",
    });
  },

  async dismissReport(reportId: number): Promise<AdminActionResponse> {
    return apiCall<AdminActionResponse>(`/admin/reports/${reportId}/dismiss`, {
      method: "POST",
    });
  },
};
