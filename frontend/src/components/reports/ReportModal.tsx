"use client";

import { useState } from "react";
import type { ReportFormData, ReportTarget } from "@/types/report";

type ReportModalProps = {
  isOpen: boolean;
  target: ReportTarget;
  onClose: () => void;
  onSubmit: (data: ReportFormData) => Promise<void> | void;
  suggestedSubtopics?: string[];
};

export default function ReportModal({
  isOpen,
  target,
  onClose,
  onSubmit,
  suggestedSubtopics = [],
}: ReportModalProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [otherDescription, setOtherDescription] = useState<string>("");
  const [fakeDetailItems, setFakeDetailItems] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // UI topic definitions mapped to backend tokens
  const carTopicOptions: { id: string; label: string; token: string; autoSub?: string[] }[] = [
    {
      id: "cond_mismatch",
      label: "False information: Car condition does not match reality",
      token: "false_information",
      autoSub: ["condition_mismatch"],
    },
    {
      id: "fake_details",
      label: "Fake details (tick which items are untrue)",
      token: "false_information",
    },
    { id: "car_not_exist", label: "This car does not exist", token: "fraud" },
    { id: "already_sold", label: "This car has already been sold", token: "false_information", autoSub: ["already_sold"] },
    { id: "edited_photo", label: "The car's photo has been edited/doctored", token: "false_information", autoSub: ["edited_photo"] },
    { id: "other", label: "Other (Please specify)", token: "other" },
  ];

  const sellerTopicOptions: { id: string; label: string; token: string }[] = [
    { id: "fraud", label: "Fraud", token: "fraud" },
    { id: "contact_unreachable", label: "Contact information is unreachable", token: "scam" },
    { id: "no_show", label: "No-show for the appointment", token: "fraud" },
    { id: "selling_fake_car", label: "Selling a fake car", token: "fraud" },
    { id: "impersonation", label: "Impersonating someone else's information", token: "fraud" },
    { id: "other", label: "Other (Please specify)", token: "other" },
  ];

  const topicOptions = target === "car" ? carTopicOptions : sellerTopicOptions;
  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleFakeDetail = (s: string) => {
    setFakeDetailItems((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = async () => {
    setError("");
    if (selectedTopics.length === 0) {
      setError("Please select at least one topic.");
      return;
    }
    // Require description only when 'Other' is chosen
    if (selectedTopics.includes("other") && !otherDescription.trim()) {
      setError("Please specify details for Other.");
      return;
    }
    // If user selects 'Fake details' for car, require at least one checklist item
    if (target === "car" && selectedTopics.includes("fake_details") && fakeDetailItems.length === 0) {
      setError("Please tick at least one item under Fake details.");
      return;
    }
    try {
      setIsSubmitting(true);
      // Submit one report per selected topic
      for (const topicId of selectedTopics) {
        if (target === "car") {
          const opt = carTopicOptions.find((o) => o.id === topicId)!;
          const sub: string[] = [];
          if (opt.autoSub && opt.autoSub.length > 0) sub.push(...opt.autoSub);
          if (topicId === "fake_details") {
            sub.push(...(fakeDetailItems.length > 0 ? fakeDetailItems : []));
          }
          const desc = topicId === "other"
            ? otherDescription.trim()
            : `Quick report: ${opt.label}. Auto-generated summary for validation.`;
          await onSubmit({ topic: opt.token, subTopics: sub, description: desc });
        } else {
          const opt = sellerTopicOptions.find((o) => o.id === topicId)!;
          const desc = topicId === "other"
            ? otherDescription.trim()
            : `Quick report: ${opt.label}. Auto-generated summary for validation; no extra details provided.`;
          await onSubmit({ topic: opt.token, subTopics: [], description: desc });
        }
      }
      onClose();
    } catch (e: unknown) {
      let msg = "Failed to submit report";
      if (typeof e === "object" && e !== null && "message" in e) {
        const m = (e as { message?: unknown }).message;
        if (typeof m === "string") msg = m;
      } else if (typeof e === "string") {
        msg = e;
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Subtle gray overlay to dim the page behind the modal */}
      <div
        className="absolute inset-0 bg-gray-900/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative h-full w-full flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-2">
          {target === "car" ? "Report this listing" : "Report this seller"}
        </h2>
        <p className="text-gray-600 mb-4">
          Help us keep the marketplace safe. Provide details below.
        </p>

        {error && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}

        <div className="mb-3">
          <div className="block text-sm font-medium text-gray-700 mb-1">
            Topics (you can select multiple)
          </div>
          <div className="grid grid-cols-1 gap-2">
            {topicOptions.map((opt) => (
              <div key={opt.id} className="text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(opt.id)}
                    onChange={() => toggleTopic(opt.id)}
                    aria-expanded={
                      opt.id === "fake_details"
                        ? selectedTopics.includes("fake_details")
                        : opt.id === "other"
                        ? selectedTopics.includes("other")
                        : undefined
                    }
                    aria-controls={
                      opt.id === "fake_details"
                        ? "fake-details-panel"
                        : opt.id === "other"
                        ? "other-panel"
                        : undefined
                    }
                  />
                  {opt.label}
                </label>
                {opt.id === "fake_details" && (
                  <div
                    id="fake-details-panel"
                    className={
                      `ml-6 overflow-hidden transition-all duration-300 ease-in-out ` +
                      (selectedTopics.includes("fake_details")
                        ? "max-h-[400px] opacity-100 mt-2"
                        : "max-h-0 opacity-0")
                    }
                    role="region"
                    aria-hidden={!selectedTopics.includes("fake_details")}
                  >
                    <div className="text-xs text-gray-600 mb-2">
                      Tick which items are untrue
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(suggestedSubtopics.length > 0 ? suggestedSubtopics : [
                        "Price",
                        "Mileage",
                        "Year",
                        "Condition",
                        "Accident history",
                        "Ownership",
                        "Documents",
                        "Photos",
                      ]).map((s) => (
                        <label key={s} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={fakeDetailItems.includes(s)}
                            onChange={() => toggleFakeDetail(s)}
                          />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {opt.id === "other" && (
                  <div
                    id="other-panel"
                    className={
                      `ml-6 overflow-hidden transition-all duration-300 ease-in-out ` +
                      (selectedTopics.includes("other")
                        ? "max-h-[220px] opacity-100 mt-2"
                        : "max-h-0 opacity-0")
                    }
                    role="region"
                    aria-hidden={!selectedTopics.includes("other")}
                  >
                    <div className="text-xs text-gray-600 mb-2">
                      Provide details (required)
                    </div>
                    <textarea
                      value={otherDescription}
                      onChange={(e) => setOtherDescription(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Please specify the issue."
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fake details checklist is now inline within the topic list with slide-down animation. */}

        {/* Description for Other now appears inline under the Other checkbox with slide-down animation. */}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}