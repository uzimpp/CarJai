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
  "Stolen vehicle",
  "Odometer rollback",
  "False specs",
  "Undisclosed damage",
  "Counterfeit documents",
];

export const DEFAULT_SELLER_SUBTOPICS: string[] = [
  "Scam behavior",
  "Harassment",
  "Fake identity",
  "Payment fraud",
];