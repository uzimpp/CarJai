"use client";

import { useState } from "react";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { TextField } from "@/components/ui/TextField";
import { Choices } from "@/components/ui/Choices";
import { CheckBoxes } from "@/components/ui/CheckBoxes";
import type { CarFormData } from "@/types/Car";
import {
  BODY_TYPE_OPTIONS,
  TRANSMISSION_OPTIONS,
  DRIVETRAIN_OPTIONS,
  FUEL_TYPE_OPTIONS,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  DAMAGE_OPTIONS,
} from "@/constants/car";

interface Step4ReviewFormProps {
  formData: Partial<CarFormData>;
  bookData: Partial<CarFormData> | null;
  inspectionData: Record<string, string> | null;
  onChange: (updates: Partial<CarFormData>) => void;
  onBookDataChange: (data: Partial<CarFormData>) => void;
  onPublish: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  reviewResult: { ready: boolean; issues: string[] } | null;
}

export default function Step4ReviewForm({
  formData,
  bookData,
  inspectionData,
  onChange,
  onBookDataChange,
  onPublish,
  onBack,
  isSubmitting,
  reviewResult,
}: Step4ReviewFormProps) {
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
              Your listing is not yet ready. Please address the following
              issues:
              <ul className="list-disc list-inside mt-2 space-y-1">
                {reviewResult.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
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
              {bookData?.brandName || "—"} {formData.modelName || "—"}{" "}
              {formData.submodelName && `(${formData.submodelName})`}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-90">Year</p>
            <p className="text-lg font-semibold">{bookData?.year || "—"}</p>
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
            {bookData && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Registration Book
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Chassis Number *"
                    value={bookData.chassisNumber || ""}
                    onChange={(e) =>
                      onBookDataChange({ chassisNumber: e.target.value })
                    }
                    required
                  />
                  <TextField
                    label="Brand"
                    value={bookData.brandName || ""}
                    onChange={(e) =>
                      onBookDataChange({ brandName: e.target.value })
                    }
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
                  />
                  <TextField
                    label="Color"
                    value={bookData.color || ""}
                    onChange={(e) =>
                      onBookDataChange({ color: e.target.value })
                    }
                  />
                </div>

                {/* License Plate Information */}
                <div className="mt-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">
                    License Plate
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextField
                      label="Plate Prefix"
                      value={bookData.prefix || ""}
                      onChange={(e) =>
                        onBookDataChange({ prefix: e.target.value })
                      }
                      placeholder="e.g., กข"
                    />
                    <TextField
                      label="Plate Number"
                      value={bookData.number || ""}
                      onChange={(e) =>
                        onBookDataChange({ number: e.target.value })
                      }
                      placeholder="e.g., 1234"
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

                {/* Additional Info */}
                <div className="mt-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">
                    Additional Info
                  </h5>
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
                    />
                  </div>
                </div>
              </div>
            )}

            {inspectionData && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Inspection Report (Read-Only)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(inspectionData).map(([key, value]) => (
                    <TextField
                      key={key}
                      label={key}
                      value={value || ""}
                      disabled
                      readOnly
                    />
                  ))}
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
              options={BODY_TYPE_OPTIONS}
              onChange={(value) => onChange({ bodyTypeName: value })}
              direction="row"
              required
            />

            <Choices
              name="transmission"
              label="Transmission *"
              value={formData.transmissionName || null}
              options={TRANSMISSION_OPTIONS}
              onChange={(value) => onChange({ transmissionName: value })}
              direction="row"
              required
            />

            <Choices
              name="drivetrain"
              label="Drivetrain *"
              value={formData.drivetrainName || null}
              options={DRIVETRAIN_OPTIONS}
              onChange={(value) => onChange({ drivetrainName: value })}
              direction="row"
              required
            />

            <CheckBoxes
              name="fuelType"
              label="Fuel Type *"
              values={formData.fuelLabels || []}
              options={FUEL_TYPE_OPTIONS}
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
