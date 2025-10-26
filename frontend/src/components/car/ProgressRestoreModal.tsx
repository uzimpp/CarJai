"use client";

import { useState, useEffect } from "react";
import { carsAPI } from "@/lib/carsAPI";

interface ProgressRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCarId: number;
  onSuccess: () => void;
}

interface Car {
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
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
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
        const draftCars = response.data.filter(
          (car) => car.status === "draft" && car.id !== targetCarId
        );
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
    if (!selectedCarId) {
      setError("Please select a car to restore progress from");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await carsAPI.restoreProgress(targetCarId, selectedCarId);
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
        <p className="text-gray-600 mb-4">
          Select a draft car to restore progress from. This will copy all form
          data, images, and inspection results to the current car.
        </p>

        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading available cars...</p>
          </div>
        ) : availableCars.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-600">No other draft cars available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableCars.map((car) => (
              <label
                key={car.id}
                className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="sourceCar"
                  value={car.id}
                  checked={selectedCarId === car.id}
                  onChange={(e) => setSelectedCarId(parseInt(e.target.value))}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium">
                    {car.brandName && car.modelName
                      ? `${car.brandName} ${car.modelName}`
                      : `Car #${car.id}`}
                  </div>
                  {car.year && (
                    <div className="text-sm text-gray-600">{car.year}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
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
            disabled={!selectedCarId || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Restoring..." : "Restore Progress"}
          </button>
        </div>
      </div>
    </div>
  );
}
