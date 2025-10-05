import { InspectionData } from "@/types/inspection";

export interface CarFormData {
  price: number;
  year?: number;
  mileage?: number;
  province?: string;
  conditionRating?: number;
  bodyTypeId?: number;
  transmissionId?: number;
  fuelTypeId?: number;
  drivetrainId?: number;
  seats?: number;
  doors?: number;
  color?: string;
  registrationNumber?: string;
  vin?: string;
  engineNumber?: string;
  bodyStyle?: string;
  overallResult?: string;
  brakePerformance?: string;
  handbrakePerformance?: string;
  emissionValue?: string;
  noiseLevel?: string;
  brakeResult?: string;
  wheelAlignmentResult?: string;
  emissionResult?: string;
  chassisConditionResult?: string;
}

const inspectionToFormKeyMap: Record<string, keyof CarFormData> = {
  "เลขทะเบียน": "registrationNumber",
  "เลขตัวถังรถ": "vin",
  "หมายเลขเครื่องยนต์": "engineNumber",
  "ลักษณะรถ": "bodyStyle",
  "สีรถ": "color",
  "ชนิดเชื้อเพลิง": "fuelTypeId",
  "ที่นั่งและจำนวนรถที่นั่ง": "seats",
  "ระยะทางวิ่ง": "mileage",
  "ผลการตรวจ": "overallResult",
  "ประสิทธิภาพห้ามล้อ": "brakePerformance",
  "ประสิทธิภาพห้ามล้อมือ": "handbrakePerformance",
  "ค่าไอเสีย": "emissionValue",
  "ค่าเครื่องวัดเสียง": "noiseLevel",
  "ผลเบรค": "brakeResult",
  "ผลศูนย์ล้อ": "wheelAlignmentResult",
  "ผลมลพิษจากไอเสีย": "emissionResult",
  "สภาพตัวถังและโครงรถ": "chassisConditionResult",
};

export const mapInspectionDataToForm = (inspectionData: InspectionData | null): Partial<CarFormData> => {
  if (!inspectionData) {
    return {};
  }
  const mappedData: Partial<CarFormData> = {};
  const numericKeys: (keyof CarFormData)[] = ['year', 'seats', 'mileage', 'price', 'conditionRating', 'doors'];

  for (const thaiKey in inspectionData) {
    const formKey = inspectionToFormKeyMap[thaiKey];
    if (formKey) {
      const value = inspectionData[thaiKey];
      
      if (numericKeys.includes(formKey)) {
        const numericValue = parseInt(value.replace(/,/g, ''), 10);
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