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
import ProgressRestoreModal from "@/components/car/ProgressRestoreModal";
import DuplicateConflictModal from "@/components/car/DuplicateConflictModal";
import type { CarFormData } from "@/types/Car";
import type { Step } from "@/types/Selling";

export default function SellWithIdPage() {
  const hasHydratedRef = useRef(false); // Track if initial hydration has completed
  const isHydratingRef = useRef(false); // Track if we're currently hydrating
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
  const [showProgressRestoreModal, setShowProgressRestoreModal] =
    useState(false);
  const [showDuplicateConflictModal, setShowDuplicateConflictModal] =
    useState(false);
  const [conflictExistingCarId, setConflictExistingCarId] = useState<
    number | null
  >(null);

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

  useEffect(() => {
    const hydrate = async () => {
      if (
        hasHydratedRef.current || // Skip if already hydrated once
        !carId ||
        isNaN(carId) ||
        isLoading ||
        !isAuthenticated
      )
        return;

      // Mark that we're starting hydration
      isHydratingRef.current = true;

      try {
        const res = await carsAPI.getById(carId);
        if (!res.success) return;

        const car = (res.data as any).car; // Extract car from nested structure
        if (!car) return;

        const initial: Partial<CarFormData> = {
          ...(car.brandName && { brandName: car.brandName }),
          ...(car.modelName && { modelName: car.modelName }),
          ...(car.submodelName && { submodelName: car.submodelName }),
          ...(car.year && { year: car.year }),
          ...(car.mileage && { mileage: car.mileage }),
          ...(car.engineCc && { engineCc: car.engineCc }),
          ...(car.seats && { seats: car.seats }),
          ...(car.doors && { doors: car.doors }),
          ...(car.bodyTypeCode && { bodyTypeCode: car.bodyTypeCode }),
          ...(car.transmissionCode && {
            transmissionCode: car.transmissionCode,
          }),
          ...(car.drivetrainCode && { drivetrainCode: car.drivetrainCode }),
          ...(car.description && { description: car.description }),
          ...(car.price && { price: car.price }),
          ...(car.provinceId && { provinceId: car.provinceId }),
          ...(car.prefix && { prefix: car.prefix }),
          ...(car.number && { number: car.number }),
        };

        if (Object.keys(initial).length > 0) {
          setFormData((prev) => ({ ...initial, ...prev })); // preserve any local edits
          setHasProgress(true);
        }

        // Load inspection data if exists (from same response)
        const inspection = (res.data as any).inspection;
        if (inspection) {
          const inspectionFields: Record<string, string> = {};
          // Map all inspection fields to display format
          if (inspection.station) inspectionFields.station = inspection.station;
          if (inspection.overallPass !== undefined)
            inspectionFields.overallPass = String(inspection.overallPass);
          if (inspection.brakeResult !== undefined)
            inspectionFields.brakeResult = String(inspection.brakeResult);
          if (inspection.handbrakeResult !== undefined)
            inspectionFields.handbrakeResult = String(
              inspection.handbrakeResult
            );
          if (inspection.alignmentResult !== undefined)
            inspectionFields.alignmentResult = String(
              inspection.alignmentResult
            );
          if (inspection.noiseResult !== undefined)
            inspectionFields.noiseResult = String(inspection.noiseResult);
          if (inspection.emissionResult !== undefined)
            inspectionFields.emissionResult = String(inspection.emissionResult);
          if (inspection.hornResult !== undefined)
            inspectionFields.hornResult = String(inspection.hornResult);
          if (inspection.speedometerResult !== undefined)
            inspectionFields.speedometerResult = String(
              inspection.speedometerResult
            );
          if (inspection.highLowBeamResult !== undefined)
            inspectionFields.highLowBeamResult = String(
              inspection.highLowBeamResult
            );
          if (inspection.signalLightsResult !== undefined)
            inspectionFields.signalLightsResult = String(
              inspection.signalLightsResult
            );
          if (inspection.otherLightsResult !== undefined)
            inspectionFields.otherLightsResult = String(
              inspection.otherLightsResult
            );
          if (inspection.windshieldResult !== undefined)
            inspectionFields.windshieldResult = String(
              inspection.windshieldResult
            );
          if (inspection.steeringResult !== undefined)
            inspectionFields.steeringResult = String(inspection.steeringResult);
          if (inspection.wheelsTiresResult !== undefined)
            inspectionFields.wheelsTiresResult = String(
              inspection.wheelsTiresResult
            );
          if (inspection.fuelTankResult !== undefined)
            inspectionFields.fuelTankResult = String(inspection.fuelTankResult);
          if (inspection.chassisResult !== undefined)
            inspectionFields.chassisResult = String(inspection.chassisResult);
          if (inspection.bodyResult !== undefined)
            inspectionFields.bodyResult = String(inspection.bodyResult);
          if (inspection.doorsFloorResult !== undefined)
            inspectionFields.doorsFloorResult = String(
              inspection.doorsFloorResult
            );
          if (inspection.seatbeltResult !== undefined)
            inspectionFields.seatbeltResult = String(inspection.seatbeltResult);
          if (inspection.wiperResult !== undefined)
            inspectionFields.wiperResult = String(inspection.wiperResult);

          if (Object.keys(inspectionFields).length > 0) {
            setInspectionData(inspectionFields);
          }
        }

        // mark images uploaded if server has images metadata
        const images = (res.data as any).images;
        if (images && Array.isArray(images) && images.length > 0) {
          setImagesUploaded(true);
        }

        // Mark hydration complete after all state updates have settled
        setTimeout(() => {
          hasHydratedRef.current = true; // Prevent re-hydration
          isHydratingRef.current = false; // Allow auto-save now
        }, 100); // Small delay to ensure all React updates have settled
      } catch {
        // ignore; existing guards already handle invalid car
        isHydratingRef.current = false; // Clear flag on error too
      }
    };
    hydrate();
  }, [carId, isAuthenticated, isLoading]);

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
        setInspectionData(result.data as Record<string, string>);
        setHasProgress(true);
      } else {
        // Handle duplicate chassis conflict
        if (
          result.code === "CAR_DUPLICATE_OWN_DRAFT" &&
          result.redirectToCarID
        ) {
          // Show modal asking user to choose: redirect or create new
          setConflictExistingCarId(result.redirectToCarID);
          setShowDuplicateConflictModal(true);
          return;
        }

        // Handle other duplicate scenarios with helpful redirects
        if (result.code === "CAR_DUPLICATE_OWN_ACTIVE") {
          router.replace("/listings?message=already-active");
          return;
        }

        if (result.code === "CAR_DUPLICATE_OWN_SOLD") {
          router.replace("/listings?message=already-sold");
          return;
        }

        if (result.code === "CAR_DUPLICATE_OTHER_OWNED") {
          router.replace("/browse?message=listed-by-other");
          return;
        }

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

  // Trigger autosave when form data changes (but not during initial hydration)
  useEffect(() => {
    if (
      hasHydratedRef.current && // Only autosave after initial hydration is complete
      !isHydratingRef.current && // Don't autosave while hydrating
      (currentStep === "documents" ||
        currentStep === "specs" ||
        currentStep === "pricing" ||
        currentStep === "review") &&
      Object.keys(formData).length > 0 &&
      !isSubmitting
    ) {
      debouncedAutoSave(formData);
    }
  }, [formData, currentStep, debouncedAutoSave, isSubmitting]);

  // Handle form field changes
  const handleFormChange = useCallback((updates: Partial<CarFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setHasProgress(true);
  }, []);

  // Handle progress restoration
  const handleProgressRestore = () => {
    setShowProgressRestoreModal(true);
  };

  const handleProgressRestoreSuccess = () => {
    // Reload the page to show restored data
    window.location.reload();
  };

  // Handle duplicate conflict modal actions
  const handleRedirectToExisting = async () => {
    if (!conflictExistingCarId) return;

    try {
      const redirectResult = await carsAPI.redirectToDraft(
        carId,
        conflictExistingCarId
      );
      if (redirectResult.success) {
        router.replace(`/sell/${redirectResult.redirectToCarId}`);
      }
    } catch (err) {
      setError(`Failed to redirect to existing draft: ${err}`);
    } finally {
      setShowDuplicateConflictModal(false);
      setConflictExistingCarId(null);
    }
  };

  const handleCreateNewListing = () => {
    // User chose to create new - continue with current car
    setShowDuplicateConflictModal(false);
    setConflictExistingCarId(null);
    setError("Please create a new listing for this vehicle");
  };

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

        {/* Progress restore button */}
        {currentStep === "documents" && !hasProgress && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-800 font-medium">
                  Restore Previous Progress
                </h3>
                <p className="text-blue-600 text-sm">
                  Have you started listing this car before? Restore your
                  progress from another draft.
                </p>
              </div>
              <button
                onClick={handleProgressRestore}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Restore Progress
              </button>
            </div>
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

        {/* Progress Restore Modal */}
        <ProgressRestoreModal
          isOpen={showProgressRestoreModal}
          onClose={() => setShowProgressRestoreModal(false)}
          targetCarId={carId}
          onSuccess={handleProgressRestoreSuccess}
        />

        {/* Duplicate Conflict Modal */}
        <DuplicateConflictModal
          isOpen={showDuplicateConflictModal}
          onClose={() => setShowDuplicateConflictModal(false)}
          onRedirect={handleRedirectToExisting}
          onCreateNew={handleCreateNewListing}
          existingCarId={conflictExistingCarId || 0}
        />
      </div>
    </div>
  );
}
