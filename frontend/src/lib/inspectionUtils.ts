import type { InspectionData, CarFormData } from "@/types/Car";
import { inspectionToFormKeyMap } from "@/constants/car";

export const mapInspectionDataToForm = (
  inspectionData: InspectionData | null
): Partial<CarFormData> => {
  if (!inspectionData) {
    return {};
  }
  const mappedData: Partial<CarFormData> = {};
  const numericKeys: (keyof CarFormData)[] = [
    "year",
    "seats",
    "mileage",
    "price",
    "conditionRating",
    "doors",
  ];

  for (const thaiKey in inspectionData) {
    const formKey = inspectionToFormKeyMap[thaiKey];
    if (formKey) {
      const value = inspectionData[thaiKey];

      if (numericKeys.includes(formKey)) {
        const numericValue = parseInt(value.replace(/,/g, ""), 10);
        if (!isNaN(numericValue)) {
          // ✅ [แก้ไข] เปลี่ยนมาใช้ as never
          mappedData[formKey] = numericValue as never;
        }
      } else {
        // ✅ [แก้ไข] เปลี่ยนมาใช้ as never
        mappedData[formKey] = value as never;
      }
    }
  }
  return mappedData;
};
