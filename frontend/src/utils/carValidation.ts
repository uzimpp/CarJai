import type { CarFormData } from "@/types/Car";
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
 * Validates if the chassis numbers match between book and inspection
 * @param bookChassisNumber - Chassis number from registration book
 * @param inspectionChassisNumber - Chassis number from inspection
 * @returns true if they match, false otherwise
 */
export function doChassisNumbersMatch(
  bookChassisNumber?: string,
  inspectionChassisNumber?: string
): boolean {
  return (
    !!bookChassisNumber &&
    !!inspectionChassisNumber &&
    bookChassisNumber === inspectionChassisNumber
  );
}

/**
 * Validates if Step 1 (Documents) is complete
 * @param bookData - Data from registration book
 * @param inspectionData - Data from inspection
 * @returns true if step is complete
 */
export function isStep1Complete(
  bookData: Partial<CarFormData> | null,
  inspectionData: Record<string, string> | null
): boolean {
  return (
    bookData !== null &&
    inspectionData !== null &&
    doChassisNumbersMatch(bookData.chassisNumber, inspectionData["เลขตัวถังรถ"])
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
    formData.modelName &&
    formData.mileage !== undefined
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
