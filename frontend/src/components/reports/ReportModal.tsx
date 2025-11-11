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
  const [topic, setTopic] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [subTopics, setSubTopics] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleSubtopic = (s: string) => {
    setSubTopics((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = async () => {
    setError("");
    if (!topic.trim() || !description.trim()) {
      setError("Please provide a topic and description.");
      return;
    }
    try {
      setIsSubmitting(true);
      await onSubmit({ topic, subTopics, description });
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Topic
        </label>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
        >
          <option value="">Select a topic</option>
          <option>Fraud</option>
          <option>Misleading Info</option>
          <option>Illegal Content</option>
          <option>Other</option>
        </select>

        {suggestedSubtopics.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">
              Subtopics (optional)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {suggestedSubtopics.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={subTopics.includes(s)}
                    onChange={() => toggleSubtopic(s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        )}

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6"
          placeholder="Please provide details and any relevant evidence."
        />

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
  );
}