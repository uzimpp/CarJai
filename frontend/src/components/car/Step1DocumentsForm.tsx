"use client";

import { useState } from "react";
import { TextField } from "@/components/ui/TextField";
import { FormSection } from "@/components/ui/FormSection";
import { InlineAlert } from "@/components/ui/InlineAlert";
import QrCodeUploader from "@/components/car/QrCodeUploader";
import type { CarFormData } from "@/types/Car";
import Image from "next/image";

interface Step1DocumentsFormProps {
  formData: Partial<CarFormData>;
  onFormDataChange: (data: Partial<CarFormData>) => void;
  onBookUpload: (file: File) => Promise<void>;
  onInspectionUpload: (url: string) => Promise<void>;
  onContinue: () => void;
  isSubmitting: boolean;
  inspectionOpen: boolean;
  onToggleInspection: () => void;
  inspectionPassSummary?: { passed: number; total: number };
}

export default function Step1DocumentsForm({
  formData,
  onFormDataChange,
  onBookUpload,
  onInspectionUpload,
  onContinue,
  isSubmitting,
  inspectionOpen,
  onToggleInspection,
  inspectionPassSummary,
}: Step1DocumentsFormProps) {
  const [isUploadingBook, setIsUploadingBook] = useState(false);
  const [isUploadingInspection, setIsUploadingInspection] = useState(false);
  const [error, setError] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isDraggingBook, setIsDraggingBook] = useState(false);

  const PassFail = ({
    label,
    value,
  }: {
    label: string;
    value: boolean | undefined;
  }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {value === undefined ? (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
          —
        </span>
      ) : value ? (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
          Pass
        </span>
      ) : (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
          Fail
        </span>
      )}
    </div>
  );

  const handleBookFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setIsUploadingBook(true);

    try {
      // Client-side size check only (<10MB); defer quality/size validation to AIGEN
      const maxSizeBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error("File is too large (max 10MB)");
      }

      const isPdf =
        file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      if (isPdf) {
        // Current OCR accepts image only. Ask user to export first page as image.
        throw new Error(
          "PDF detected. Please upload a clear PNG or JPEG image of the registration book."
        );
      }

      // Show preview for images
      const objectUrl = URL.createObjectURL(file);
      setPreviewSrc(objectUrl);

      await onBookUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload book");
    } finally {
      setIsUploadingBook(false);
      const inputEl = document.getElementById(
        "book-upload"
      ) as HTMLInputElement | null;
      if (inputEl) inputEl.value = "";
    }
  };

  const handleBookDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingBook(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setError("");
    setIsUploadingBook(true);

    try {
      const maxSizeBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error("File is too large (max 10MB)");
      }

      const isPdf =
        file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      if (isPdf) {
        throw new Error(
          "PDF detected. Please upload a clear PNG or JPEG image of the registration book."
        );
      }

      const objectUrl = URL.createObjectURL(file);
      setPreviewSrc(objectUrl);
      await onBookUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload book");
    } finally {
      setIsUploadingBook(false);
      const inputEl = document.getElementById(
        "book-upload"
      ) as HTMLInputElement | null;
      if (inputEl) inputEl.value = "";
    }
  };

  const handleBookDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover")
      setIsDraggingBook(true);
    if (e.type === "dragleave") setIsDraggingBook(false);
  };

  const handleQrScanComplete = async (url: string) => {
    setError("");
    setIsUploadingInspection(true);

    try {
      await onInspectionUpload(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload inspection"
      );
    } finally {
      setIsUploadingInspection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Context tips */}
      <InlineAlert type="info">
        Registration book OCR is optional and only helps auto-fill details. You
        can skip it and type fields manually. Uploading the inspection QR image
        lets us fetch your inspection results.
      </InlineAlert>
      {/* Unified Step 1: uploads + fields together */}
      <FormSection
        title="Vehicle Details & Documents"
        description="Upload your inspection report and optionally your registration book; fields below will auto-fill and remain editable"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Book (image)
              </label>
              <div
                className={`p-6 border-2 border-dashed rounded-xl text-center ${
                  isDraggingBook ? "bg-red-50 border-red-400" : "bg-gray-50"
                }`}
                onDragEnter={handleBookDrag}
                onDragOver={handleBookDrag}
                onDragLeave={handleBookDrag}
                onDrop={handleBookDrop}
              >
                <input
                  id="book-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleBookFileChange}
                  disabled={isUploadingBook}
                  className="hidden"
                />
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    Drag and drop here, or
                  </p>
                  <label
                    htmlFor="book-upload"
                    className="inline-block px-4 py-2 bg-maroon text-white rounded-lg font-medium hover:bg-red-800 cursor-pointer"
                  >
                    Select Image
                  </label>
                  <p className="text-xs text-gray-600">
                    Optional. Upload a clear PNG/JPEG photo to auto-fill
                    details.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inspection Report
              </label>
              <QrCodeUploader onScanComplete={handleQrScanComplete} />
              <p className="mt-2 text-xs text-gray-600">
                Upload a photo/screenshot of the QR code from your inspection
                receipt. Well read it and fetch the results automatically.
              </p>
            </div>
          </div>

          {/* Preview */}
          {previewSrc && (
            <div className="border rounded-md overflow-hidden">
              <Image
                src={previewSrc}
                alt="Uploaded preview"
                width={800}
                height={600}
                className="w-full h-auto max-h-96 object-contain bg-gray-100"
              />
            </div>
          )}

          {isUploadingBook && (
            <InlineAlert type="info">
              Processing registration book...
            </InlineAlert>
          )}
          {isUploadingInspection && (
            <InlineAlert type="info">Retrieving inspection data...</InlineAlert>
          )}
          {error && <InlineAlert type="error">{error}</InlineAlert>}

          {/* Always-visible editable fields */}
          <div className="space-y-4 p-4">
            <p className="text-sm font-medium">
              Review and edit the information (auto-filled after OCR if you
              upload)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Brand"
                value={formData.brandName || ""}
                onChange={(e) =>
                  onFormDataChange({ brandName: e.target.value })
                }
                placeholder="e.g., Toyota"
                required
              />
              <TextField
                label="Model Name"
                value={formData.modelName || ""}
                onChange={(e) =>
                  onFormDataChange({ modelName: e.target.value })
                }
                placeholder="e.g., Civic, Corolla, Camry"
                required
              />
              <TextField
                label="Submodel Name"
                value={formData.submodelName || ""}
                onChange={(e) =>
                  onFormDataChange({ submodelName: e.target.value })
                }
                placeholder="e.g., RS, Hybrid, Sport"
                required
              />
              <TextField
                label="Year"
                type="number"
                value={formData.year?.toString() || ""}
                onChange={(e) =>
                  onFormDataChange({
                    year: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="e.g., 2004"
                required
              />
              <TextField
                label="Engine CC"
                type="number"
                value={formData.engineCc?.toString() || ""}
                onChange={(e) =>
                  onFormDataChange({
                    engineCc: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="e.g., 900"
                required
              />
              <TextField
                label="Seats"
                type="number"
                value={formData.seats?.toString() || ""}
                onChange={(e) =>
                  onFormDataChange({
                    seats: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="e.g., 5"
                required
              />
              <TextField
                label="Doors"
                type="number"
                value={formData.doors?.toString() || ""}
                onChange={(e) =>
                  onFormDataChange({
                    doors: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="e.g., 5"
                required
              />

              <TextField
                label="Color"
                value={
                  formData?.colors
                    ? Array.isArray(formData.colors)
                      ? formData.colors.join(", ")
                      : formData.colors
                    : ""
                }
                onChange={() => {}}
                placeholder="e.g., Red, Blue, Green"
                disabled
              />
              <TextField
                label="License Plate"
                value={formData?.licensePlate || ""}
                onChange={() => {}}
                placeholder="e.g., 3กบ2399"
                disabled
              />
              <TextField
                label="Chassis Number"
                value={formData?.chassisNumber || ""}
                onChange={() => {}}
                placeholder="e.g., MGRxxxxxxxxxxx"
                disabled
              />
              <TextField
                label="Mileage (km)"
                type="number"
                value={formData?.mileage?.toString() || ""}
                onChange={(e) =>
                  onFormDataChange({
                    mileage: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="e.g., 50000"
                // helper="This will be the most recent mileage value for your listing"
                disabled
              />
            </div>
            <div className="gap-4">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={onToggleInspection}
                  className="w-full flex items-center justify-between px-4 py-3 border rounded-lg hover:bg-gray-50"
                >
                  <span className="text-sm font-medium text-gray-800">
                    Inspection Results
                  </span>
                  <span className="text-xs text-gray-600">
                    {inspectionPassSummary
                      ? `Pass ${inspectionPassSummary.passed}/${inspectionPassSummary.total}`
                      : ""}
                  </span>
                </button>
                {inspectionOpen && (
                  <div className="space-y-3">
                    <TextField
                      label="Inspection Station"
                      value={formData?.station || ""}
                      onChange={() => {}}
                      disabled
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PassFail label="Overall" value={formData?.overallPass} />
                      <PassFail label="Brake" value={formData?.brakeResult} />
                      <PassFail
                        label="Handbrake"
                        value={formData?.handbrakeResult}
                      />
                      <PassFail
                        label="Alignment"
                        value={formData?.alignmentResult}
                      />
                      <PassFail label="Noise" value={formData?.noiseResult} />
                      <PassFail
                        label="Emission"
                        value={formData?.emissionResult}
                      />
                      <PassFail label="Horn" value={formData?.hornResult} />
                      <PassFail
                        label="Speedometer"
                        value={formData?.speedometerResult}
                      />
                      <PassFail
                        label="High Low Beam"
                        value={formData?.highLowBeamResult}
                      />
                      <PassFail
                        label="Signal Lights"
                        value={formData?.signalLightsResult}
                      />
                      <PassFail
                        label="Other Lights"
                        value={formData?.otherLightsResult}
                      />
                      <PassFail
                        label="Windshield"
                        value={formData?.windshieldResult}
                      />
                      <PassFail
                        label="Steering"
                        value={formData?.steeringResult}
                      />
                      <PassFail
                        label="Wheels and Tires"
                        value={formData?.wheelsTiresResult}
                      />
                      <PassFail
                        label="Fuel Tank"
                        value={formData?.fuelTankResult}
                      />
                      <PassFail
                        label="Chassis"
                        value={formData?.chassisResult}
                      />
                      <PassFail
                        label="Body and Frame"
                        value={formData?.bodyResult}
                      />
                      <PassFail
                        label="Doors and Floor"
                        value={formData?.doorsFloorResult}
                      />
                      <PassFail
                        label="Seatbelt"
                        value={formData?.seatbeltResult}
                      />
                      <PassFail label="Wiper" value={formData?.wiperResult} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Continue Button */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={onContinue}
          disabled={isSubmitting}
          className="px-8 py-3 bg-maroon text-white rounded-lg font-semibold hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Vehicle Details
        </button>
      </div>
    </div>
  );
}
