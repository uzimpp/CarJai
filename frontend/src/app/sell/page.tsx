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
            setError(result.message || "ไม่สามารถดึงข้อมูลใบตรวจสภาพได้");
          }
        } catch {
          setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับ Backend Scraper");
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
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
      setError("กรุณากรอกราคาขาย");
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
        throw new Error(result.message || "เกิดข้อผิดพลาดในการสร้างประกาศขาย");
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
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด"
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
        alert("เผยแพร่ประกาศขายสำเร็จ!");
        router.push("/buy");
      } else {
        setError(result.message || "เกิดข้อผิดพลาดในการเผยแพร่");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">ขายรถยนต์</h1>
          <p className="text-lg text-gray-600">
            เพียง 4 ขั้นตอนง่ายๆ ประกาศขายของคุณพร้อมใช้งาน
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { id: "registration", label: "สมุดทะเบียน", num: 1 },
              { id: "inspection", label: "ใบตรวจสภาพ", num: 2 },
              { id: "details", label: "รายละเอียด", num: 3 },
              { id: "review", label: "ตรวจสอบ", num: 4 },
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
                        w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all
                        ${
                          isActive
                            ? "bg-red-600 text-white ring-4 ring-red-100 scale-110"
                            : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-500"
                        }
                      `}
                    >
                      {isCompleted ? "✓" : step.num}
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        isActive ? "text-red-600" : "text-gray-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        isCompleted ? "bg-green-500" : "bg-gray-200"
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
            <div className="w-full max-w-3xl">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  📄 อัปโหลดสมุดทะเบียนรถ
                </h2>
                <p className="text-gray-600 mb-6">
                  ระบบจะดึงข้อมูลรถยนต์จากสมุดทะเบียนโดยอัตโนมัติ
                </p>
                <DocumentUploader onComplete={handleOcrComplete} />
                <div className="mt-6 text-center">
                  <button
                    onClick={handleSkipOcr}
                    className="text-gray-600 hover:text-red-600 transition-colors underline"
                  >
                    ข้ามขั้นตอนนี้
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Inspection QR Code */}
          {currentStep === "inspection" && (
            <div className="w-full max-w-3xl">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  ✅ สแกน QR Code ใบตรวจสภาพ
                </h2>
                <p className="text-gray-600 mb-6">
                  {isScraping
                    ? "กำลังดึงข้อมูลใบตรวจสภาพ..."
                    : "อัปโหลดรูป QR Code จากใบตรวจสภาพรถ"}
                </p>

                {isScraping ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">
                      กำลังประมวลผล...
                    </p>
                  </div>
                ) : inspectionData ? (
                  <div className="text-center py-12">
                    <div className="text-green-500 text-6xl mb-4">✓</div>
                    <p className="text-xl font-semibold text-gray-900">
                      ดึงข้อมูลสำเร็จ!
                    </p>
                    <p className="text-gray-600 mt-2">
                      กำลังไปยังขั้นตอนถัดไป...
                    </p>
                  </div>
                ) : (
                  <>
                    <QrCodeUploader onScanComplete={handleQrScanComplete} />
                    <div className="mt-6 flex gap-4">
                      <button
                        onClick={() => setCurrentStep("registration")}
                        className="flex-1 px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        ← ย้อนกลับ
                      </button>
                      <button
                        onClick={handleSkipInspection}
                        className="flex-1 px-6 py-3 text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        ข้ามขั้นตอนนี้ →
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Details */}
          {currentStep === "details" && (
            <div className="w-full max-w-4xl">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  💰 กำหนดราคาและรายละเอียด
                </h2>
                <p className="text-gray-600 mb-8">
                  กรอกข้อมูลสำคัญที่จำเป็นสำหรับการขาย
                </p>

                <form onSubmit={handleDetailsSubmit} className="space-y-8">
                  <div>
                    <label className="block text-lg font-semibold text-gray-900 mb-3">
                      ราคาขาย (บาท) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="เช่น 500000"
                      required
                      min="1"
                      className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-gray-900 mb-3">
                      รายละเอียดเพิ่มเติม (ถ้ามี)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="เช่น รถสภาพดี ไม่เคยเกิดอุบัติเหตุ..."
                      rows={4}
                      className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-gray-900 mb-3">
                      รูปภาพรถยนต์ (5-12 รูป)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setImages(files);
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                    />
                    {images.length > 0 && (
                      <p className="mt-2 text-sm text-gray-600">
                        เลือกแล้ว {images.length} รูป
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep("inspection")}
                      className="px-8 py-4 text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                    >
                      ← ย้อนกลับ
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-8 py-4 text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all font-semibold text-lg shadow-lg"
                    >
                      ถัดไป: ตรวจสอบข้อมูล →
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Edit */}
          {currentStep === "review" && (
            <div className="w-full max-w-5xl">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  📋 ตรวจสอบและแก้ไขข้อมูล
                </h2>
                <p className="text-gray-600 mb-8">
                  ตรวจสอบความถูกต้อง คุณสามารถแก้ไขข้อมูลได้ก่อนส่ง
                </p>

                <div className="space-y-6">
                  {/* Price Highlight */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border-2 border-red-200">
                    <p className="text-sm text-gray-600 mb-2">ราคาขาย</p>
                    <input
                      type="number"
                      value={editableData.price}
                      onChange={(e) =>
                        handleEditChange("price", parseFloat(e.target.value))
                      }
                      className="text-3xl font-bold text-red-600 bg-transparent border-b-2 border-red-300 focus:border-red-600 outline-none w-full"
                    />
                  </div>

                  {/* Car Registration Details - EDITABLE */}
                  <div className="border-2 border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      📄 ข้อมูลจากสมุดทะเบียน
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        (แก้ไขได้)
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: "brandName", label: "ยี่ห้อ" },
                        { key: "modelName", label: "รุ่น" },
                        { key: "year", label: "ปี", type: "number" },
                        { key: "registrationNumber", label: "เลขทะเบียน" },
                        { key: "province", label: "จังหวัด" },
                        { key: "vin", label: "VIN/เลขตัวถัง" },
                        { key: "engineNumber", label: "เลขเครื่องยนต์" },
                        { key: "bodyStyle", label: "ลักษณะรถ" },
                        { key: "color", label: "สี" },
                        { key: "mileage", label: "เลขไมล์", type: "number" },
                        { key: "seats", label: "ที่นั่ง", type: "number" },
                        { key: "doors", label: "ประตู", type: "number" },
                      ].map((field) => {
                        const value = editableData[field.key as keyof CarData];
                        if (!value && value !== 0) return null;

                        return (
                          <div
                            key={field.key}
                            className="bg-gray-50 p-4 rounded-lg"
                          >
                            <label className="block text-xs text-gray-500 mb-1">
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
                              className="w-full font-medium text-gray-900 bg-white border border-gray-200 rounded px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inspection Results - COLLAPSIBLE */}
                  {(editableData.overallResult ||
                    editableData.brakePerformance) && (
                    <div className="border-2 border-gray-200 rounded-xl p-6">
                      <button
                        onClick={() =>
                          setShowInspectionDetails(!showInspectionDetails)
                        }
                        className="w-full flex items-center justify-between text-left"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          ✅ ผลการตรวจสภาพ
                          <span className="ml-3 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full">
                            {editableData.overallResult || "N/A"}
                          </span>
                        </h3>
                        <span className="text-2xl text-gray-400">
                          {showInspectionDetails ? "−" : "+"}
                        </span>
                      </button>

                      {showInspectionDetails && (
                        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                          {[
                            {
                              key: "brakePerformance",
                              label: "ประสิทธิภาพเบรก",
                              unit: "%",
                            },
                            {
                              key: "handbrakePerformance",
                              label: "ประสิทธิภาพเบรกมือ",
                              unit: "%",
                            },
                            {
                              key: "emissionValue",
                              label: "ค่าไอเสีย CO",
                              unit: "%",
                            },
                            {
                              key: "noiseLevel",
                              label: "ระดับเสียง",
                              unit: "dB",
                            },
                            { key: "brakeResult", label: "ผลเบรก" },
                            {
                              key: "wheelAlignmentResult",
                              label: "ผลศูนย์ล้อ",
                            },
                            { key: "emissionResult", label: "ผลมลพิษ" },
                            {
                              key: "chassisConditionResult",
                              label: "สภาพตัวถัง",
                            },
                          ].map((field) => {
                            const value =
                              editableData[field.key as keyof CarData];
                            if (!value) return null;

                            return (
                              <div
                                key={field.key}
                                className="bg-gray-50 p-3 rounded-lg"
                              >
                                <p className="text-xs text-gray-500 mb-1">
                                  {field.label}
                                </p>
                                <p className="font-medium text-gray-900">
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
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">รูปภาพ</p>
                      <p className="font-medium">{images.length} รูป</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setCurrentStep("details")}
                    disabled={isSubmitting}
                    className="px-8 py-4 text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-all font-semibold disabled:opacity-50"
                  >
                    ← แก้ไข
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-8 py-4 text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all font-semibold text-lg shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "กำลังสร้างประกาศ..."
                      : "✓ ยืนยันและสร้างประกาศ"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {currentStep === "success" && (
            <div className="w-full max-w-2xl">
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="text-green-500 text-7xl mb-6">✓</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  สร้างประกาศสำเร็จ!
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  ประกาศของคุณถูกบันทึกแล้ว คุณสามารถเผยแพร่ได้ทันที
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <button
                    onClick={handlePublish}
                    disabled={isSubmitting}
                    className="w-full px-8 py-4 text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all font-semibold text-lg shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "กำลังเผยแพร่..."
                      : "🚀 เผยแพร่ประกาศตอนนี้"}
                  </button>

                  <button
                    onClick={handleStartNew}
                    disabled={isSubmitting}
                    className="w-full px-8 py-4 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-semibold disabled:opacity-50"
                  >
                    + เพิ่มประกาศใหม่
                  </button>

                  <button
                    onClick={() => router.push("/buy")}
                    disabled={isSubmitting}
                    className="w-full px-8 py-4 text-red-600 border-2 border-red-600 rounded-xl hover:bg-red-50 transition-all font-semibold disabled:opacity-50"
                  >
                    ดูประกาศทั้งหมด
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
