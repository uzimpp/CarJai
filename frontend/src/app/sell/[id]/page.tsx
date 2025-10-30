"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import { carsAPI } from "@/lib/carsAPI";
// import { referenceAPI } from "@/lib/referenceAPI"; // not used
import { debounce } from "@/utils/debounce";
import Step1DocumentsForm from "@/components/car/Step1DocumentsForm";
import Step2DetailsForm from "@/components/car/Step2DetailsForm";
import Step3PricingForm from "@/components/car/Step3PricingForm";
import Step4ReviewForm from "@/components/car/Step4ReviewForm";
import ProgressRestoreModal from "@/components/car/ProgressRestoreModal";
import DuplicateConflictModal from "@/components/car/DuplicateConflictModal";
import type { CarFormData, InspectionResult } from "@/types/car";
import type { Step } from "@/types/selling";

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

  // Form data - unified state
  const [formData, setFormData] = useState<Partial<CarFormData>>({});
  const [inspectionOpen, setInspectionOpen] = useState(false);

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
  const [_conflictExistingCarId, setConflictExistingCarId] = useState<
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
        const result = await carsAPI.restoreProgress(carId);
        if (!result.success) {
          setError("Car not found. Please start a new draft.");
          suppressAutoDiscardRef.current = true; // Don't discard non-existent cars
          setTimeout(() => router.push("/sell"), 2000);
        }
      } catch {
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
        const res = await carsAPI.restoreProgress(carId);
        if (!res.success) return;

        const car = res.data.car; // Access car data from nested structure
        if (!car) return;

        // Build unified formData from car payload
        const codeMapped: Partial<CarFormData> = {
          ...(car.bodyType && { bodyTypeName: car.bodyType }),
          ...(car.transmission && { transmissionName: car.transmission }),
          ...(car.drivetrain && { drivetrainName: car.drivetrain }),
          ...(Array.isArray(
            (car as unknown as { fuelTypes?: string[] }).fuelTypes
          ) &&
            ((car as unknown as { fuelTypes?: string[] }).fuelTypes?.length ??
              0) > 0 && {
              fuelLabels: (car as unknown as { fuelTypes?: string[] })
                .fuelTypes,
            }),
        };

        const initial: Partial<CarFormData> = {
          // Basic car info
          ...(car.brandName && { brandName: car.brandName }),
          ...(car.modelName && { modelName: car.modelName }),
          ...(car.submodelName && { submodelName: car.submodelName }),
          ...(car.year && { year: car.year }),
          ...(car.mileage && { mileage: car.mileage }),
          ...(car.engineCc && { engineCc: car.engineCc }),
          ...(car.seats && { seats: car.seats }),
          ...(car.doors && { doors: car.doors }),
          ...codeMapped,
          ...(car.conditionRating && { conditionRating: car.conditionRating }),
          ...(typeof car.isFlooded === "boolean" && {
            isFlooded: car.isFlooded,
          }),
          ...(typeof car.isHeavilyDamaged === "boolean" && {
            isHeavilyDamaged: car.isHeavilyDamaged,
          }),
          ...(car.description && { description: car.description }),
          ...(car.price && { price: car.price }),
          ...(car.province && { province: car.province }),
          ...(car.prefix && { prefix: car.prefix }),
          ...(car.number && { number: car.number }),
          ...(car.chassisNumber && { chassisNumber: car.chassisNumber }),
          ...(car.licensePlate && { licensePlate: car.licensePlate }),
          // Colors from car
          ...(Array.isArray((car as unknown as { colors?: string[] }).colors) &&
            ((car as unknown as { colors?: string[] }).colors?.length ?? 0) >
              0 && {
              colors: (car as unknown as { colors?: string[] }).colors,
            }),
        };

        // Load inspection data if exists (from same response)
        const inspection = res.data.inspection;
        if (inspection) {
          // Map all inspection fields into formData
          if (inspection.station) initial.station = inspection.station;
          if (inspection.overallPass !== undefined)
            initial.overallPass = inspection.overallPass;
          if (inspection.brakeResult !== undefined)
            initial.brakeResult = inspection.brakeResult;
          if (inspection.handbrakeResult !== undefined)
            initial.handbrakeResult = inspection.handbrakeResult;
          if (inspection.alignmentResult !== undefined)
            initial.alignmentResult = inspection.alignmentResult;
          if (inspection.noiseResult !== undefined)
            initial.noiseResult = inspection.noiseResult;
          if (inspection.emissionResult !== undefined)
            initial.emissionResult = inspection.emissionResult;
          if (inspection.hornResult !== undefined)
            initial.hornResult = inspection.hornResult;
          if (inspection.speedometerResult !== undefined)
            initial.speedometerResult = inspection.speedometerResult;
          if (inspection.highLowBeamResult !== undefined)
            initial.highLowBeamResult = inspection.highLowBeamResult;
          if (inspection.signalLightsResult !== undefined)
            initial.signalLightsResult = inspection.signalLightsResult;
          if (inspection.otherLightsResult !== undefined)
            initial.otherLightsResult = inspection.otherLightsResult;
          if (inspection.windshieldResult !== undefined)
            initial.windshieldResult = inspection.windshieldResult;
          if (inspection.steeringResult !== undefined)
            initial.steeringResult = inspection.steeringResult;
          if (inspection.wheelsTiresResult !== undefined)
            initial.wheelsTiresResult = inspection.wheelsTiresResult;
          if (inspection.fuelTankResult !== undefined)
            initial.fuelTankResult = inspection.fuelTankResult;
          if (inspection.chassisResult !== undefined)
            initial.chassisResult = inspection.chassisResult;
          if (inspection.bodyResult !== undefined)
            initial.bodyResult = inspection.bodyResult;
          if (inspection.doorsFloorResult !== undefined)
            initial.doorsFloorResult = inspection.doorsFloorResult;
          if (inspection.seatbeltResult !== undefined)
            initial.seatbeltResult = inspection.seatbeltResult;
          if (inspection.wiperResult !== undefined)
            initial.wiperResult = inspection.wiperResult;
        }

        // Mark images uploaded if server has images metadata
        if (res.data.images && res.data.images.length > 0) {
          initial.imagesUploaded = true;
        }

        // Update formData with all loaded data
        if (Object.keys(initial).length > 0) {
          setFormData((prev) => ({ ...initial, ...prev })); // preserve any local edits
          setHasProgress(true);
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
        // Merge inspection result into formData
        const inspectionData = result.data as unknown as InspectionResult;
        setFormData((prev) => ({
          ...prev,
          // Inspection metadata
          chassisNumber: inspectionData.chassisNumber,
          licensePlate: inspectionData.licensePlate,
          colors: inspectionData.colors,
          prefix: inspectionData.prefix,
          number: inspectionData.number,
          provinceTh: inspectionData.provinceTh,
          mileage: inspectionData.mileage,
          // Inspection station and results
          station: inspectionData.station,
          overallPass: inspectionData.overallPass,
          brakeResult: inspectionData.brakeResult,
          handbrakeResult: inspectionData.handbrakeResult,
          alignmentResult: inspectionData.alignmentResult,
          noiseResult: inspectionData.noiseResult,
          emissionResult: inspectionData.emissionResult,
          hornResult: inspectionData.hornResult,
          speedometerResult: inspectionData.speedometerResult,
          highLowBeamResult: inspectionData.highLowBeamResult,
          signalLightsResult: inspectionData.signalLightsResult,
          otherLightsResult: inspectionData.otherLightsResult,
          windshieldResult: inspectionData.windshieldResult,
          steeringResult: inspectionData.steeringResult,
          wheelsTiresResult: inspectionData.wheelsTiresResult,
          fuelTankResult: inspectionData.fuelTankResult,
          chassisResult: inspectionData.chassisResult,
          bodyResult: inspectionData.bodyResult,
          doorsFloorResult: inspectionData.doorsFloorResult,
          seatbeltResult: inspectionData.seatbeltResult,
          wiperResult: inspectionData.wiperResult,
        }));
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

        // Handle other duplicate scenarios with user-friendly errors
        if (result.code === "CAR_DUPLICATE_OWN_ACTIVE") {
          setError(
            "You already have an active listing for this vehicle. Please check your listings page."
          );
          setTimeout(() => router.replace("/listings"), 3000);
          return;
        }

        if (result.code === "CAR_DUPLICATE_OWN_SOLD") {
          setError("This vehicle is already marked as sold in your listings.");
          setTimeout(() => router.replace("/listings"), 3000);
          return;
        }

        if (result.code === "CAR_DUPLICATE_OTHER_OWNED") {
          setError(
            "This vehicle is already listed by another seller. You cannot create a duplicate listing."
          );
          setTimeout(() => router.replace("/browse"), 3000);
          return;
        }

        throw new Error(result.message || "Failed to upload inspection");
      }
    } catch (err) {
      throw err;
    }
  };

  // Helper to filter out read-only fields before saving
  const sanitizeForSave = useCallback((data: Partial<CarFormData>) => {
    // Define editable fields (fields we want to keep)
    const editableFields = new Set<keyof CarFormData>([
      "brandName",
      "modelName",
      "submodelName",
      "mileage",
      "year",
      "seats",
      "doors",
      "engineCc",
      "bodyTypeName",
      "transmissionName",
      "drivetrainName",
      "fuelLabels",
      "isFlooded",
      "isHeavilyDamaged",
      "conditionRating",
      "price",
      "description",
      "images",
    ]);

    // Return only editable fields
    const sanitized: Partial<CarFormData> = {};
    for (const [key, value] of Object.entries(data)) {
      if (editableFields.has(key as keyof CarFormData)) {
        (sanitized as Record<string, unknown>)[key] = value;
      }
    }
    return sanitized;
  }, []);

  // Autosave draft with debounce (Steps 2 & 3)
  const debouncedAutoSave = useMemo(
    () =>
      debounce(async (data: Partial<CarFormData>) => {
        if (!carId) return;

        try {
          await carsAPI.autosaveDraft(carId, sanitizeForSave(data));
          setHasProgress(true);
        } catch {
          // Silent fail for autosave
        }
      }, 1500), // 1.5 seconds debounce
    [carId, sanitizeForSave]
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

  const handleCreateNewListing = () => {
    // User chose to start fresh - continue with current car
    setShowDuplicateConflictModal(false);
    setConflictExistingCarId(null);
    // Clear the error so they can continue on this page
    setError("");
  };

  // Compute inspection pass summary from formData
  const computeInspectionPassSummary = useCallback(() => {
    const keys: (keyof CarFormData)[] = [
      "overallPass",
      "brakeResult",
      "handbrakeResult",
      "alignmentResult",
      "noiseResult",
      "emissionResult",
      "hornResult",
      "speedometerResult",
      "highLowBeamResult",
      "signalLightsResult",
      "otherLightsResult",
      "windshieldResult",
      "steeringResult",
      "wheelsTiresResult",
      "fuelTankResult",
      "chassisResult",
      "bodyResult",
      "doorsFloorResult",
      "seatbeltResult",
      "wiperResult",
    ];
    const total = keys.length;
    const passed = keys.reduce((acc, k) => {
      const val = formData[k];
      return typeof val === "boolean" && val ? acc + 1 : acc;
    }, 0);
    return total > 0 ? { passed, total } : undefined;
  }, [formData]);

  // Handle review (Step 4)
  const handleReview = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      // Ensure latest edits are saved before review
      if (Object.keys(formData).length > 0) {
        try {
          await carsAPI.autosaveDraft(carId, sanitizeForSave(formData));
          setHasProgress(true);
        } catch {
          // ignore autosave failure before review
        }
      }
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
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
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

        {/* Progress indicator (Signup-style) */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            {(["documents", "specs", "pricing", "review"] as Step[]).map(
              (step, index) => {
                const stepOrder = ["documents", "specs", "pricing", "review"];
                const currentStepIndex = stepOrder.indexOf(currentStep);
                const isCompleted = index < currentStepIndex;
                const isCurrent = currentStep === step;

                return (
                  <div key={step} className="flex-1 flex items-start">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-(--space-m) h-(--space-m) rounded-full flex items-center justify-center text--1 font-semibold transition-all duration-200 ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isCurrent
                            ? "bg-black text-white ring-4 ring-black/20"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isCompleted ? (
                          <svg
                            className="w-(--space-s) h-(--space-s)"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          String(index + 1)
                        )}
                      </div>
                      <span
                        className={`mt-2 text-sm font-medium transition-colors ${
                          isCompleted || isCurrent
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {step === "documents"
                          ? "Documents"
                          : step === "specs"
                          ? "Specs"
                          : step === "pricing"
                          ? "Pricing"
                          : "Review"}
                      </span>
                    </div>

                    {index < 3 && (
                      <div className="flex items-center flex-1 pt-(--space-xs) px-2">
                        <div
                          className={`w-full h-1 rounded transition-colors duration-300 ${
                            index + 1 <= currentStepIndex
                              ? isCurrent
                                ? "bg-black"
                                : "bg-green-500/60"
                              : "bg-gray-200"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              }
            )}
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
              <h2 className="text-2xl font-semibold mb-6">Step 1: Documents</h2>
              <p className="text-gray-600 mb-6">
                Upload your inspection report and optionally your registration
                book. Book OCR is just a helper to auto-fill fields — you can
                also edit them manually.
              </p>
              <Step1DocumentsForm
                formData={formData}
                onFormDataChange={handleFormChange}
                onBookUpload={handleBookUpload}
                onInspectionUpload={handleInspectionUpload}
                inspectionOpen={inspectionOpen}
                onToggleInspection={() => setInspectionOpen((o) => !o)}
                inspectionPassSummary={computeInspectionPassSummary()}
                onContinue={async () => {
                  // save progress before moving forward
                  if (Object.keys(formData).length > 0) {
                    try {
                      await carsAPI.autosaveDraft(
                        carId,
                        sanitizeForSave(formData)
                      );
                      setHasProgress(true);
                    } catch {
                      // best-effort; continue navigation
                    }
                  }
                  setCurrentStep("specs");
                }}
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
                onContinue={async () => {
                  if (Object.keys(formData).length > 0) {
                    try {
                      await carsAPI.autosaveDraft(
                        carId,
                        sanitizeForSave(formData)
                      );
                      setHasProgress(true);
                    } catch {}
                  }
                  setCurrentStep("pricing");
                }}
                onBack={async () => {
                  if (Object.keys(formData).length > 0) {
                    try {
                      await carsAPI.autosaveDraft(
                        carId,
                        sanitizeForSave(formData)
                      );
                      setHasProgress(true);
                    } catch {}
                  }
                  setCurrentStep("documents");
                }}
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
                onBack={async () => {
                  if (Object.keys(formData).length > 0) {
                    try {
                      await carsAPI.autosaveDraft(
                        carId,
                        sanitizeForSave(formData)
                      );
                      setHasProgress(true);
                    } catch {}
                  }
                  setCurrentStep("specs");
                }}
                isSubmitting={isSubmitting}
                imagesUploaded={formData.imagesUploaded || false}
                onImagesUploaded={() => {
                  handleFormChange({ imagesUploaded: true });
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
                onChange={handleFormChange}
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
          onRedirect={handleProgressRestore}
          onCreateNew={handleCreateNewListing}
        />
      </div>
    </div>
  );
}
