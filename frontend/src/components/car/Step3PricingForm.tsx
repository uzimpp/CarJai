"use client";

import { TextField } from "@/components/ui/TextField";
import { FormSection } from "@/components/ui/FormSection";
import CarImageUploader from "@/components/car/CarImageUploader";
import type { CarFormData } from "@/types/Car";
import {
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MIN_IMAGES,
} from "@/constants/car";
import { InlineAlert } from "@/components/ui/InlineAlert";

interface Step3PricingFormProps {
  carId: number;
  formData: Partial<CarFormData>;
  onChange: (updates: Partial<CarFormData>) => void;
  onContinue: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  imagesUploaded?: boolean;
  onImagesUploaded?: () => void;
}

export default function Step3PricingForm({
  carId,
  formData,
  onChange,
  onContinue,
  onBack,
  isSubmitting,
  imagesUploaded = false,
  onImagesUploaded,
}: Step3PricingFormProps) {
  const description = formData.description || "";
  const descriptionLength = description.length;
  const descriptionValid =
    descriptionLength >= MIN_DESCRIPTION_LENGTH &&
    descriptionLength <= MAX_DESCRIPTION_LENGTH;

  const canContinue =
    formData.price &&
    formData.price > 0 &&
    descriptionValid &&
    imagesUploaded &&
    !isSubmitting;

  return (
    <div className="space-y-6">
      {/* Images */}
      <FormSection
        title="Vehicle Images"
        description={`Upload ${MIN_IMAGES}-12 high-quality images (JPEG, PNG, WebP, GIF). First image becomes the main photo. Max 50MB per image.`}
      >
        <CarImageUploader
          carId={carId}
          onUploadComplete={() => {
            if (onImagesUploaded) {
              onImagesUploaded();
            }
          }}
        />
        <InlineAlert type="info">
          Tip: Include angles like front, rear, sides, interior, dashboard, and
          engine for better buyer interest.
        </InlineAlert>
      </FormSection>
      {/* Price */}
      <FormSection
        title="Pricing"
        description="Set your asking price for the vehicle"
      >
        <TextField
          label="Price (฿) *"
          type="number"
          value={formData.price?.toString() || ""}
          onChange={(e) =>
            onChange({ price: parseInt(e.target.value) || undefined })
          }
          placeholder="e.g., 500000"
          helper="Enter your desired selling price in Thai Baht"
          required
        />
      </FormSection>

      {/* Description */}
      <FormSection
        title="Description"
        description={`Write a brief description of your vehicle (${MIN_DESCRIPTION_LENGTH}-${MAX_DESCRIPTION_LENGTH} characters)`}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => onChange({ description: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-maroon focus:border-transparent transition-colors ${
              !descriptionValid && description.length > 0
                ? "border-red-500"
                : "border-gray-300"
            }`}
            placeholder="Describe your vehicle (condition, features, history, etc.)"
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
                ? `Need ${
                    MIN_DESCRIPTION_LENGTH - descriptionLength
                  } more characters`
                : descriptionValid
                ? "✓ Valid length"
                : `${
                    descriptionLength - MAX_DESCRIPTION_LENGTH
                  } characters over limit`}
            </span>
            <span className="text-gray-500">
              {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>
        </div>
      </FormSection>

      {/* Validation Messages */}
      {!imagesUploaded && (
        <InlineAlert type="warning">
          Please add at least {MIN_IMAGES} images before continuing
        </InlineAlert>
      )}

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
          Continue to Review
        </button>
      </div>
    </div>
  );
}
