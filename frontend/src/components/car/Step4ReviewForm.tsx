"use client";

import { useEffect, useState } from "react";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { TextField } from "@/components/ui/TextField";
import { Choices } from "@/components/ui/Choices";
import { CheckBoxes } from "@/components/ui/CheckBoxes";
import ComboboxInput from "@/components/ui/ComboboxInput";
import type { CarFormData } from "@/types/car";
import {
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from "@/constants/car";
import { referenceAPI } from "@/lib/referenceAPI";
import { DAMAGE_OPTIONS } from "@/constants/car";
import { FormSection } from "@/components/ui/FormSection";
import {
  BodyTypeIcons,
  FuelTypeIcons,
  TransmissionIcons,
  DrivetrainIcons,
} from "@/components/search/filterIcons";
import type { ChoiceOption } from "@/components/ui/Choices";
import CarImageUploader from "@/components/car/CarImageUploader";

interface Step4ReviewFormProps {
  carId: number;
  formData: Partial<CarFormData>;
  onChange: (updates: Partial<CarFormData>) => void;
  onPublish: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  reviewResult: { ready: boolean; issues: string[] } | null;
  brandOptions: string[];
  modelOptions: string[];
  subModelOptions: string[];
  isBrandLoading: boolean;
  isModelLoading: boolean;
  isSubModelLoading: boolean;
}

export default function Step4ReviewForm({
  carId,
  formData,
  onChange,
  onPublish,
  onBack,
  isSubmitting,
  reviewResult,
  brandOptions,
  modelOptions,
  subModelOptions,
  isBrandLoading,
  isModelLoading,
  isSubModelLoading,
}: Step4ReviewFormProps) {
  // Reference options for review-time editing
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

  // Load reference options with icons
  useEffect(() => {
    let mounted = true;
    referenceAPI.getAll("en").then((res) => {
      if (!mounted || !res.success) return;

      const toBodyTypeChoice = (
        arr: { code: string; label: string }[]
      ): ChoiceOption<string>[] =>
        arr.map((o) => ({
          value: o.label,
          label: o.label,
          icon: BodyTypeIcons[o.code],
        }));

      const toTransmissionChoice = (
        arr: { code: string; label: string }[]
      ): ChoiceOption<string>[] =>
        arr.map((o) => ({
          value: o.label,
          label: o.label,
          icon: TransmissionIcons[o.code],
        }));

      const toDrivetrainChoice = (
        arr: { code: string; label: string }[]
      ): ChoiceOption<string>[] =>
        arr.map((o) => ({
          value: o.label,
          label: o.label,
          icon: DrivetrainIcons[o.code],
        }));

      const toFuelTypeChoice = (
        arr: { code: string; label: string }[]
      ): ChoiceOption<string>[] =>
        arr.map((o) => ({
          value: o.label,
          label: o.label,
          icon: FuelTypeIcons[o.code],
        }));

      setBodyTypeOptions(toBodyTypeChoice(res.data.bodyTypes));
      setTransmissionOptions(toTransmissionChoice(res.data.transmissions));
      setDrivetrainOptions(toDrivetrainChoice(res.data.drivetrains));
      setFuelTypeOptions(toFuelTypeChoice(res.data.fuelTypes));
    });
    return () => {
      mounted = false;
    };
  }, []);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["documents", "details", "pricing"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const description = formData.description || "";
  const descriptionLength = description.length;
  const descriptionValid =
    descriptionLength >= MIN_DESCRIPTION_LENGTH &&
    descriptionLength <= MAX_DESCRIPTION_LENGTH;

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
      {/* Review Status */}
      {reviewResult && (
        <div>
          {reviewResult.ready ? (
            <InlineAlert type="success">
              Ready to publish! Review below and click Publish.
            </InlineAlert>
          ) : (
            <InlineAlert type="warning">
              <>
                <p className="mb-2">Not ready. Please address:</p>
                <ul className="list-disc list-inside space-y-1">
                  {reviewResult.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </>
            </InlineAlert>
          )}
        </div>
      )}

      {/* Summary View (Always Visible) */}
      <div className="bg-gradient-to-r from-maroon to-red-800 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Listing Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm opacity-90">Vehicle</p>
            <p className="text-lg font-semibold">
              {formData.modelName || "—"}{" "}
              {formData.submodelName && `(${formData.submodelName})`}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-90">Year</p>
            <p className="text-lg font-semibold">{formData.year || "—"}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Price</p>
            <p className="text-lg font-semibold">
              {formData.price ? `฿${formData.price.toLocaleString()}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-90">Mileage</p>
            <p className="text-lg font-semibold">
              {formData.mileage
                ? `${formData.mileage.toLocaleString()} km`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-90">Transmission</p>
            <p className="text-lg font-semibold">
              {formData.transmissionName || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-90">Fuel Type</p>
            <p className="text-lg font-semibold">
              {formData.fuelLabels?.join(", ") || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Images Section */}
      <FormSection
        title="Vehicle Images"
        description="Drag to reorder (first image is the main photo)"
      >
        <CarImageUploader key={carId} carId={carId} />
      </FormSection>

      {/* Editable Sections */}
      <div className="space-y-6">
        {/* Document Information */}
        {expandedSections.has("documents") && (
          <FormSection
            title="Documents"
            description="Inspection and registration information"
          >
            {(formData.chassisNumber ||
              formData.licensePlate ||
              formData.station) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="License Plate"
                  value={formData.licensePlate || ""}
                  onChange={() => {}}
                  disabled
                />
                <TextField
                  label="Chassis Number"
                  value={formData.chassisNumber || ""}
                  onChange={() => {}}
                  disabled
                />
                <TextField
                  label="Inspection Station"
                  value={formData.station || ""}
                  onChange={() => {}}
                  disabled
                />
              </div>
            )}
          </FormSection>
        )}

        {/* Vehicle Details */}
        {expandedSections.has("details") && (
          <FormSection title="Vehicle Details">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ComboboxInput
                  label="Brand"
                  value={formData.brandName || ""}
                  onChange={(value) => {
                    onChange({
                      brandName: value,
                      modelName: "",
                      submodelName: "",
                    });
                  }}
                  options={brandOptions}
                  loading={isBrandLoading}
                  placeholder="Select or type Brand"
                  required
                />
                <ComboboxInput
                  label="Model Name"
                  value={formData.modelName || ""}
                  onChange={(value) => {
                    onChange({ modelName: value, submodelName: "" });
                  }}
                  options={modelOptions}
                  loading={isModelLoading}
                  disabled={!formData.brandName || isBrandLoading}
                  placeholder="Select or type Model"
                  required
                />
                <ComboboxInput
                  label="Submodel Name"
                  value={formData.submodelName || ""}
                  onChange={(value) => onChange({ submodelName: value })}
                  options={subModelOptions}
                  loading={isSubModelLoading}
                  disabled={
                    !formData.brandName || !formData.modelName || isModelLoading
                  }
                  placeholder="Select or type Submodel"
                />
                <TextField
                  label="Mileage (km)"
                  type="number"
                  value={formData.mileage?.toString() || ""}
                  onChange={(e) =>
                    onChange({ mileage: parseInt(e.target.value) || undefined })
                  }
                  required
                />
              </div>

              <Choices
                name="bodyType"
                label="Body Type"
                value={formData.bodyTypeName || null}
                options={bodyTypeOptions}
                onChange={(value) => onChange({ bodyTypeName: value })}
                direction="row"
                columns={3}
                required
              />

              <Choices
                name="transmission"
                label="Transmission"
                value={formData.transmissionName || null}
                options={transmissionOptions}
                onChange={(value) => onChange({ transmissionName: value })}
                direction="row"
                columns={2}
                required
              />

              <Choices
                name="drivetrain"
                label="Drivetrain"
                value={formData.drivetrainName || null}
                options={drivetrainOptions}
                onChange={(value) => onChange({ drivetrainName: value })}
                direction="row"
                columns={4}
                required
              />

              <CheckBoxes
                name="fuelType"
                label="Fuel Type"
                values={formData.fuelLabels || []}
                options={fuelTypeOptions}
                onChange={(values) => onChange({ fuelLabels: values })}
                direction="row"
                columns={3}
                required
              />
            </div>
          </FormSection>
        )}

        {/* Pricing & Description */}
        {expandedSections.has("pricing") && (
          <FormSection
            title="Pricing & Description"
            description={`${MIN_DESCRIPTION_LENGTH}-${MAX_DESCRIPTION_LENGTH} characters`}
            required
          >
            <div className="space-y-6">
              <TextField
                type="number"
                value={formData.price?.toString() || ""}
                onChange={(e) =>
                  onChange({ price: parseInt(e.target.value) || undefined })
                }
                placeholder="e.g., 500000"
                required
              />

              <div>
                <textarea
                  value={description}
                  onChange={(e) => onChange({ description: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent ${
                    !descriptionValid && description.length > 0
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  rows={4}
                  minLength={MIN_DESCRIPTION_LENGTH}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  placeholder="Describe condition, features, history, etc."
                  required
                />
                <div className="flex justify-between mt-2 text-sm">
                  <span
                    className={
                      descriptionValid
                        ? "text-green-600"
                        : descriptionLength > 0
                        ? "text-red-600"
                        : "text-gray-500"
                    }
                  >
                    {descriptionLength < MIN_DESCRIPTION_LENGTH
                      ? `Need ${
                          MIN_DESCRIPTION_LENGTH - descriptionLength
                        } more`
                      : descriptionValid
                      ? "✓ Valid"
                      : `${descriptionLength - MAX_DESCRIPTION_LENGTH} over`}
                  </span>
                  <span className="text-gray-500">
                    {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {/* Damage History */}
        {expandedSections.has("damage") && (
          <FormSection title="Damage History">
            <CheckBoxes
              name="damageHistory"
              values={damageFlags}
              options={DAMAGE_OPTIONS}
              onChange={handleDamageFlagsChange}
              direction="column"
            />
          </FormSection>
        )}

        {/* Section Toggles */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => toggleSection("documents")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              expandedSections.has("documents")
                ? "bg-maroon text-white hover:bg-red-800"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {expandedSections.has("documents") ? "Hide" : "Show"} Documents
          </button>
          <button
            type="button"
            onClick={() => toggleSection("details")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              expandedSections.has("details")
                ? "bg-maroon text-white hover:bg-red-800"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {expandedSections.has("details") ? "Hide" : "Show"} Details
          </button>
          <button
            type="button"
            onClick={() => toggleSection("pricing")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              expandedSections.has("pricing")
                ? "bg-maroon text-white hover:bg-red-800"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {expandedSections.has("pricing") ? "Hide" : "Show"} Pricing
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Back to Edit Images
        </button>
        <button
          onClick={onPublish}
          disabled={!reviewResult?.ready || isSubmitting}
          className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Publishing..." : "Publish Listing"}
        </button>
      </div>
    </div>
  );
}
