"use client";

import { useEffect, useState } from "react";
import { Choices } from "@/components/ui/Choices";
import StarRating from "@/components/ui/StarRating";
import { FormSection } from "@/components/ui/FormSection";
import { CheckBoxes } from "@/components/ui/CheckBoxes";
import type { CarFormData } from "@/types/car";
import { DAMAGE_OPTIONS } from "@/constants/car";
import { referenceAPI } from "@/lib/referenceAPI";
import type { ChoiceOption } from "@/components/ui/Choices";

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
  // Fetch reference options
  const [bodyTypeOptions, setBodyTypeOptions] = useState<
    ChoiceOption<string>[]
  >([]);
  const [transmissionOptions, setTransmissionOptions] = useState<
    ChoiceOption<string>[]
  >([]);
  const [drivetrainOptions, setDrivetrainOptions] = useState<
    ChoiceOption<string>[]
  >([]);
  const [fuelTypeOptions, setFuelTypeOptions] = useState<
    ChoiceOption<string>[]
  >([]);
  // Optionally show skeletons while loading later if needed

  useEffect(() => {
    let mounted = true;
    referenceAPI.getAll("en").then((res) => {
      if (!mounted || !res.success) return;
      const toChoice = (
        arr: { code: string; label: string }[]
      ): ChoiceOption<string>[] =>
        arr.map((o) => ({ value: o.label, label: o.label }));
      setBodyTypeOptions(toChoice(res.data.bodyTypes));
      setTransmissionOptions(toChoice(res.data.transmissions));
      setDrivetrainOptions(toChoice(res.data.drivetrains));
      setFuelTypeOptions(toChoice(res.data.fuelTypes));
    });
    return () => {
      mounted = false;
    };
  }, []);
  // Check if required fields are filled
  const canContinue =
    formData.bodyTypeName &&
    formData.transmissionName &&
    formData.drivetrainName &&
    (formData.fuelLabels?.length ?? 0) > 0 &&
    formData.conditionRating &&
    !isSubmitting;

  // Get damage flags as array
  const damageFlags: string[] = [];
  if (formData.isFlooded) damageFlags.push("flooded");
  if (formData.isHeavilyDamaged) damageFlags.push("heavilyDamaged");

  const handleDamageFlagsChange = (values: string[]) => {
    onChange({
      isFlooded: values.includes("flooded"),
      isHeavilyDamaged: values.includes("heavilyDamaged"),
    });
  };

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
          options={bodyTypeOptions}
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
          options={transmissionOptions}
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
          options={drivetrainOptions}
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
          options={fuelTypeOptions}
          onChange={(values) => onChange({ fuelLabels: values })}
          direction="row"
        />
      </FormSection>

      {/* Condition Rating */}
      <FormSection
        title="Overall Condition"
        description="Rate your vehicle's overall condition"
      >
        <StarRating
          value={formData.conditionRating}
          onChange={(val) => onChange({ conditionRating: val })}
          labels={["Poor", "Fair", "Good", "Very Good", "Excellent"]}
        />
      </FormSection>

      {/* Damage History */}
      <FormSection
        title="Vehicle History"
        description="Disclose any damage history (optional but recommended for transparency)"
      >
        <CheckBoxes
          name="damageHistory"
          values={damageFlags}
          options={DAMAGE_OPTIONS}
          onChange={handleDamageFlagsChange}
          direction="column"
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
