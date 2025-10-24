import type { CarFormData } from "@/types/Car";
import type { CheckOption } from "@/components/ui/CheckBoxes";

// Inspection field mapping (Thai → CarFormData keys) - Updated to use codes
export const inspectionToFormKeyMap: Record<string, keyof CarFormData> = {
  เลขทะเบียน: "registrationNumber",
  เลขตัวถังรถ: "chassisNumber",
  หมายเลขเครื่องยนต์: "engineNumber",
  ลักษณะรถ: "bodyStyle",
  สีรถ: "colorCodes", // Changed from "color"
  ชนิดเชื้อเพลิง: "fuelTypeCodes", // Changed from "fuelTypeId"
  ที่นั่งและจำนวนรถที่นั่ง: "seats",
  ระยะทางวิ่ง: "mileage",
  ผลการตรวจ: "overallResult",
  ประสิทธิภาพห้ามล้อ: "brakePerformance",
  ประสิทธิภาพห้ามล้อมือ: "handbrakePerformance",
  ค่าไอเสีย: "emissionValue",
  ค่าเครื่องวัดเสียง: "noiseLevel",
  ผลเบรค: "brakeResult",
  ผลศูนย์ล้อ: "wheelAlignmentResult",
  ผลมลพิษจากไอเสีย: "emissionResult",
  สภาพตัวถังและโครงรถ: "chassisConditionResult",
};

// Option lists removed: fetch from /api/reference-data in Step 2

// Damage Options

export const DAMAGE_OPTIONS: CheckOption<string>[] = [
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

// Image constraints
export const MIN_IMAGES = 5;
export const MAX_IMAGES = 12;

// Description constraints
export const MIN_DESCRIPTION_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 200;

export default inspectionToFormKeyMap;
