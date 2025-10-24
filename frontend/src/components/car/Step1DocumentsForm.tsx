"use client";

import { Fragment, useState } from "react";
import { TextField } from "@/components/ui/TextField";
import { FormSection } from "@/components/ui/FormSection";
import { InlineAlert } from "@/components/ui/InlineAlert";
import QrCodeUploader from "@/components/car/QrCodeUploader";
import type { CarFormData, InspectionData } from "@/types/Car";
import Image from "next/image";

interface Step1DocumentsFormProps {
  onBookUpload: (file: File) => Promise<void>;
  onInspectionUpload: (url: string) => Promise<void>;
  bookData: Partial<CarFormData> | null;
  inspectionData: InspectionData | null;
  onBookDataChange: (data: Partial<CarFormData>) => void;
  onContinue: () => void;
  isSubmitting: boolean;
}

export default function Step1DocumentsForm({
  onBookUpload,
  onInspectionUpload,
  bookData,
  inspectionData,
  onBookDataChange,
  onContinue,
  isSubmitting,
}: Step1DocumentsFormProps) {
  const [isUploadingBook, setIsUploadingBook] = useState(false);
  const [isUploadingInspection, setIsUploadingInspection] = useState(false);
  const [error, setError] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Check if chassis numbers match
  const chassisNumbersMatch =
    bookData?.chassisNumber &&
    inspectionData?.chassisNumber &&
    bookData.chassisNumber === inspectionData.chassisNumber;

  const canContinue =
    bookData !== null &&
    inspectionData !== null &&
    chassisNumbersMatch &&
    !isSubmitting;

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
    }
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
      {/* Unified Step 1: uploads + fields together */}
      <FormSection
        title="Vehicle Details & Documents"
        description="Upload your registration book and inspection report; fields below will auto-fill and remain editable"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Book (image)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleBookFileChange}
                disabled={isUploadingBook}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inspection Report (QR image)
              </label>
              <QrCodeUploader onScanComplete={handleQrScanComplete} />
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

          {/* Always-visible editable fields */}
          <div className="space-y-4 p-4">
            <p className="text-sm font-medium">
              Review and edit the information (auto-filled after OCR if you
              upload)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Brand"
                value={bookData?.brandName || ""}
                onChange={(e) =>
                  onBookDataChange({ brandName: e.target.value })
                }
                placeholder="e.g., Toyota"
              />
              <TextField
                label="Model Name"
                value={bookData?.modelName || ""}
                onChange={(e) =>
                  onBookDataChange({ modelName: e.target.value })
                }
                placeholder="e.g., Civic, Corolla, Camry"
                required
              />
              <TextField
                label="Submodel Name"
                value={bookData?.submodelName || ""}
                onChange={(e) =>
                  onBookDataChange({ submodelName: e.target.value })
                }
                placeholder="e.g., RS, Hybrid, Sport"
              />
              <TextField
                label="Year"
                type="number"
                value={bookData?.year?.toString() || ""}
                onChange={(e) =>
                  onBookDataChange({
                    year: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="e.g., 2004"
              />
              <TextField
                label="Chassis Number"
                value={bookData?.chassisNumber || ""}
                onChange={(e) =>
                  onBookDataChange({ chassisNumber: e.target.value })
                }
                placeholder="e.g., MGRxxxxxxxxxxx"
              />
              <TextField
                label="Engine CC"
                type="number"
                value={bookData?.engineCc?.toString() || ""}
                onChange={(e) =>
                  onBookDataChange({
                    engineCc: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="e.g., 900"
              />
              <TextField
                label="Seats"
                type="number"
                value={bookData?.seats?.toString() || ""}
                onChange={(e) =>
                  onBookDataChange({
                    seats: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="e.g., 5"
              />
              <TextField
                label="Doors"
                type="number"
                value={bookData?.doors?.toString() || ""}
                onChange={(e) =>
                  onBookDataChange({
                    doors: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="e.g., 5"
              />
              <TextField
                label="Mileage (km) *"
                type="number"
                value={inspectionData?.mileage?.toString() || ""}
                onChange={(e) =>
                  onBookDataChange({
                    mileage: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="e.g., 50000"
                helper="This will be the most recent mileage value for your listing"
                required
              />
              <TextField
                label="Inspection Station"
                value={inspectionData?.station || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Overall Result"
                value={inspectionData?.overallPass || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Brake Result"
                value={inspectionData?.brakeResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Handbrake Result"
                value={inspectionData?.handbrakeResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Alignment Result"
                value={inspectionData?.alignmentResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Noise Result"
                value={inspectionData?.noiseResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Emission Result"
                value={inspectionData?.emissionResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Horn Result"
                value={inspectionData?.hornResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="High Low Beam Result"
                value={inspectionData?.highLowBeamResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Signal Lights Result"
                value={inspectionData?.signalLightsResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Other Lights Result"
                value={inspectionData?.otherLightsResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Windshield Result"
                value={inspectionData?.windshieldResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Steering Result"
                value={inspectionData?.steeringResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Wheels and Tires Result"
                value={inspectionData?.wheelsTiresResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Fuel Tank Result"
                value={inspectionData?.fuelTankResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Chassis Result"
                value={inspectionData?.chassisResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Body Result"
                value={inspectionData?.bodyResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Doors and Floor Result"
                value={inspectionData?.doorsFloorResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Seatbelt Result"
                value={inspectionData?.seatbeltResult || ""}
                onChange={() => {}}
                disabled
              />
              <TextField
                label="Wiper Result"
                value={inspectionData?.wiperResult || ""}
                onChange={() => {}}
                disabled
              />
            </div>
          </div>
        </div>
      </FormSection>

      {/* Chassis Number Validation */}
      {bookData && inspectionData && (
        <div className="mt-4">
          {chassisNumbersMatch ? (
            <InlineAlert type="success">
              ✓ Chassis numbers match! You can continue to the next step.
            </InlineAlert>
          ) : (
            <InlineAlert type="error">
              ⚠ Chassis numbers do not match. Please verify the information in
              both documents.
              <br />
              Book: {bookData?.chassisNumber || "(not found)"}
              <br />
              Inspection: {inspectionData["เลขตัวถังรถ"] || "(not found)"}
            </InlineAlert>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && <InlineAlert type="error">{error}</InlineAlert>}

      {/* Continue Button */}
      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="px-8 py-3 bg-maroon text-white rounded-lg font-semibold hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Vehicle Details
        </button>
      </div>
    </div>
  );
}
