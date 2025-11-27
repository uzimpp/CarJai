"use client";

import { useState, useEffect } from "react";
import { carsAPI } from "@/lib/carsAPI";
import Modal from "@/components/ui/Modal";

interface ProgressRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCarId: number;
  onSuccess: () => void;
}

interface CarSummary {
  id: number;
  brandName?: string;
  modelName?: string;
  year?: number;
  status: string;
}

export default function ProgressRestoreModal({
  isOpen,
  onClose,
  targetCarId,
  onSuccess,
}: ProgressRestoreModalProps) {
  const [availableCars, setAvailableCars] = useState<CarSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load available cars when modal opens
  const loadAvailableCars = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await carsAPI.getMyCars();
      if (response.success) {
        // Filter to only show draft cars (excluding current target)
        const draftCars = (response.data as unknown as CarSummary[])
          .filter((car) => car.status === "draft" && car.id !== targetCarId)
          // Prefer the most recently created (approximate by id desc)
          .sort((a, b) => (b.id || 0) - (a.id || 0));
        setAvailableCars(draftCars);
      }
    } catch {
      setError("Failed to load available cars");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load cars when modal opens
  useEffect(() => {
    if (isOpen && !isLoading && availableCars.length === 0) {
      loadAvailableCars();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isLoading, availableCars.length]);

  const handleSubmit = async () => {
    // Auto-pick the most recent draft (first in sorted list)
    const source = availableCars[0];
    if (!source) {
      setError("No draft available to restore from");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Restore progress from source car to target car (copies all data including inspection)
      const result = await carsAPI.restoreProgress(targetCarId);
      if (result.success && result.data) {
        // The data has been copied to target car, reload to show it
        onSuccess();
        onClose();
      } else {
        setError(result.message || "Failed to restore progress");
      }
    } catch {
      setError("Failed to restore progress");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Restore Progress" size="md">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-maroon mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Looking for your drafts…
          </p>
        </div>
      ) : availableCars.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No other draft cars available.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <p className="text-gray-700 mb-4">
            We found a previous draft
            {availableCars[0].brandName && availableCars[0].modelName
              ? ` for ${availableCars[0].brandName} ${availableCars[0].modelName}`
              : ""}
            . Would you like to restore its progress to this listing?
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

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
              disabled={isSubmitting}
              className="px-4 py-2 bg-maroon text-white font-medium rounded-lg hover:bg-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  Restoring...
                </>
              ) : (
                "Yes, Restore"
              )}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
