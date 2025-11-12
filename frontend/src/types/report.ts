export type ReportTopic =
  | "Fraud"
  | "Misleading Info"
  | "Illegal Content"
  | "Other";

export type ReportTarget = "car" | "seller";

export type ReportFormData = {
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