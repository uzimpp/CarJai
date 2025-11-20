type ReportTopic = "Fraud" | "Misleading Info" | "Illegal Content" | "Other";

type ReportTarget = "car" | "seller";

type ReportFormData = {
  topic: ReportTopic | string;
  subTopics: string[];
  description: string;
};

export const DEFAULT_CAR_SUBTOPICS: string[] = [
  "Price",
  "Mileage",
  "Year",
  "Condition",
  "Accident history",
  "Ownership",
  "Documents",
  "Photos",
];

export const DEFAULT_SELLER_SUBTOPICS: string[] = [
  "Scam behavior",
  "Harassment",
  "Fake identity",
  "Payment fraud",
];

type ReportType = "user" | "car";
type ReportStatus = "pending" | "resolved" | "dismissed" | "reviewed";

interface AdminReport {
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

interface AdminReportsListResponse {
  success: boolean;
  data: {
    reports: AdminReport[];
    total: number;
  };
  message?: string;
}

interface AdminActionResponse {
  success: boolean;
  message?: string;
}
export type {
  ReportTopic,
  ReportTarget,
  ReportFormData,
  ReportType,
  ReportStatus,
  AdminReport,
  AdminReportsListResponse,
  AdminActionResponse,
};
