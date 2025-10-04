"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import DocumentUploader from "@/components/features/ocr/DocumentUploader";
import CarImageUploader from "@/components/features/ocr/CarImageUploader";
import { apiCall } from "@/lib/apiCall";

interface CarFormData {
  price: number;
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
}

type Step = "ocr" | "form" | "images" | "success";

export default function SellPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, roles, profiles } = useUserAuth();
  
  const [currentStep, setCurrentStep] = useState<Step>("ocr");
  const [ocrData, setOcrData] = useState<string>("");
  const [carFormData, setCarFormData] = useState<CarFormData>({
    price: 0,
  });
  const [createdCarId, setCreatedCarId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Redirect logic for seller guard
  useEffect(() => {
    if (!isLoading) {
      // Not authenticated → redirect to signin
      if (!isAuthenticated) {
        router.push("/signin?redirect=/sell");
        return;
      }

      // Authenticated but no seller role → redirect to role selection or seller signup
      if (roles && !roles.seller) {
        router.push("/signup/role/seller");
        return;
      }

      // Has seller role but incomplete profile → redirect to seller signup
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
    setCurrentStep("form");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const result = await apiCall<{
        success: boolean;
        data?: {
          cid: number;
          sellerId: number;
          price: number;
          status: string;
        };
        message?: string;
      }>("/api/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...carFormData,
          status: "draft",
        }),
      });

      if (result.success && result.data) {
        setCreatedCarId(result.data.cid);
        setCurrentStep("images");
      } else {
        setError(result.message || "เกิดข้อผิดพลาดในการสร้างประกาศขาย");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("เกิดข้อผิดพลาดในการสร้างประกาศขาย");
      }
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
    setCreatedCarId(null);
    setError("");
  };

  const handlePublish = async () => {
    if (!createdCarId) return;

    setIsSubmitting(true);
    setError("");

    try {
      const result = await apiCall<{
        success: boolean;
        message?: string;
      }>(`/api/cars/${createdCarId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "active",
        }),
      });

      if (result.success) {
        alert("เผยแพร่ประกาศขายสำเร็จ!");
        router.push("/buy");
      } else {
        setError(result.message || "เกิดข้อผิดพลาดในการเผยแพร่");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("เกิดข้อผิดพลาดในการเผยแพร่");
      }
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
          <div className="flex items-center justify-center">
            {/* Step 1: OCR */}
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep === "ocr"
                    ? "bg-red-600 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {currentStep === "ocr" ? "1" : "✓"}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">OCR</span>
            </div>

            <div className="w-16 h-1 mx-2 bg-gray-300"></div>

            {/* Step 2: Form */}
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep === "form"
                    ? "bg-red-600 text-white"
                    : currentStep === "images" || currentStep === "success"
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {currentStep === "images" || currentStep === "success" ? "✓" : "2"}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">ข้อมูลรถ</span>
            </div>

            <div className="w-16 h-1 mx-2 bg-gray-300"></div>

            {/* Step 3: Images */}
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep === "images"
                    ? "bg-red-600 text-white"
                    : currentStep === "success"
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {currentStep === "success" ? "✓" : "3"}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">รูปภาพ</span>
            </div>

            <div className="w-16 h-1 mx-2 bg-gray-300"></div>

            {/* Step 4: Success */}
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep === "success"
                    ? "bg-red-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                4
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">เสร็จสิ้น</span>
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
            <div className="w-full max-w-4xl">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">กรอกข้อมูลรถยนต์</h2>

                {ocrData && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">ข้อมูลจาก OCR:</h3>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{ocrData}</p>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {/* Price (Required) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ราคา (บาท) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={carFormData.price || ""}
                      onChange={(e) =>
                        setCarFormData({ ...carFormData, price: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="เช่น 500000"
                    />
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ปี</label>
                    <input
                      type="number"
                      value={carFormData.year || ""}
                      onChange={(e) =>
                        setCarFormData({ ...carFormData, year: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="เช่น 2020"
                    />
                  </div>

                  {/* Mileage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เลขไมล์ (กม.)
                    </label>
                    <input
                      type="number"
                      value={carFormData.mileage || ""}
                      onChange={(e) =>
                        setCarFormData({ ...carFormData, mileage: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="เช่น 50000"
                    />
                  </div>

                  {/* Province */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">จังหวัด</label>
                    <input
                      type="text"
                      value={carFormData.province || ""}
                      onChange={(e) =>
                        setCarFormData({ ...carFormData, province: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="เช่น กรุงเทพมหานคร"
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">สี</label>
                    <input
                      type="text"
                      value={carFormData.color || ""}
                      onChange={(e) => setCarFormData({ ...carFormData, color: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="เช่น ขาว"
                    />
                  </div>

                  {/* Condition Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สภาพรถ (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={carFormData.conditionRating || ""}
                      onChange={(e) =>
                        setCarFormData({
                          ...carFormData,
                          conditionRating: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="1 = แย่ที่สุด, 5 = ดีที่สุด"
                    />
                  </div>

                  {/* Seats */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      จำนวนที่นั่ง
                    </label>
                    <input
                      type="number"
                      value={carFormData.seats || ""}
                      onChange={(e) =>
                        setCarFormData({ ...carFormData, seats: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="เช่น 5"
                    />
                  </div>

                  {/* Doors */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      จำนวนประตู
                    </label>
                    <input
                      type="number"
                      value={carFormData.doors || ""}
                      onChange={(e) =>
                        setCarFormData({ ...carFormData, doors: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="เช่น 4"
                    />
                  </div>

                  {error && (
                    <div className="p-4 text-red-600 bg-red-50 rounded-lg">{error}</div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep("ocr")}
                      className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !carFormData.price}
                      className="flex-1 px-6 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? "กำลังสร้าง..." : "ดำเนินการต่อ"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Step 3: Upload Images */}
          {currentStep === "images" && createdCarId && (
            <CarImageUploader carId={createdCarId} onUploadComplete={handleImagesComplete} />
          )}

          {/* Step 4: Success */}
          {currentStep === "success" && (
            <div className="w-full max-w-2xl">
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                    <svg
                      className="w-12 h-12 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
                    อัปโหลดรูปภาพเรียบร้อยแล้ว ตอนนี้คุณสามารถเผยแพร่ประกาศขายได้
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
