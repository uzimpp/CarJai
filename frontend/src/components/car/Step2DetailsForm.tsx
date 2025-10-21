"use client";

import { TextField } from "@/components/ui/TextField";
import { Choices } from "@/components/ui/Choices";
import { FormSection } from "@/components/ui/FormSection";
import { CheckBoxes } from "@/components/ui/CheckBoxes";
import type { CarFormData } from "@/types/Car";
import {
  BODY_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
  DRIVETRAIN_OPTIONS,
  FUEL_TYPE_OPTIONS,
} from "@/constants/car";

interface Step2DetailsFormProps {
  formData: Partial<CarFormData>;
  onChange: (updates: Partial<CarFormData>) => void;
  onContinue: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function Step2DetailsForm({
  formData,
  onChange,
  onContinue,
  onBack,
  isSubmitting,
}: Step2DetailsFormProps) {
  // Check if required fields are filled
  const canContinue =
    formData.bodyTypeName &&
    formData.transmissionName &&
    formData.drivetrainName &&
    (formData.fuelLabels?.length ?? 0) > 0 &&
    formData.modelName &&
    formData.mileage !== undefined &&
    !isSubmitting;

  return (
    <div className="space-y-6">
      {/* Body Type Selection */}
      <FormSection
        title="Body Type"
        description="Select the body type of your vehicle"
      >
        <Choices
          name="bodyType"
          value={formData.bodyTypeName || null}
          options={BODY_TYPE_OPTIONS}
          onChange={(value) => onChange({ bodyTypeName: value })}
          direction="row"
          required
        />
      </FormSection>

      {/* Transmission Selection */}
      <FormSection
        title="Transmission"
        description="Select the transmission type"
      >
        <Choices
          name="transmission"
          value={formData.transmissionName || null}
          options={TRANSMISSION_OPTIONS}
          onChange={(value) => onChange({ transmissionName: value })}
          direction="row"
          required
        />
      </FormSection>

      {/* Drivetrain Selection */}
      <FormSection
        title="Drivetrain"
        description="Select the drivetrain configuration"
      >
        <Choices
          name="drivetrain"
          value={formData.drivetrainName || null}
          options={DRIVETRAIN_OPTIONS}
          onChange={(value) => onChange({ drivetrainName: value })}
          direction="row"
          required
        />
      </FormSection>

      {/* Fuel Type Selection */}
      <FormSection
        title="Fuel Type"
        description="Select one or more fuel types (e.g., hybrid vehicles may have multiple)"
      >
        <CheckBoxes
          name="fuelType"
          values={formData.fuelLabels || []}
          options={FUEL_TYPE_OPTIONS}
          onChange={(values) => onChange({ fuelLabels: values })}
          direction="row"
        />
      </FormSection>

      {/* Model Information */}
      <FormSection
        title="Model Information"
        description="Enter the model and submodel names"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Model Name *"
            value={formData.modelName || ""}
            onChange={(e) => onChange({ modelName: e.target.value })}
            placeholder="e.g., Civic, Corolla, Camry"
            required
          />
          <TextField
            label="Submodel Name"
            value={formData.submodelName || ""}
            onChange={(e) => onChange({ submodelName: e.target.value })}
            placeholder="e.g., RS, Hybrid, Sport"
          />
        </div>
      </FormSection>

      {/* Mileage */}
      <FormSection
        title="Current Mileage"
        description="Enter the most recent mileage reading"
      >
        <TextField
          label="Mileage (km) *"
          type="number"
          value={formData.mileage?.toString() || ""}
          onChange={(e) =>
            onChange({ mileage: parseInt(e.target.value) || undefined })
          }
          placeholder="e.g., 50000"
          helper="This will be the most recent mileage value for your listing"
          required
        />
      </FormSection>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="px-8 py-3 bg-maroon text-white rounded-lg font-semibold hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Pricing & Images
        </button>
      </div>
    </div>
  );
}
