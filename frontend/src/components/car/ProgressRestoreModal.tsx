"use client";

import { useState, useEffect } from "react";
import { carsAPI } from "@/lib/carsAPI";

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
        const draftCars = response.data
          .filter(
            (car: any) => car.status === "draft" && car.id !== targetCarId
          )
          // Prefer the most recently created (approximate by id desc)
          .sort((a: any, b: any) => b.id - a.id);
        setAvailableCars(draftCars);
      }
    } catch (err) {
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
  }, [isOpen]);

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
      const result = await carsAPI.restoreProgress(targetCarId, source.id);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message || "Failed to restore progress");
      }
    } catch (err) {
      setError("Failed to restore progress");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Restore Progress</h2>
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Looking for your drafts…</p>
          </div>
        ) : availableCars.length === 0 ? (
          <p className="text-gray-600">No other draft cars available.</p>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              We found a previous draft
              {availableCars[0].brandName && availableCars[0].modelName
                ? ` for ${availableCars[0].brandName} ${availableCars[0].modelName}`
                : ""}
              . Would you like to restore its progress to this listing?
            </p>

            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Restoring..." : "Yes, Restore"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
