"use client";

import { useState } from "react";
import { TextField } from "@/components/ui/TextField";
import { FormSection } from "@/components/ui/FormSection";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { useToast } from "@/components/ui/Toast";
import QrCodeUploader from "@/components/car/QrCodeUploader";
import RegistrationBookUploader from "@/components/car/RegistrationBookUploader";
import type { CarFormData } from "@/types/car";
import ComboboxInput from "@/components/ui/ComboboxInput";

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

  // Add new props for dropdowns
  brandOptions: string[];
  modelOptions: string[];
  subModelOptions: string[];
  isBrandLoading: boolean;
  isModelLoading: boolean;
  isSubModelLoading: boolean;
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
  // Destructure new props
  brandOptions,
  modelOptions,
  subModelOptions,
  isBrandLoading,
  isModelLoading,
  isSubModelLoading,
}: Step1DocumentsFormProps) {
  const { showToast, ToastContainer } = useToast();
  const [isUploadingInspection, setIsUploadingInspection] = useState(false);
  const [error, setError] = useState("");

  const PassFail = ({
    label,
    value,
  }: {
    label: string;
    value: boolean | undefined;
  }) => (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
      <span className="text-sm font-medium text-gray-900">{label}</span>
      {value === undefined ? (
        <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
          —
        </span>
      ) : value ? (
        <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
          Pass
        </span>
      ) : (
        <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
          Fail
        </span>
      )}
    </div>
  );

  const handleQrScanComplete = async (url: string) => {
    setError("");
    setIsUploadingInspection(true);

    try {
      await onInspectionUpload(url);
      showToast("Inspection report uploaded successfully", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload inspection";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsUploadingInspection(false);
    }
  };

  return (
    <div className="space-y-8">
      {ToastContainer}
      {/* Document Uploads Section */}
      <FormSection
        title="Upload Documents"
        description="Upload inspection report and registration book (optional)"
        required
      >
        <div className="flex flex-col gap-6">
          <div>
            <label className="text-0 font-medium text-gray-700 mb-3">
              Registration Book
            </label>
            <RegistrationBookUploader onUpload={onBookUpload} />
          </div>
          <div>
            <label className="text-0 font-medium text-gray-700 mb-3">
              Inspection Report
            </label>
            <QrCodeUploader onScanComplete={handleQrScanComplete} />
          </div>
        </div>

        {isUploadingInspection && (
          <div className="mt-6">
            <InlineAlert type="info">Retrieving inspection data...</InlineAlert>
          </div>
        )}
        {error && (
          <div className="mt-6">
            <InlineAlert type="error">{error}</InlineAlert>
          </div>
        )}
      </FormSection>

      {/* Vehicle Information Section */}
      <FormSection
        title="Vehicle Information"
        description="Auto-filled from documents. All fields are editable."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* --- Start: Replaced TextFields with ComboboxInput --- */}
          <ComboboxInput
            label="Brand"
            value={formData.brandName || ""}
            onChange={(value) => onFormDataChange({ brandName: value })}
            options={brandOptions}
            loading={isBrandLoading}
            placeholder="Select or type Brand"
            required
          />
          <ComboboxInput
            label="Model Name"
            value={formData.modelName || ""}
            onChange={(value) => onFormDataChange({ modelName: value })}
            options={modelOptions}
            loading={isModelLoading}
            disabled={!formData.brandName || isBrandLoading}
            placeholder="Select or type Model"
            required
          />
          <ComboboxInput
            label="Submodel Name"
            value={formData.submodelName || ""}
            onChange={(value) => onFormDataChange({ submodelName: value })}
            options={subModelOptions}
            loading={isSubModelLoading}
            disabled={
              !formData.brandName || !formData.modelName || isModelLoading
            }
            placeholder="Select or type Submodel"
          />
          {/* --- End: Replaced TextFields --- */}

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
            disabled
          />
        </div>
      </FormSection>

      {/* Inspection Results Section */}
      <FormSection
        title="Inspection Results"
        description={
          inspectionPassSummary
            ? `Pass ${inspectionPassSummary.passed}/${inspectionPassSummary.total} checks`
            : "Upload inspection QR code to view results"
        }
      >
        <div className="space-y-6">
          <button
            type="button"
            onClick={onToggleInspection}
            className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-900">
              {inspectionOpen ? "Hide" : "Show"} Details
            </span>
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${
                inspectionOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {inspectionOpen && (
            <div className="space-y-6 pt-4 border-t border-gray-200">
              <TextField
                label="Inspection Station"
                value={formData?.station || ""}
                onChange={() => {}}
                disabled
              />
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  Inspection Checks
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <PassFail label="Emission" value={formData?.emissionResult} />
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
                  <PassFail label="Steering" value={formData?.steeringResult} />
                  <PassFail
                    label="Wheels and Tires"
                    value={formData?.wheelsTiresResult}
                  />
                  <PassFail
                    label="Fuel Tank"
                    value={formData?.fuelTankResult}
                  />
                  <PassFail label="Chassis" value={formData?.chassisResult} />
                  <PassFail
                    label="Body and Frame"
                    value={formData?.bodyResult}
                  />
                  <PassFail
                    label="Doors and Floor"
                    value={formData?.doorsFloorResult}
                  />
                  <PassFail label="Seatbelt" value={formData?.seatbeltResult} />
                  <PassFail label="Wiper" value={formData?.wiperResult} />
                </div>
              </div>
            </div>
          )}
        </div>
      </FormSection>

      {/* Continue Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={onContinue}
          disabled={isSubmitting}
          className="px-8 py-3 bg-maroon text-white rounded-lg font-semibold hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
        >
          Continue to Specs
        </button>
      </div>
    </div>
  );
}
