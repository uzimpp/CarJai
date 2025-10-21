"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import { carsAPI } from "@/lib/carsAPI";
// Note: Using inline forms for now - components need API updates
import type { CarFormData } from "@/types/Car";
import type { Step } from "@/types/Selling";

// Debounce utility
function debounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void | Promise<void>,
  wait: number
): (...args: TArgs) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function (...args: TArgs) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function SellWithIdPage() {
  const router = useRouter();
  const params = useParams();
  const carId = parseInt(params.id as string);
  const { isAuthenticated, isLoading, roles, profiles } = useUserAuth();

  // Progress tracking
  const [hasProgress, setHasProgress] = useState(false);
  const hasProgressRef = useRef(false);

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>("registration");

  // Form data
  const [formData, setFormData] = useState<Partial<CarFormData>>({});
  const [extractedBookData, setExtractedBookData] = useState<
    Record<string, unknown>
  >({});
  const [inspectionData, setInspectionData] = useState<Record<
    string,
    string
  > | null>(null);
  const [chassisMatch, setChassisMatch] = useState<boolean>(false);
  const [normalizedChassis, setNormalizedChassis] = useState<{
    book: string;
    inspection: string;
  } | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [reviewResult, setReviewResult] = useState<{
    ready: boolean;
    issues: string[];
  } | null>(null);

  // Update hasProgressRef whenever hasProgress changes
  useEffect(() => {
    hasProgressRef.current = hasProgress;
  }, [hasProgress]);

  // Auth guard - redirect if not seller
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/signin?redirect=/sell");
        return;
      }
      if (roles && !roles.seller) {
        router.push("/signup/role/seller");
        return;
      }
      if (roles && roles.seller && profiles && !profiles.sellerComplete) {
        router.push("/signup/role/seller");
        return;
      }
    }
  }, [isAuthenticated, isLoading, roles, profiles, router]);

  // Auto-discard on leave if no progress
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!hasProgressRef.current && carId) {
        // Use sendBeacon for background request
        const blob = new Blob([JSON.stringify({})], {
          type: "application/json",
        });
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_API_URL}/api/cars/${carId}/discard`,
          blob
        );
      }
    };

    const handleRouteChange = () => {
      if (!hasProgressRef.current && carId) {
        // Sync request on route change
        carsAPI.discardDraft(carId).catch(() => {
          // Ignore errors - cleanup will handle it
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    // Note: Next.js router events would go here for SPA navigation

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleRouteChange();
    };
  }, [carId]);

  // Handle book upload (Step 1)
  const handleBookUpload = async (file: File) => {
    setError("");
    setIsSubmitting(true);

    try {
      const result = await carsAPI.uploadBook(file);

      if (result.success) {
        setExtractedBookData(result.data.extracted);
        setHasProgress(true);
        setCurrentStep("inspection");
      } else {
        setError(
          result.message || "Failed to upload vehicle registration book"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle inspection QR/URL (Step 2)
  const handleInspectionUrl = async (url: string) => {
    setError("");
    setIsScraping(true);

    try {
      const result = await carsAPI.uploadInspection(carId, url);

      if (result.success) {
        setInspectionData(result.data.inspectionData);
        setChassisMatch(result.data.chassisMatch);
        setNormalizedChassis({
          book: result.data.bookChassis,
          inspection: result.data.inspectionChassis,
        });
        setHasProgress(true);
        // Don't automatically advance - let user review chassis match status
      } else {
        setError(result.message || "Failed to upload inspection");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inspection upload failed");
    } finally {
      setIsScraping(false);
    }
  };

  // Autosave draft with debounce (Step 3)
  const debouncedAutoSave = useMemo(
    () =>
      debounce(async (data: Partial<CarFormData>) => {
        if (!carId) return;
        try {
          await carsAPI.autosaveDraft(carId, data);
          setHasProgress(true);
        } catch (err) {
          // Silent fail for autosave
          console.error("Autosave failed:", err);
        }
      }, 1000),
    [carId]
  );

  // Trigger autosave when form data changes
  useEffect(() => {
    if (currentStep === "details" && Object.keys(formData).length > 0) {
      debouncedAutoSave(formData);
    }
  }, [formData, currentStep, debouncedAutoSave]);

  // Handle form field changes
  const handleFormChange = useCallback((updates: Partial<CarFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setHasProgress(true);
  }, []);

  // Handle images changed
  const handleImagesChanged = useCallback((count: number) => {
    if (count > 0) {
      setHasProgress(true);
    }
  }, []);

  // Handle review (Step 4)
  const handleReview = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      const result = await carsAPI.reviewCar(carId);

      if (result.success) {
        setReviewResult(result.data);
        setCurrentStep("review");
      } else {
        setError("Failed to review car");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle publish
  const handlePublish = async () => {
    if (!reviewResult?.ready) {
      setError(
        "Cannot publish: " +
          (reviewResult?.issues.join(", ") || "Unknown issues")
      );
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await carsAPI.updateStatus(carId, "active");

      if (result.success) {
        setCurrentStep("success");
        // Redirect after short delay
        setTimeout(() => {
          router.push("/listings");
        }, 2000);
      } else {
        setError(result.message || "Failed to publish");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle discard
  const handleDiscard = async () => {
    if (
      !confirm(
        "Are you sure you want to discard this draft? This cannot be undone."
      )
    ) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await carsAPI.discardDraft(carId);
      router.push("/sell");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to discard");
      setIsSubmitting(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with discard button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sell Your Car</h1>
          <button
            onClick={handleDiscard}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
          >
            Discard Draft
          </button>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {(
              ["registration", "inspection", "details", "review"] as Step[]
            ).map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep === step
                      ? "bg-maroon text-white"
                      : index <
                        [
                          "registration",
                          "inspection",
                          "details",
                          "review",
                        ].indexOf(currentStep)
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`w-16 h-1 ${
                      index <
                      [
                        "registration",
                        "inspection",
                        "details",
                        "review",
                      ].indexOf(currentStep)
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Book</span>
            <span>Inspection</span>
            <span>Details</span>
            <span>Review</span>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Step content */}
        <div className="bg-white shadow-md rounded-lg p-6">
          {currentStep === "registration" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Step 1: Upload Vehicle Registration Book
              </h2>
              <p className="text-gray-600 mb-6">
                Upload a clear photo or scan of your vehicle registration book.
                We&apos;ll extract the details automatically.
              </p>
              <div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBookUpload(file);
                  }}
                  disabled={isSubmitting}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none disabled:opacity-50"
                />
              </div>
              {extractedBookData &&
                Object.keys(extractedBookData).length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 text-sm font-medium">
                      ✓ Book uploaded successfully
                    </p>
                  </div>
                )}
            </div>
          )}

          {currentStep === "inspection" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Step 2: Upload Vehicle Inspection
              </h2>
              <p className="text-gray-600 mb-6">
                Enter the inspection URL or QR code from your vehicle inspection
                station.
              </p>
              <div>
                <input
                  type="text"
                  placeholder="Enter inspection URL"
                  onBlur={(e) => {
                    const url = e.target.value.trim();
                    if (url) handleInspectionUrl(url);
                  }}
                  disabled={isScraping}
                  className="block w-full px-4 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-maroon focus:border-maroon disabled:opacity-50"
                />
                {isScraping && (
                  <p className="mt-2 text-sm text-gray-600">
                    Retrieving inspection data...
                  </p>
                )}
              </div>
              {inspectionData && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 text-sm font-medium">
                      ✓ Inspection data retrieved successfully
                    </p>
                  </div>

                  {/* Display chassis numbers and match status */}
                  {normalizedChassis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Book Chassis Number
                        </label>
                        <input
                          type="text"
                          value={normalizedChassis.book}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Inspection Chassis Number
                        </label>
                        <input
                          type="text"
                          value={normalizedChassis.inspection}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 uppercase"
                        />
                      </div>
                    </div>
                  )}

                  {/* Chassis match status */}
                  {chassisMatch ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-800 text-sm font-medium">
                        ✓ Chassis numbers match! You can continue to the next
                        step.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-yellow-800 text-sm font-medium">
                        ⚠ Chassis numbers do not match. Please verify your
                        documents.
                      </p>
                    </div>
                  )}

                  {/* Continue button */}
                  {chassisMatch && (
                    <button
                      onClick={() => setCurrentStep("details")}
                      className="w-full py-2 bg-maroon text-white rounded-md hover:bg-maroon-dark transition-colors"
                    >
                      Continue to Details
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === "details" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Step 3: Add Vehicle Details & Images
              </h2>
              <p className="text-gray-600 mb-6">
                Fill in the details and upload 5-12 high-quality images of your
                vehicle.
              </p>

              <div className="space-y-6">
                {/* Simplified form - full form component needs to be created */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model Name *
                    </label>
                    <input
                      type="text"
                      value={formData.modelName || ""}
                      onChange={(e) =>
                        handleFormChange({ modelName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-maroon focus:border-maroon"
                      placeholder="e.g., Civic, Corolla"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (฿) *
                    </label>
                    <input
                      type="number"
                      value={formData.price || ""}
                      onChange={(e) =>
                        handleFormChange({
                          price: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-maroon focus:border-maroon"
                      placeholder="e.g., 500000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mileage (km) *
                    </label>
                    <input
                      type="number"
                      value={formData.mileage || ""}
                      onChange={(e) =>
                        handleFormChange({
                          mileage: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-maroon focus:border-maroon"
                      placeholder="e.g., 50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) =>
                        handleFormChange({ description: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-maroon focus:border-maroon"
                      placeholder="Describe your vehicle (10-200 characters)"
                      rows={4}
                      minLength={10}
                      maxLength={200}
                    />
                  </div>

                  <div className="text-sm text-gray-500">
                    Note: Full form with all fields (transmission, body type,
                    fuel, etc.) coming soon. For now, these basic fields will be
                    autosaved.
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Vehicle Images (5-12 required)
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Upload images using the carsAPI.uploadImages method. Image
                    uploader component coming soon.
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        try {
                          await carsAPI.uploadImages(carId, files);
                          handleImagesChanged(files.length);
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Image upload failed"
                          );
                        }
                      }
                    }}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleReview}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-maroon text-white rounded-md font-semibold hover:bg-red-800 disabled:opacity-50"
                  >
                    Continue to Review
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === "review" && reviewResult && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Step 4: Review & Publish
              </h2>

              {reviewResult.ready ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 font-medium">
                      ✓ Your listing is ready to publish!
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-md">
                    <h3 className="font-semibold mb-2">Listing Summary</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Model:</dt>
                        <dd className="font-medium">
                          {formData.modelName || "N/A"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Price:</dt>
                        <dd className="font-medium">
                          {formData.price
                            ? `฿${formData.price.toLocaleString()}`
                            : "N/A"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Mileage:</dt>
                        <dd className="font-medium">
                          {formData.mileage
                            ? `${formData.mileage.toLocaleString()} km`
                            : "N/A"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setCurrentStep("details")}
                      className="px-6 py-3 border border-gray-300 rounded-md font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Back to Edit
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSubmitting ? "Publishing..." : "Publish Listing"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800 font-medium mb-2">
                      Your listing is not yet ready to publish. Please complete
                      the following:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                      {reviewResult.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setCurrentStep("details")}
                      className="px-6 py-3 bg-maroon text-white rounded-md font-semibold hover:bg-red-800"
                    >
                      Back to Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === "success" && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-green-600 mb-2">
                Success!
              </h2>
              <p className="text-gray-600 mb-4">
                Your car listing has been published.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to your listings...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
