import type { CarFormData } from "@/types/car";
import {
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from "@/constants/car";

/**
 * Validates the description length
 * @param description - The description to validate
 * @returns true if valid, false otherwise
 */
export function isDescriptionValid(description: string): boolean {
  const length = description.length;
  return length >= MIN_DESCRIPTION_LENGTH && length <= MAX_DESCRIPTION_LENGTH;
}

/**
 * Validates if Step 1 (Documents) is complete
 * @param bookData - Data from registration book
 * @param inspectionData - Data from inspection
 * @returns true if step is complete
 */
export function isStep1Complete(
  formData: Partial<CarFormData> | null,
  inspectionData: Record<string, string> | null
): boolean {
  return (
    formData !== null &&
    inspectionData !== null &&
    formData.mileage !== undefined &&
    formData.year !== undefined &&
    formData.seats !== undefined &&
    formData.doors !== undefined &&
    formData.engineCc !== undefined &&
    formData.brandName !== undefined &&
    formData.modelName !== undefined &&
    formData.submodelName !== undefined
  );
}

/**
 * Validates if Step 2 (Specs) is complete
 * @param formData - Car form data
 * @returns true if step is complete
 */
export function isStep2Complete(formData: Partial<CarFormData>): boolean {
  return !!(
    formData.bodyTypeName &&
    formData.transmissionName &&
    formData.drivetrainName &&
    (formData.fuelLabels?.length ?? 0) > 0 &&
    formData.conditionRating
  );
}

/**
 * Validates if Step 3 (Pricing) is complete
 * @param formData - Car form data
 * @param imagesUploaded - Whether images have been uploaded
 * @returns true if step is complete
 */
export function isStep3Complete(
  formData: Partial<CarFormData>,
  imagesUploaded: boolean
): boolean {
  return !!(
    formData.price &&
    formData.price > 0 &&
    formData.description &&
    isDescriptionValid(formData.description) &&
    imagesUploaded
  );
}

/**
 * Validates if price is valid
 * @param price - The price to validate
 * @returns true if valid, false otherwise
 */
export function isPriceValid(price?: number): boolean {
  return !!price && price > 0;
}

/**
 * Validates if mileage is valid
 * @param mileage - The mileage to validate
 * @returns true if valid, false otherwise
 */
export function isMileageValid(mileage?: number): boolean {
  return mileage !== undefined && mileage >= 0;
}
