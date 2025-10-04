// src/lib/inspectionUtils.ts

import { CarFormData } from "./ocrUtils";
import { InspectionData } from "@/types/inspection";

const inspectionToFormKeyMap: Record<string, keyof CarFormData> = {
  "ยี่ห้อรถ": "brand",
  "แบบ": "model",
  "ปี": "year",
  "สี": "color",
  "จังหวัด": "province",
  "จำนวนที่นั่ง": "seats",
};

export const mapInspectionDataToForm = (inspectionData: InspectionData | null): Partial<CarFormData> => {
  if (!inspectionData) {
    return {};
  }

  const mappedData: Partial<CarFormData> = {};

  for (const thaiKey in inspectionData) {
    const formKey = inspectionToFormKeyMap[thaiKey];
    if (formKey) {
      const value = inspectionData[thaiKey];
      
      if (formKey === 'year' || formKey === 'seats') {
        const numericValue = parseInt(value, 10);
        if (!isNaN(numericValue)) {
          // ✅ [แก้ไข] เปลี่ยนจาก (mappedData as any)[formKey] = numericValue;
          mappedData[formKey] = numericValue as never;
        }
      } else {
        // ✅ [แก้ไข] เปลี่ยนจาก (mappedData as any)[formKey] = value;
        mappedData[formKey] = value as never;
      }
    }
  }

  return mappedData;
};