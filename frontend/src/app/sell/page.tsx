"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import DocumentUploader from "@/components/features/ocr/DocumentUploader";
import CarImageUploader from "@/components/features/ocr/CarImageUploader";
import CarDataForm from "@/components/features/sell/CarDataForm";
import QrCodeUploader from "@/components/features/inspection/QrCodeUploader"; // 👈 [1] Import Component ใหม่
import { apiCall } from "@/lib/apiCall";
import { CarFormData } from "@/lib/ocrUtils";

type Step = "ocr" | "form" | "inspection" | "inspectionConfig" | "images" | "success";

export default function SellPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, roles, profiles } = useUserAuth();

  const [currentStep, setCurrentStep] = useState<Step>("ocr");
  const [ocrData, setOcrData] = useState<string>("");
  const [carFormData, setCarFormData] = useState<CarFormData>({ price: 0 });
  const [inspectionData, setInspectionData] = useState<string>("");
  const [inspectionUrl, setInspectionUrl] = useState<string>(""); // 👈 [2] เพิ่ม State สำหรับเก็บ URL จาก QR Code
  const [inspectionConfigData, setInspectionConfigData] = useState<CarFormData>({ price: 0 });
  const [createdCarId, setCreatedCarId] = useState<number | null>(null);
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

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not a complete seller
  if (!isAuthenticated || !roles?.seller || !profiles?.sellerComplete) {
    return null;
  }

  const handleOcrComplete = (extractedText: string) => {
    setOcrData(extractedText);
    setCurrentStep("form");
  };

  const handleSkipOcr = () => {
    setOcrData("");
    setCurrentStep("form");
  };

  const handleCarFormSubmit = (data: CarFormData) => {
    setCarFormData(data);
    setCurrentStep("inspection");
  };

  // 👇 [3] สร้าง Handler ใหม่สำหรับรับ URL จาก QrCodeUploader
  const handleQrScanComplete = (url: string) => {
    console.log("URL ที่ได้จาก QR Code:", url);
    setInspectionUrl(url); // เก็บ URL ที่ได้ไว้ใน State
    setCurrentStep("inspectionConfig"); // ไปยัง Step 4: inspectionConfig
  };

  // 👇 [4] แก้ไข Handler เดิมเล็กน้อย
  const handleSkipInspection = () => {
    setInspectionUrl(""); // Clear URL เมื่อกดข้าม
    setInspectionData("");
    setCurrentStep("inspectionConfig");
  };

  const handleInspectionConfigSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const finalCarData = {
        ...carFormData,
        ...inspectionConfigData,
        status: "draft",
      };

      const result = await apiCall<{
        success: boolean;
        data?: { cid: number };
        message?: string;
      }>("/api/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalCarData),
      });

      if (result.success && result.data) {
        setCreatedCarId(result.data.cid);
        setCurrentStep("images");
      } else {
        setError(result.message || "เกิดข้อผิดพลาดในการสร้างประกาศขาย");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImagesComplete = () => {
    setCurrentStep("success");
  };

  const handleStartNew = () => {
    setCurrentStep("ocr");
    setOcrData("");
    setCarFormData({ price: 0 });
    setInspectionData("");
    setInspectionUrl("");
    setInspectionConfigData({ price: 0 });
    setCreatedCarId(null);
    setError("");
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
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ขายรถยนต์</h1>
          <p className="text-gray-600">เพิ่มประกาศขายรถยนต์ของคุณง่ายๆ ในไม่กี่ขั้นตอน</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-center flex-wrap gap-2">
            {/* Step 1: OCR */}
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                  currentStep === "ocr"
                    ? "bg-red-600 text-white"
                    : currentStep === "form" || currentStep === "inspection" || currentStep === "inspectionConfig" || currentStep === "images" || currentStep === "success"
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {currentStep === "ocr" ? "1" : "✓"}
              </div>
              <span className="ml-1 text-xs font-medium text-gray-700">OCR</span>
            </div>

            <div className="w-8 h-1 bg-gray-300"></div>

            {/* Step 2: Form */}
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                  currentStep === "form"
                    ? "bg-red-600 text-white"
                    : currentStep === "inspection" || currentStep === "inspectionConfig" || currentStep === "images" || currentStep === "success"
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {currentStep === "form" ? "2" : (currentStep === "inspection" || currentStep === "inspectionConfig" || currentStep === "images" || currentStep === "success") ? "✓" : "2"}
              </div>
              <span className="ml-1 text-xs font-medium text-gray-700">ข้อมูลรถ</span>
            </div>

            <div className="w-8 h-1 bg-gray-300"></div>

            {/* Step 3: Inspection */}
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                  currentStep === "inspection"
                    ? "bg-red-600 text-white"
                    : currentStep === "inspectionConfig" || currentStep === "images" || currentStep === "success"
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {currentStep === "inspection" ? "3" : (currentStep === "inspectionConfig" || currentStep === "images" || currentStep === "success") ? "✓" : "3"}
              </div>
              <span className="ml-1 text-xs font-medium text-gray-700">ตรวจสอบ</span>
            </div>

            <div className="w-8 h-1 bg-gray-300"></div>

            {/* Step 4: Inspection Config */}
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                  currentStep === "inspectionConfig"
                    ? "bg-red-600 text-white"
                    : currentStep === "images" || currentStep === "success"
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {currentStep === "inspectionConfig" ? "4" : (currentStep === "images" || currentStep === "success") ? "✓" : "4"}
              </div>
              <span className="ml-1 text-xs font-medium text-gray-700">กำหนดค่า</span>
            </div>

            <div className="w-8 h-1 bg-gray-300"></div>

            {/* Step 5: Images */}
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                  currentStep === "images"
                    ? "bg-red-600 text-white"
                    : currentStep === "success"
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {currentStep === "images" ? "5" : currentStep === "success" ? "✓" : "5"}
              </div>
              <span className="ml-1 text-xs font-medium text-gray-700">รูปภาพ</span>
            </div>

            <div className="w-8 h-1 bg-gray-300"></div>

            {/* Step 6: Success */}
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                  currentStep === "success"
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {currentStep === "success" ? "✓" : "6"}
              </div>
              <span className="ml-1 text-xs font-medium text-gray-700">เสร็จสิ้น</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex justify-center">
          {/* Step 1: OCR */}
          {currentStep === "ocr" && (
            <div className="w-full max-w-4xl space-y-6">
              <DocumentUploader onComplete={handleOcrComplete} />
              <div className="text-center">
                <p className="text-gray-600 mb-4">หรือข้ามขั้นตอนนี้และกรอกข้อมูลเอง</p>
                <button
                  onClick={handleSkipOcr}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ข้ามขั้นตอน OCR
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Car Form */}
          {currentStep === "form" && (
            <CarDataForm
              ocrData={ocrData}
              initialData={carFormData}
              onSubmit={handleCarFormSubmit}
              onBack={() => setCurrentStep("ocr")}
              isSubmitting={isSubmitting}
            />
          )}

          {/* 👇 [5] แก้ไข Step 3: Inspection ให้ใช้ Component ใหม่ */}
          {currentStep === "inspection" && (
            <div className="w-full max-w-4xl space-y-6">
              <QrCodeUploader onScanComplete={handleQrScanComplete} />
              
              <div className="text-center">
                <p className="text-gray-600 mb-4">หรือข้ามขั้นตอนนี้และกำหนดค่าเอง</p>
                <button
                  onClick={handleSkipInspection}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ข้ามขั้นตอนการอัปโหลด
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Inspection Configuration */}
          {currentStep === "inspectionConfig" && (
            <div className="w-full max-w-4xl">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">ตรวจสอบข้อมูลสภาพรถ</h2>
                
                {/* 👇 [6] แสดง URL ที่ได้จาก QR Code ใน Step 4 */}
                {inspectionUrl && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">URL จาก QR Code:</h3>
                    <p className="text-sm text-blue-800 break-all">{inspectionUrl}</p>
                    <p className="text-sm text-blue-600 mt-2">
                      (ในขั้นตอนถัดไป เราจะนำ URL นี้ไปดึงข้อมูลมาแสดงผลในหน้านี้)
                    </p>
                  </div>
                )}

                {!inspectionUrl && (
                    <p className="text-gray-600 text-center mb-4">
                        คุณข้ามขั้นตอนการอัปโหลดใบตรวจสภาพรถ
                    </p>
                )}
                
                {/* ส่วนของ Form สำหรับแก้ไขข้อมูลจะถูกเพิ่มเข้ามาทีหลัง */}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep("form")}
                    className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="submit"
                    // disabled={isSubmitting} // จะเปิดใช้งานทีหลัง
                    onClick={() => setCurrentStep("images")} // ไปยัง step ถัดไปชั่วคราว
                    className="flex-1 px-6 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    ดำเนินการต่อ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Upload Images */}
          {currentStep === "images" && createdCarId && (
            <CarImageUploader carId={createdCarId} onUploadComplete={handleImagesComplete} />
          )}

          {/* Step 6: Success */}
          {currentStep === "success" && (
            <div className="w-full max-w-2xl">
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                    <svg
                      className="w-12 h-12 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">สำเร็จ!</h2>
                  <p className="text-gray-600">
                    ประกาศของคุณถูกสร้างเป็นฉบับร่างแล้ว ขั้นตอนสุดท้ายคือการเผยแพร่
                  </p>
                </div>

                {error && <div className="mb-4 p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>}

                <div className="space-y-4">
                  <button
                    onClick={handlePublish}
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
                  >
                    {isSubmitting ? "กำลังเผยแพร่..." : "เผยแพร่ประกาศขาย"}
                  </button>

                  <button
                    onClick={handleStartNew}
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    เพิ่มประกาศใหม่
                  </button>

                  <button
                    onClick={() => router.push("/buy")}
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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