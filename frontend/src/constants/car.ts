import type { CarFormData } from "@/types/Car";

export const inspectionToFormKeyMap: Record<string, keyof CarFormData> = {
  เลขทะเบียน: "registrationNumber",
  เลขตัวถังรถ: "vin",
  หมายเลขเครื่องยนต์: "engineNumber",
  ลักษณะรถ: "bodyStyle",
  สีรถ: "color",
  ชนิดเชื้อเพลิง: "fuelTypeId",
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

export default inspectionToFormKeyMap;
