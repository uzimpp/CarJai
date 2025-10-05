"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import DocumentUploader from "@/components/features/ocr/DocumentUploader";
import QrCodeUploader from "@/components/features/inspection/QrCodeUploader";
import { apiCall } from "@/lib/apiCall";
import { InspectionData } from "@/types/inspection";
import { parseOcrData } from "@/lib/ocrUtils";
import { mapInspectionDataToForm } from "@/lib/inspectionUtils";

// Complete car data interface matching backend
interface CarData {
  // Required
  price: number;

  // Cars table
  year?: number;
  mileage?: number;
  province?: string;
  conditionRating?: number;
  bodyTypeId?: number;
  transmissionId?: number;
  fuelTypeId?: number;
  drivetrainId?: number;
  seats?: number;
  doors?: number;
  color?: string;
  status?: string;

  // Car details table
  brandName?: string;
  modelName?: string;
  registrationNumber?: string;
  vin?: string; // Chassis number
  engineNumber?: string;
  bodyStyle?: string; // Vehicle type

  // Inspection results
  overallResult?: string;
  brakePerformance?: string;
  handbrakePerformance?: string;
  emissionValue?: string;
  noiseLevel?: string;
  brakeResult?: string;
  wheelAlignmentResult?: string;
  emissionResult?: string;
  chassisConditionResult?: string;
}

type Step = "registration" | "inspection" | "details" | "review" | "success";

export default function SellPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, roles, profiles } = useUserAuth();

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>("registration");

  // Data from OCR (Step 1)
  const [extractedCarData, setExtractedCarData] = useState<Partial<CarData>>(
    {}
  );

  // Data from Inspection (Step 2)
  const [inspectionUrl, setInspectionUrl] = useState<string>("");
  const [inspectionData, setInspectionData] = useState<InspectionData | null>(
    null
  );
  const [isScraping, setIsScraping] = useState<boolean>(false);

  // User input data (Step 3)
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);

  // Editable data in review (Step 4)
  const [editableData, setEditableData] = useState<CarData>({ price: 0 });
  const [showInspectionDetails, setShowInspectionDetails] = useState(false);

  // Final
  const [createdCarId, setCreatedCarId] = useState<number | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Redirect logic for seller guard
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

  // Auto-scrape inspection data when QR URL is available
  useEffect(() => {
    const scrapeData = async () => {
      if (inspectionUrl && currentStep === "inspection") {
        setIsScraping(true);
        setError("");
        setInspectionData(null);

        try {
          const response = await fetch("http://localhost:8080/api/scrape/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: inspectionUrl }),
          });
          const result = await response.json();

          if (result.success) {
            setInspectionData(result.data);
            setTimeout(() => {
              setCurrentStep("details");
            }, 1500);
          } else {
            setError(result.message || "Unable to retrieve inspection data");
          }
        } catch {
          setError("Error connecting to Backend Scraper");
        } finally {
          setIsScraping(false);
        }
      }
    };
    scrapeData();
  }, [inspectionUrl, currentStep]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !roles?.seller || !profiles?.sellerComplete) {
    return null;
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleOcrComplete = (extractedText: string) => {
    const parsed = parseOcrData(extractedText);

    // Map OCR fields to backend field names
    const mapped: Partial<CarData> = {
      brandName:
        "brand" in parsed
          ? ((parsed as Record<string, unknown>).brand as string)
          : undefined,
      modelName:
        "model" in parsed
          ? ((parsed as Record<string, unknown>).model as string)
          : undefined,
      year: parsed.year,
      province: parsed.province,
      color: parsed.color,
      seats: parsed.seats,
      mileage: parsed.mileage,
    };

    setExtractedCarData(mapped);
    setCurrentStep("inspection");
  };

  const handleSkipOcr = () => {
    setExtractedCarData({});
    setCurrentStep("inspection");
  };

  const handleQrScanComplete = (url: string) => {
    setInspectionUrl(url);
  };

  const handleSkipInspection = () => {
    setInspectionUrl("");
    setInspectionData(null);
    setCurrentStep("details");
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!price || parseFloat(price) <= 0) {
      setError("Please enter a selling price");
      return;
    }

    // Combine all data
    const inspectionMapped = mapInspectionDataToForm(inspectionData);
    const inspectionRecord = inspectionMapped as Record<
      string,
      string | number | undefined
    >;

    // Map inspection data to backend fields
    const combined: CarData = {
      ...extractedCarData,
      brandName: extractedCarData.brandName,
      modelName: extractedCarData.modelName,
      registrationNumber: inspectionRecord.registrationNumber as
        | string
        | undefined,
      vin: inspectionRecord.vin as string | undefined,
      engineNumber: inspectionRecord.engineNumber as string | undefined,
      bodyStyle: inspectionRecord.bodyStyle as string | undefined,
      overallResult: inspectionRecord.overallResult as string | undefined,
      brakePerformance: inspectionRecord.brakePerformance as string | undefined,
      handbrakePerformance: inspectionRecord.handbrakePerformance as
        | string
        | undefined,
      emissionValue: inspectionRecord.emissionValue as string | undefined,
      noiseLevel: inspectionRecord.noiseLevel as string | undefined,
      brakeResult: inspectionRecord.brakeResult as string | undefined,
      wheelAlignmentResult: inspectionRecord.wheelAlignmentResult as
        | string
        | undefined,
      emissionResult: inspectionRecord.emissionResult as string | undefined,
      chassisConditionResult: inspectionRecord.chassisConditionResult as
        | string
        | undefined,
      mileage:
        (inspectionRecord.mileage as number | undefined) ||
        extractedCarData.mileage,
      price: parseFloat(price),
    };

    setEditableData(combined);
    setCurrentStep("review");
  };

  const handleEditChange = (field: keyof CarData, value: string | number) => {
    setEditableData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      // Clean data before sending - remove invalid fields
      const cleanData: Partial<CarData & { status?: string }> = {
        ...editableData,
      };

      // Remove text fuelType if it exists
      if (typeof cleanData.fuelTypeId === "string") {
        delete cleanData.fuelTypeId;
      }

      // Ensure numeric fields are numbers
      if (cleanData.year) cleanData.year = parseInt(String(cleanData.year), 10);
      if (cleanData.mileage)
        cleanData.mileage = parseInt(String(cleanData.mileage), 10);
      if (cleanData.seats)
        cleanData.seats = parseInt(String(cleanData.seats), 10);
      if (cleanData.doors)
        cleanData.doors = parseInt(String(cleanData.doors), 10);
      if (cleanData.price)
        cleanData.price = parseFloat(String(cleanData.price));

      // Add status
      cleanData.status = "draft";

      console.log("Sending car data:", cleanData);

      // Step 1: Create car
      const result = await apiCall<{
        success: boolean;
        data?: { cid: number };
        message?: string;
      }>("/api/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      });

      if (!result.success || !result.data) {
        throw new Error(result.message || "Error creating car listing");
      }

      const carId = result.data.cid;
      setCreatedCarId(carId);

      // Step 2: Upload images if any
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => {
          formData.append("images", img);
        });

        await apiCall(`/api/cars/${carId}/images`, {
          method: "POST",
          body: formData,
        });
      }

      setCurrentStep("success");
    } catch (err) {
      console.error("Submit error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!createdCarId) return;
    setIsSubmitting(true);
    setError("");

    try {
      const result = await apiCall<{ success: boolean; message?: string }>(
        `/api/cars/${createdCarId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "active" }),
        }
      );

      if (result.success) {
        alert("Listing published successfully!");
        router.push("/buy");
      } else {
        setError(result.message || "Error publishing listing");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNew = () => {
    setCurrentStep("registration");
    setExtractedCarData({});
    setInspectionUrl("");
    setInspectionData(null);
    setPrice("");
    setDescription("");
    setImages([]);
    setEditableData({ price: 0 });
    setCreatedCarId(null);
    setError("");
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-(--space-s-m)">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="text-center mb-(--space-xl)">
          <h1 className="text-5 bold text-gray-900 mb-(--space-xs) line-height-11">
            Sell Your Car
          </h1>
          <p className="text-1 text-gray-600 line-height-12">
            Just 4 simple steps and your listing is ready to go
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-(--space-xl)">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {[
              { id: "registration", label: "Registration", num: 1 },
              { id: "inspection", label: "Inspection", num: 2 },
              { id: "details", label: "Details", num: 3 },
              { id: "review", label: "Review", num: 4 },
            ].map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted =
                (step.id === "registration" &&
                  currentStep !== "registration") ||
                (step.id === "inspection" &&
                  (currentStep === "details" ||
                    currentStep === "review" ||
                    currentStep === "success")) ||
                (step.id === "details" &&
                  (currentStep === "review" || currentStep === "success")) ||
                (step.id === "review" && currentStep === "success");

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`
                        w-14 h-14 rounded-full flex items-center justify-center text-1 bold transition-all duration-300
                        ${
                          isActive
                            ? "bg-maroon text-white ring-4 ring-maroon/20 scale-110 shadow-lg"
                            : isCompleted
                            ? "bg-green-600 text-white shadow-md"
                            : "bg-gray-200 text-gray-500"
                        }
                      `}
                    >
                      {isCompleted ? "✓" : step.num}
                    </div>
                    <span
                      className={`mt-(--space-xs) text-0 medium ${
                        isActive ? "text-maroon" : "text-gray-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`h-1.5 flex-1 mx-(--space-xs) rounded-full transition-all duration-300 ${
                        isCompleted ? "bg-green-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex justify-center">
          {/* STEP 1: Registration Book */}
          {currentStep === "registration" && (
            <div className="w-full max-w-4xl mx-auto">
              <div className="bg-white rounded-4xl shadow-[var(--shadow-lg)] p-(--space-xl)">
                <div className="text-center mb-(--space-l)">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-maroon to-red rounded-3xl mb-(--space-s) shadow-lg">
                    <span className="text-3xl">📄</span>
                  </div>
                  <h2 className="text-3 bold text-gray-900 mb-(--space-2xs) line-height-11">
                    Upload Registration Book
                  </h2>
                  <p className="text-0 text-gray-600 line-height-12">
                    The system will automatically extract car details from your
                    registration document
                  </p>
                </div>
                <DocumentUploader onComplete={handleOcrComplete} />
                <div className="mt-(--space-l) text-center">
                  <button
                    onClick={handleSkipOcr}
                    className="text-gray-600 hover:text-maroon transition-colors underline text-0 medium"
                  >
                    Skip this step →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Inspection QR Code */}
          {currentStep === "inspection" && (
            <div className="w-full max-w-4xl mx-auto">
              <div className="bg-white rounded-4xl shadow-[var(--shadow-lg)] p-(--space-xl)">
                <div className="text-center mb-(--space-l)">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-3xl mb-(--space-s) shadow-lg">
                    <span className="text-3xl">✅</span>
                  </div>
                  <h2 className="text-3 bold text-gray-900 mb-(--space-2xs) line-height-11">
                    Scan Inspection QR Code
                  </h2>
                  <p className="text-0 text-gray-600 line-height-12">
                    {isScraping
                      ? "Retrieving inspection data..."
                      : "Upload the QR code image from your vehicle inspection report"}
                  </p>
                </div>

                {isScraping ? (
                  <div className="text-center py-(--space-2xl)">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-maroon mx-auto"></div>
                    <p className="mt-(--space-m) text-gray-600 medium text-1">
                      Processing...
                    </p>
                  </div>
                ) : inspectionData ? (
                  <div className="text-center py-(--space-2xl)">
                    <div className="text-green-600 text-6xl mb-(--space-m)">
                      ✓
                    </div>
                    <p className="text-2 bold text-gray-900 mb-(--space-xs)">
                      Data Retrieved Successfully!
                    </p>
                    <p className="text-0 text-gray-600">
                      Proceeding to next step...
                    </p>
                  </div>
                ) : (
                  <>
                    <QrCodeUploader onScanComplete={handleQrScanComplete} />
                    <div className="mt-(--space-l) flex gap-(--space-s)">
                      <button
                        onClick={() => setCurrentStep("registration")}
                        className="flex-1 px-(--space-m) py-(--space-s) text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all medium"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={handleSkipInspection}
                        className="flex-1 px-(--space-m) py-(--space-s) text-maroon border-2 border-maroon rounded-2xl hover:bg-maroon/5 transition-all medium"
                      >
                        Skip this step →
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Details */}
          {currentStep === "details" && (
            <div className="w-full max-w-4xl mx-auto">
              <div className="bg-white rounded-4xl shadow-[var(--shadow-lg)] p-(--space-xl)">
                <div className="text-center mb-(--space-l)">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-maroon to-red rounded-3xl mb-(--space-s) shadow-lg">
                    <span className="text-3xl">💰</span>
                  </div>
                  <h2 className="text-3 bold text-gray-900 mb-(--space-2xs) line-height-11">
                    Set Price & Details
                  </h2>
                  <p className="text-0 text-gray-600 line-height-12">
                    Fill in the essential information for your listing
                  </p>
                </div>

                <form
                  onSubmit={handleDetailsSubmit}
                  className="space-y-(--space-l)"
                >
                  <div>
                    <label className="block text-1 bold text-gray-900 mb-(--space-s)">
                      Selling Price (THB) <span className="text-red">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. 500000"
                        required
                        min="1"
                        className="w-full px-(--space-m) py-(--space-s) text-1 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-maroon/20 focus:border-maroon transition-all"
                      />
                      <span className="absolute right-(--space-m) top-1/2 -translate-y-1/2 text-gray-400 text-0">
                        ฿
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-1 bold text-gray-900 mb-(--space-s)">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Well maintained, never been in an accident..."
                      rows={4}
                      className="w-full px-(--space-m) py-(--space-s) text-0 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-maroon/20 focus:border-maroon transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-1 bold text-gray-900 mb-(--space-s)">
                      Car Images (5-12 photos)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-(--space-m) hover:border-maroon transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setImages(files);
                        }}
                        className="w-full text-0"
                      />
                    </div>
                    {images.length > 0 && (
                      <p className="mt-(--space-xs) text--1 text-green-600 medium">
                        ✓ {images.length} image{images.length > 1 ? "s" : ""}{" "}
                        selected
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="p-(--space-m) bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 text-0">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-(--space-s) pt-(--space-m)">
                    <button
                      type="button"
                      onClick={() => setCurrentStep("inspection")}
                      className="px-(--space-l) py-(--space-s) text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all medium"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-(--space-l) py-(--space-s) text-white bg-gradient-to-r from-maroon to-red rounded-2xl hover:shadow-lg transition-all bold text-1 shadow-md"
                    >
                      Next: Review Data →
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Edit */}
          {currentStep === "review" && (
            <div className="w-full max-w-5xl mx-auto">
              <div className="bg-white rounded-4xl shadow-[var(--shadow-lg)] p-(--space-xl)">
                <div className="text-center mb-(--space-l)">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl mb-(--space-s) shadow-lg">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h2 className="text-3 bold text-gray-900 mb-(--space-2xs) line-height-11">
                    Review & Edit Information
                  </h2>
                  <p className="text-0 text-gray-600 line-height-12">
                    Verify accuracy - you can edit any information before
                    submitting
                  </p>
                </div>

                <div className="space-y-(--space-m)">
                  {/* Price Highlight */}
                  <div className="bg-gradient-to-r from-maroon/10 to-red/10 p-(--space-l) rounded-3xl border-2 border-maroon/20">
                    <p className="text-0 text-gray-600 mb-(--space-xs)">
                      Selling Price
                    </p>
                    <div className="flex items-baseline gap-(--space-xs)">
                      <span className="text-1 text-maroon bold">฿</span>
                      <input
                        type="number"
                        value={editableData.price}
                        onChange={(e) =>
                          handleEditChange("price", parseFloat(e.target.value))
                        }
                        className="text-4 bold text-maroon bg-transparent border-b-2 border-maroon/30 focus:border-maroon outline-none flex-1"
                      />
                    </div>
                  </div>

                  {/* Car Registration Details - EDITABLE */}
                  <div className="border-2 border-gray-200 rounded-3xl p-(--space-l)">
                    <h3 className="text-1 bold text-gray-900 mb-(--space-m) flex items-center">
                      <span className="mr-(--space-xs)">📄</span>
                      Registration Details
                      <span className="ml-(--space-xs) text--1 regular text-gray-500">
                        (Editable)
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-(--space-s)">
                      {[
                        { key: "brandName", label: "Brand" },
                        { key: "modelName", label: "Model" },
                        { key: "year", label: "Year", type: "number" },
                        { key: "registrationNumber", label: "License Plate" },
                        { key: "province", label: "Province" },
                        { key: "vin", label: "VIN/Chassis Number" },
                        { key: "engineNumber", label: "Engine Number" },
                        { key: "bodyStyle", label: "Body Style" },
                        { key: "color", label: "Color" },
                        {
                          key: "mileage",
                          label: "Mileage (km)",
                          type: "number",
                        },
                        { key: "seats", label: "Seats", type: "number" },
                        { key: "doors", label: "Doors", type: "number" },
                      ].map((field) => {
                        const value = editableData[field.key as keyof CarData];
                        if (!value && value !== 0) return null;

                        return (
                          <div
                            key={field.key}
                            className="bg-gray-50 p-(--space-s) rounded-2xl"
                          >
                            <label className="block text--1 text-gray-500 mb-(--space-3xs)">
                              {field.label}
                            </label>
                            <input
                              type={field.type || "text"}
                              value={value}
                              onChange={(e) =>
                                handleEditChange(
                                  field.key as keyof CarData,
                                  field.type === "number"
                                    ? parseInt(e.target.value) || 0
                                    : e.target.value
                                )
                              }
                              className="w-full medium text-gray-900 bg-white border border-gray-200 rounded-xl px-(--space-s) py-(--space-xs) focus:border-maroon focus:ring-2 focus:ring-maroon/20 transition-all"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inspection Results - COLLAPSIBLE */}
                  {(editableData.overallResult ||
                    editableData.brakePerformance) && (
                    <div className="border-2 border-gray-200 rounded-3xl p-(--space-l)">
                      <button
                        onClick={() =>
                          setShowInspectionDetails(!showInspectionDetails)
                        }
                        className="w-full flex items-center justify-between text-left"
                      >
                        <h3 className="text-1 bold text-gray-900 flex items-center">
                          <span className="mr-(--space-xs)">✅</span>
                          Inspection Results
                          <span className="ml-(--space-s) px-(--space-s) py-(--space-3xs) text--1 bg-green-100 text-green-700 rounded-full medium">
                            {editableData.overallResult || "N/A"}
                          </span>
                        </h3>
                        <span className="text-2 text-gray-400">
                          {showInspectionDetails ? "−" : "+"}
                        </span>
                      </button>

                      {showInspectionDetails && (
                        <div className="mt-(--space-m) pt-(--space-m) border-t grid grid-cols-1 sm:grid-cols-2 gap-(--space-s)">
                          {[
                            {
                              key: "brakePerformance",
                              label: "Brake Performance",
                              unit: "%",
                            },
                            {
                              key: "handbrakePerformance",
                              label: "Handbrake Performance",
                              unit: "%",
                            },
                            {
                              key: "emissionValue",
                              label: "CO Emission Value",
                              unit: "%",
                            },
                            {
                              key: "noiseLevel",
                              label: "Noise Level",
                              unit: "dB",
                            },
                            { key: "brakeResult", label: "Brake Result" },
                            {
                              key: "wheelAlignmentResult",
                              label: "Wheel Alignment",
                            },
                            { key: "emissionResult", label: "Emission Result" },
                            {
                              key: "chassisConditionResult",
                              label: "Chassis Condition",
                            },
                          ].map((field) => {
                            const value =
                              editableData[field.key as keyof CarData];
                            if (!value) return null;

                            return (
                              <div
                                key={field.key}
                                className="bg-gradient-to-br from-gray-50 to-gray-100 p-(--space-s) rounded-2xl"
                              >
                                <p className="text--1 text-gray-500 mb-(--space-3xs)">
                                  {field.label}
                                </p>
                                <p className="medium text-gray-900">
                                  {value} {field.unit || ""}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Images */}
                  {images.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-(--space-m) rounded-2xl border border-blue-200">
                      <p className="text-0 text-blue-900 mb-(--space-xs) medium">
                        📸 Car Images
                      </p>
                      <p className="text-1 bold text-blue-900">
                        {images.length} image{images.length > 1 ? "s" : ""}{" "}
                        uploaded
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-(--space-m) p-(--space-m) bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 text-0">
                    {error}
                  </div>
                )}

                <div className="flex gap-(--space-s) mt-(--space-xl)">
                  <button
                    onClick={() => setCurrentStep("details")}
                    disabled={isSubmitting}
                    className="px-(--space-l) py-(--space-s) text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all medium disabled:opacity-50"
                  >
                    ← Edit
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-(--space-l) py-(--space-s) text-white bg-gradient-to-r from-green-600 to-green-700 rounded-2xl hover:shadow-lg transition-all bold text-1 shadow-md disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Creating listing..."
                      : "✓ Confirm & Create Listing"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {currentStep === "success" && (
            <div className="w-full max-w-2xl mx-auto">
              <div className="bg-white rounded-4xl shadow-[var(--shadow-lg)] p-(--space-2xl) text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-(--space-l) shadow-xl">
                  <span className="text-6xl text-white">✓</span>
                </div>
                <h2 className="text-4 bold text-gray-900 mb-(--space-s) line-height-11">
                  Listing Created Successfully!
                </h2>
                <p className="text-1 text-gray-600 mb-(--space-xl) line-height-12">
                  Your listing has been saved. You can publish it right away
                </p>

                {error && (
                  <div className="mb-(--space-m) p-(--space-m) bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 text-0">
                    {error}
                  </div>
                )}

                <div className="space-y-(--space-s)">
                  <button
                    onClick={handlePublish}
                    disabled={isSubmitting}
                    className="w-full px-(--space-xl) py-(--space-m) text-white bg-gradient-to-r from-green-600 to-green-700 rounded-3xl hover:shadow-xl transition-all bold text-1 shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? "Publishing..." : "🚀 Publish Listing Now"}
                  </button>

                  <button
                    onClick={() => router.push("/listings")}
                    disabled={isSubmitting}
                    className="w-full px-(--space-xl) py-(--space-m) text-maroon border-2 border-maroon rounded-3xl hover:bg-maroon/5 transition-all medium disabled:opacity-50"
                  >
                    View My Listings
                  </button>

                  <button
                    onClick={handleStartNew}
                    disabled={isSubmitting}
                    className="w-full px-(--space-xl) py-(--space-m) text-gray-700 bg-gray-100 rounded-3xl hover:bg-gray-200 transition-all medium disabled:opacity-50"
                  >
                    + Add Another Listing
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
