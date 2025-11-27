"use client";

import { useState } from "react";
import type { ReportFormData, ReportTarget } from "@/types/report";
import Modal from "@/components/ui/Modal";

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

  const carTopicOptions: { id: string; label: string; token: string }[] = [
    { id: "cond_mismatch", label: "False information", token: "cond_mismatch" },
    {
      id: "fake_details",
      label: "Fake details (tick which items are untrue)",
      token: "fake_details",
    },
    {
      id: "car_not_exist",
      label: "This car does not exist",
      token: "car_not_exist",
    },
    {
      id: "already_sold",
      label: "This car has already been sold",
      token: "already_sold",
    },
    {
      id: "edited_photo",
      label: "The car's photo has been edited/doctored",
      token: "edited_photo",
    },
    { id: "other", label: "Other (Please specify)", token: "other" },
  ];

  const sellerTopicOptions: { id: string; label: string; token: string }[] = [
    { id: "fraud", label: "Fraud", token: "fraud" },
    {
      id: "contact_unreachable",
      label: "Contact information is unreachable",
      token: "contact_unreachable",
    },
    { id: "no_show", label: "No-show for the appointment", token: "no_show" },
    {
      id: "selling_fake_car",
      label: "Selling a fake car",
      token: "selling_fake_car",
    },
    {
      id: "impersonation",
      label: "Impersonating someone else's information",
      token: "impersonation",
    },
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
    if (
      target === "car" &&
      selectedTopics.includes("fake_details") &&
      fakeDetailItems.length === 0
    ) {
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
          if (topicId === "fake_details") {
            sub.push(...(fakeDetailItems.length > 0 ? fakeDetailItems : []));
          }
          const desc =
            topicId === "other"
              ? otherDescription.trim()
              : `Quick report: ${opt.label}.`;
          await onSubmit({
            topic: opt.token,
            subTopics: sub,
            description: desc,
          });
        } else {
          const opt = sellerTopicOptions.find((o) => o.id === topicId)!;
          const desc =
            topicId === "other"
              ? otherDescription.trim()
              : `Quick report: ${opt.label}.`;
          await onSubmit({
            topic: opt.token,
            subTopics: [],
            description: desc,
          });
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={target === "car" ? "Report this listing" : "Report this seller"}
      description="Help us keep the marketplace safe. Provide details below."
      size="lg"
    >
      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
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
                    {(suggestedSubtopics.length > 0
                      ? suggestedSubtopics
                      : [
                          "Price",
                          "Mileage",
                          "Year",
                          "Condition",
                          "Accident history",
                          "Ownership",
                          "Documents",
                          "Photos",
                        ]
                    ).map((s) => (
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

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-maroon text-white font-medium rounded-lg hover:bg-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </>
          ) : (
            "Submit Report"
          )}
        </button>
      </div>
    </Modal>
  );
}
