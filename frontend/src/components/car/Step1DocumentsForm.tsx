"use client";

import { Fragment, useState } from "react";
import { TextField } from "@/components/ui/TextField";
import { FormSection } from "@/components/ui/FormSection";
import { InlineAlert } from "@/components/ui/InlineAlert";
import QrCodeUploader from "@/components/car/QrCodeUploader";
import type { CarFormData } from "@/types/Car";

interface Step1DocumentsFormProps {
  onBookUpload: (file: File) => Promise<void>;
  onInspectionUpload: (url: string) => Promise<void>;
  bookData: Partial<CarFormData> | null;
  inspectionData: Record<string, string> | null;
  chassisMatch: boolean | null;
  normalizedChassis: { book: string; inspection: string } | null;
  onBookDataChange: (data: Partial<CarFormData>) => void;
  onContinue: () => void;
  isSubmitting: boolean;
}

export default function Step1DocumentsForm({
  onBookUpload,
  onInspectionUpload,
  bookData,
  inspectionData,
  chassisMatch,
  normalizedChassis,
  onBookDataChange,
  onContinue,
  isSubmitting,
}: Step1DocumentsFormProps) {
  const [isUploadingBook, setIsUploadingBook] = useState(false);
  const [isUploadingInspection, setIsUploadingInspection] = useState(false);
  const [error, setError] = useState("");

  // Use backend validation result
  const canContinue =
    bookData !== null &&
    inspectionData !== null &&
    chassisMatch === true &&
    !isSubmitting;

  const handleBookFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setIsUploadingBook(true);

    try {
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
      {/* Book Upload Section */}
      <FormSection
        title="Vehicle Registration Book"
        description="Upload a clear photo or scan of your vehicle registration book"
      >
        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleBookFileChange}
              disabled={isUploadingBook}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none disabled:opacity-50"
            />
          </div>

          {isUploadingBook && (
            <InlineAlert type="info">Processing document...</InlineAlert>
          )}

          {bookData && (
            <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm font-medium">
                ✓ Book uploaded successfully - Review and edit the extracted
                information
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Chassis Number *"
                  value={bookData.chassisNumber || ""}
                  onChange={(e) =>
                    onBookDataChange({ chassisNumber: e.target.value })
                  }
                  placeholder="e.g., ABC123XYZ456"
                  required
                />
                <TextField
                  label="Brand"
                  value={bookData.brandName || ""}
                  onChange={(e) =>
                    onBookDataChange({ brandName: e.target.value })
                  }
                  placeholder="e.g., Toyota"
                />
                <TextField
                  label="Year"
                  type="number"
                  value={bookData.year?.toString() || ""}
                  onChange={(e) =>
                    onBookDataChange({
                      year: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="e.g., 2020"
                />
                <TextField
                  label="Color"
                  value={bookData.color || ""}
                  onChange={(e) => onBookDataChange({ color: e.target.value })}
                  placeholder="e.g., White"
                />
              </div>

              {/* License Plate Information */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  License Plate Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TextField
                    label="Plate Prefix"
                    value={bookData.prefix || ""}
                    onChange={(e) =>
                      onBookDataChange({ prefix: e.target.value })
                    }
                    placeholder="e.g., กข, ขก"
                  />
                  <TextField
                    label="Plate Number"
                    value={bookData.number || ""}
                    onChange={(e) =>
                      onBookDataChange({ number: e.target.value })
                    }
                    placeholder="e.g., 1234, 5678"
                  />
                  <TextField
                    label="Province (Thai)"
                    value={bookData.provinceNameTh || ""}
                    onChange={(e) =>
                      onBookDataChange({ provinceNameTh: e.target.value })
                    }
                    placeholder="e.g., กรุงเทพมหานคร"
                  />
                </div>
              </div>

              {/* Additional Vehicle Info */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Additional Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Engine CC"
                    type="number"
                    value={bookData.engineCc?.toString() || ""}
                    onChange={(e) =>
                      onBookDataChange({
                        engineCc: parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="e.g., 2500"
                  />
                  <TextField
                    label="Seats"
                    type="number"
                    value={bookData.seats?.toString() || ""}
                    onChange={(e) =>
                      onBookDataChange({
                        seats: parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="e.g., 5"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </FormSection>

      {/* Inspection Upload Section */}
      <FormSection
        title="Vehicle Inspection Report"
        description="Upload an image of your vehicle inspection report with QR code"
      >
        <div className="space-y-4">
          {/* Gating message */}
          {!bookData && (
            <InlineAlert type="warning">
              Please upload the vehicle registration book first before uploading
              the inspection report.
            </InlineAlert>
          )}

          {!inspectionData && bookData ? (
            <QrCodeUploader onScanComplete={handleQrScanComplete} />
          ) : null}

          {isUploadingInspection && (
            <InlineAlert type="info">Retrieving inspection data...</InlineAlert>
          )}

          {inspectionData && (
            <Fragment>
              <p className="text-green-800 text-sm font-medium">
                ✓ Inspection data retrieved - Information is read-only
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Chassis Number (from inspection)"
                  value={inspectionData["เลขตัวถังรถ"] || ""}
                  disabled
                  placeholder="Chassis number"
                />
                <TextField
                  label="VIN/Engine Number"
                  value={inspectionData["หมายเลขเครื่องยนต์"] || ""}
                  disabled
                  placeholder="Engine number"
                />
                <TextField
                  label="Mileage (km)"
                  value={inspectionData["ระยะทางวิ่ง"] || ""}
                  disabled
                  placeholder="Current mileage"
                />
                <TextField
                  label="Overall Result"
                  value={inspectionData["ผลการตรวจ"] || ""}
                  disabled
                  placeholder="Pass/Fail"
                />
              </div>

              <p className="text-sm text-gray-600 mt-2">
                Inspection data cannot be edited. To update, scan a new
                inspection report.
              </p>
            </Fragment>
          )}
        </div>
      </FormSection>

      {/* Chassis Number Validation (from backend) */}
      {bookData && inspectionData && chassisMatch !== null && (
        <div className="mt-4">
          {chassisMatch ? (
            <InlineAlert type="success">
              ✓ Chassis numbers match! You can continue to the next step.
            </InlineAlert>
          ) : (
            <InlineAlert type="error">
              ⚠ Chassis numbers do not match. Please verify the information in
              both documents.
              <br />
              <span className="text-sm mt-2 block">
                Book:{" "}
                {normalizedChassis?.book ||
                  bookData.chassisNumber ||
                  "(not found)"}
                <br />
                Inspection:{" "}
                {normalizedChassis?.inspection ||
                  inspectionData["เลขตัวถังรถ"] ||
                  "(not found)"}
              </span>
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
