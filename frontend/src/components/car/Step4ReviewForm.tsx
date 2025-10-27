"use client";

import { useEffect, useState } from "react";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { TextField } from "@/components/ui/TextField";
import { Choices } from "@/components/ui/Choices";
import { CheckBoxes } from "@/components/ui/CheckBoxes";
import type { CarFormData } from "@/types/Car";
import {
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from "@/constants/car";
import { referenceAPI } from "@/lib/referenceAPI";
import type { ChoiceOption } from "@/components/ui/Choices";
import type { CheckOption } from "@/components/ui/CheckBoxes";

interface Step4ReviewFormProps {
  formData: Partial<CarFormData>;
  onChange: (updates: Partial<CarFormData>) => void;
  onPublish: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  reviewResult: { ready: boolean; issues: string[] } | null;
}

const DAMAGE_OPTIONS: CheckOption<string>[] = [
  {
    value: "flooded",
    label: "Flooded Vehicle",
    description: "This vehicle has been damaged by flooding",
  },
  {
    value: "heavilyDamaged",
    label: "Heavy Crash History",
    description: "This vehicle has been in a major accident",
  },
];

export default function Step4ReviewForm({
  formData,
  onChange,
  onPublish,
  onBack,
  isSubmitting,
  reviewResult,
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
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

  const EditableSection = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.has(id);
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50"
        >
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="text-gray-500">
            {isExpanded ? "▼ Collapse" : "► Expand to Edit"}
          </span>
        </button>
        {isExpanded && <div className="px-6 pb-6">{children}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Review Status */}
      {reviewResult && (
        <div>
          {reviewResult.ready ? (
            <InlineAlert type="success">
              ✓ Your listing is ready to publish! Review the details below and
              click Publish when ready.
            </InlineAlert>
          ) : (
            <InlineAlert type="warning">
              <div>
                Your listing is not yet ready. Please address the following
                issues:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {reviewResult.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
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

      {/* Editable Sections */}
      <div className="space-y-4">
        {/* Document Information */}
        <EditableSection id="documents" title="📄 Document Information">
          <div className="space-y-6">
            {(formData.chassisNumber ||
              formData.licensePlate ||
              formData.station) && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Inspection & Registration
                </h4>
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
              </div>
            )}
          </div>
        </EditableSection>

        {/* Vehicle Details */}
        <EditableSection id="details" title="🚗 Vehicle Details">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Model Name *"
                value={formData.modelName || ""}
                onChange={(e) => onChange({ modelName: e.target.value })}
                required
              />
              <TextField
                label="Submodel Name"
                value={formData.submodelName || ""}
                onChange={(e) => onChange({ submodelName: e.target.value })}
              />
              <TextField
                label="Mileage (km) *"
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
              label="Body Type *"
              value={formData.bodyTypeName || null}
              options={bodyTypeOptions}
              onChange={(value) => onChange({ bodyTypeName: value })}
              direction="row"
              required
            />

            <Choices
              name="transmission"
              label="Transmission *"
              value={formData.transmissionName || null}
              options={transmissionOptions}
              onChange={(value) => onChange({ transmissionName: value })}
              direction="row"
              required
            />

            <Choices
              name="drivetrain"
              label="Drivetrain *"
              value={formData.drivetrainName || null}
              options={drivetrainOptions}
              onChange={(value) => onChange({ drivetrainName: value })}
              direction="row"
              required
            />

            <CheckBoxes
              name="fuelType"
              label="Fuel Type *"
              values={formData.fuelLabels || []}
              options={fuelTypeOptions}
              onChange={(values) => onChange({ fuelLabels: values })}
              direction="row"
            />
          </div>
        </EditableSection>

        {/* Pricing & Description */}
        <EditableSection id="pricing" title="💰 Pricing & Description">
          <div className="space-y-6">
            <TextField
              label="Price (฿) *"
              type="number"
              value={formData.price?.toString() || ""}
              onChange={(e) =>
                onChange({ price: parseInt(e.target.value) || undefined })
              }
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
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
                    ? `Need ${MIN_DESCRIPTION_LENGTH - descriptionLength} more`
                    : descriptionValid
                    ? "✓ Valid"
                    : `${descriptionLength - MAX_DESCRIPTION_LENGTH} over`}
                </span>
                <span className="text-gray-500">
                  {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
            </div>

            <CheckBoxes
              name="damageHistory"
              label="Damage History"
              values={damageFlags}
              options={DAMAGE_OPTIONS}
              onChange={handleDamageFlagsChange}
              direction="column"
            />
          </div>
        </EditableSection>
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
