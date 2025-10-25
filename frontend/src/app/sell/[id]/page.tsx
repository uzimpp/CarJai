"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import { carsAPI } from "@/lib/carsAPI";
import { debounce } from "@/utils/debounce";
import Step1DocumentsForm from "@/components/car/Step1DocumentsForm";
import Step2DetailsForm from "@/components/car/Step2DetailsForm";
import Step3PricingForm from "@/components/car/Step3PricingForm";
import Step4ReviewForm from "@/components/car/Step4ReviewForm";
import type { CarFormData } from "@/types/Car";
import type { Step } from "@/types/Selling";

export default function SellWithIdPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const carId = parseInt(params.id as string);
  const { isAuthenticated, isLoading, roles, profiles } = useUserAuth();

  // Progress tracking
  const [hasProgress, setHasProgress] = useState(false);
  const hasProgressRef = useRef(false);
  const initializedPathRef = useRef(false);
  const suppressAutoDiscardRef = useRef(false);

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>("documents");

  // Form data
  const [formData, setFormData] = useState<Partial<CarFormData>>({});
  const [inspectionData, setInspectionData] = useState<Record<
    string,
    string
  > | null>(null);
  const [imagesUploaded, setImagesUploaded] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reviewResult, setReviewResult] = useState<{
    ready: boolean;
    issues: string[];
  } | null>(null);

  // Update hasProgressRef whenever hasProgress changes
  useEffect(() => {
    hasProgressRef.current = hasProgress;
  }, [hasProgress]);

  // Validate car exists on mount
  useEffect(() => {
    const validateCarExists = async () => {
      if (!carId || isNaN(carId)) {
        setError("Invalid car ID");
        suppressAutoDiscardRef.current = true; // Don't discard invalid IDs
        router.push("/sell");
        return;
      }

      try {
        const result = await carsAPI.getById(carId);
        if (!result.success) {
          setError("Car not found. Please start a new draft.");
          suppressAutoDiscardRef.current = true; // Don't discard non-existent cars
          setTimeout(() => router.push("/sell"), 2000);
        }
      } catch (err) {
        setError("Car not found. Redirecting...");
        suppressAutoDiscardRef.current = true; // Don't discard non-existent cars
        setTimeout(() => router.push("/sell"), 2000);
      }
    };

    if (!isLoading && isAuthenticated) {
      validateCarExists();
    }
  }, [carId, isAuthenticated, isLoading, router]);

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

  // Auto-discard when navigating away from this draft page (client-side routing only)
  useEffect(() => {
    // Skip on first mount to avoid false positive from Strict Mode
    if (!initializedPathRef.current) {
      initializedPathRef.current = true;
      return;
    }

    // Check if we're still on this draft's page
    const stillOnThisDraft = pathname && pathname.startsWith(`/sell/${carId}`);

    // If navigating away and no progress, discard
    if (
      !stillOnThisDraft &&
      carId &&
      !isNaN(carId) &&
      !hasProgressRef.current &&
      !suppressAutoDiscardRef.current
    ) {
      carsAPI.discardDraft(carId).catch(() => {
        // Ignore errors - backend cleanup will handle orphans
      });
    }
  }, [pathname, carId]);

  // Handle book upload (Step 1)
  const handleBookUpload = async (file: File) => {
    setError("");

    try {
      const result = await carsAPI.uploadBook(carId, file);
      if (result.success) {
        // Strict type matching - only pick fields that exist in both types
        const extracted: Partial<CarFormData> = {
          ...(result.data.brandName && { brandName: result.data.brandName }),
          ...(result.data.year && { year: result.data.year }),
          ...(result.data.engineCc && { engineCc: result.data.engineCc }),
          ...(result.data.seats && { seats: result.data.seats }),
        };
        setFormData((prev) => ({ ...prev, ...extracted }));
        setHasProgress(true);
      } else {
        throw new Error(
          result.message || "Failed to upload vehicle registration book"
        );
      }
    } catch (err) {
      // Surface meaningful error
      const message =
        err instanceof Error ? err.message : "Failed to upload book";
      setError(message);
      throw err;
    }
  };

  // Handle inspection QR/URL (Step 1)
  const handleInspectionUpload = async (url: string) => {
    setError("");

    try {
      const result = await carsAPI.uploadInspection(carId, url);

      if (result.success) {
        // Handle server-side duplicate resolution
        if (result.action === "redirect" && result.redirectToCarId) {
          // Redirect to the existing draft that matches this chassis
          router.replace(`/sell/${result.redirectToCarId}`);
          return;
        }
        setInspectionData(result.data as Record<string, string>);
        setHasProgress(true);
      } else {
        throw new Error(result.message || "Failed to upload inspection");
      }
    } catch (err) {
      throw err;
    }
  };

  // Autosave draft with debounce (Steps 2 & 3)
  const debouncedAutoSave = useMemo(
    () =>
      debounce(async (data: Partial<CarFormData>) => {
        if (!carId) return;

        // Sanitize: remove chassisNumber if it somehow got in
        const { chassisNumber, ...sanitizedData } =
          data as Partial<CarFormData> & { chassisNumber?: string };

        try {
          await carsAPI.autosaveDraft(carId, sanitizedData);
          setHasProgress(true);
        } catch (err) {
          // Silent fail for autosave
          console.error("Autosave failed:", err);
        }
      }, 1500), // 1.5 seconds debounce
    [carId]
  );

  // Trigger autosave when form data changes
  useEffect(() => {
    if (
      (currentStep === "documents" ||
        currentStep === "specs" ||
        currentStep === "pricing" ||
        currentStep === "review") &&
      Object.keys(formData).length > 0 &&
      !isSubmitting
    ) {
      debouncedAutoSave(formData);
    }
  }, [formData, currentStep, debouncedAutoSave]);

  // Handle form field changes
  const handleFormChange = useCallback((updates: Partial<CarFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setHasProgress(true);
  }, []);

  // Note: handleBookDataChange removed - Step 1 now uses handleFormChange

  // Handle inspection data changes
  const handleInspectionDataChange = useCallback(
    (updates: Record<string, string>) => {
      setInspectionData(updates);
      setHasProgress(true);
    },
    []
  );

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
    suppressAutoDiscardRef.current = true; // Don't auto-discard on successful publish

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
        suppressAutoDiscardRef.current = false; // Re-enable on failure
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
      suppressAutoDiscardRef.current = false; // Re-enable on error
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
    suppressAutoDiscardRef.current = true; // Prevent auto-discard during redirect

    try {
      await carsAPI.discardDraft(carId);
      router.push("/sell");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to discard");
      setIsSubmitting(false);
      suppressAutoDiscardRef.current = false; // Re-enable auto-discard on error
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
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
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
            {(["documents", "specs", "pricing", "review"] as Step[]).map(
              (step, index) => {
                const stepOrder = ["documents", "specs", "pricing", "review"];
                const currentStepIndex = stepOrder.indexOf(currentStep);
                const isCompleted = index < currentStepIndex;
                const isCurrent = currentStep === step;

                return (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        isCurrent
                          ? "bg-maroon text-white"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    {index < 3 && (
                      <div
                        className={`w-16 h-1 ${
                          isCompleted ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                );
              }
            )}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Documents</span>
            <span>Specs</span>
            <span>Pricing</span>
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
          {currentStep === "documents" && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                Step 1: Upload Documents
              </h2>
              <p className="text-gray-600 mb-6">
                Upload your vehicle registration book and inspection report. The
                chassis numbers must match to continue.
              </p>
              <Step1DocumentsForm
                formData={formData}
                onFormDataChange={handleFormChange}
                onBookUpload={handleBookUpload}
                onInspectionUpload={handleInspectionUpload}
                inspectionData={inspectionData}
                onContinue={() => setCurrentStep("specs")}
                isSubmitting={isSubmitting}
              />
            </div>
          )}

          {currentStep === "specs" && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                Step 2: Vehicle Specifications
              </h2>
              <p className="text-gray-600 mb-6">
                Select the specifications for your vehicle including body type,
                transmission, drivetrain, fuel type, and model details.
              </p>
              <Step2DetailsForm
                formData={formData}
                onChange={handleFormChange}
                onContinue={() => setCurrentStep("pricing")}
                onBack={() => setCurrentStep("documents")}
                isSubmitting={isSubmitting}
              />
            </div>
          )}

          {currentStep === "pricing" && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                Step 3: Pricing, Images & Description
              </h2>
              <p className="text-gray-600 mb-6">
                Set your asking price, upload 5-12 high-quality images, write a
                description, and disclose any damage history.
              </p>
              <Step3PricingForm
                carId={carId}
                formData={formData}
                onChange={handleFormChange}
                onContinue={handleReview}
                onBack={() => setCurrentStep("specs")}
                isSubmitting={isSubmitting}
                imagesUploaded={imagesUploaded}
                onImagesUploaded={() => {
                  setImagesUploaded(true);
                  setHasProgress(true);
                }}
              />
            </div>
          )}

          {currentStep === "review" && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">
                Step 4: Review & Publish
              </h2>
              <p className="text-gray-600 mb-6">
                Review all information and make any final edits before
                publishing your listing.
              </p>
              <Step4ReviewForm
                formData={formData}
                inspectionData={inspectionData}
                onChange={handleFormChange}
                onInspectionDataChange={handleInspectionDataChange}
                onPublish={handlePublish}
                onBack={() => setCurrentStep("pricing")}
                isSubmitting={isSubmitting}
                reviewResult={reviewResult}
              />
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
