"use client";

import { ChangeEvent } from "react";

// กำหนดประเภทของข้อมูลที่จะแสดงผล
interface ExtractedData {
  [key: string]: string;
}

interface ExtractedDataFormProps {
  data: ExtractedData;
  onDataChange: (field: string, value: string) => void;
}

// กำหนดหัวข้อและ Label ที่เราต้องการจะแสดงผลในฟอร์ม
// key: ควรจะใกล้เคียงกับผลลัพธ์จาก OCR เพื่อให้ map ข้อมูลได้ง่าย
// label: คือข้อความที่จะแสดงผลบนหน้าเว็บ
const DOCUMENT_FIELDS = [
  { key: "license_plate", label: "เลขทะเบียน" },
  { key: "province", label: "จังหวัด" },
  { key: "owner_name", label: "ชื่อผู้ครอบครอง" },
  { key: "issue_date", label: "วันที่จดทะเบียน" },
  { key: "model", label: "แบบ/รุ่นรถ" },
  { key: "engine_number", label: "เลขเครื่องยนต์" },
  { key: "chassis_number", label: "เลขตัวถัง" },
  { key: "expiry_date", label: "วันสิ้นอายุภาษี" },
];

export default function ExtractedDataForm({
  data,
  onDataChange,
}: ExtractedDataFormProps) {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onDataChange(e.target.name, e.target.value);
  };

  return (
    <div className="w-full p-8 mt-6 space-y-4 bg-gray-50 border border-gray-200 rounded-2xl">
      <h3 className="text-xl font-semibold text-gray-800">
        ตรวจสอบข้อมูลจากเอกสาร
      </h3>
      <p className="text-sm text-gray-600">
        กรุณาตรวจสอบความถูกต้องของข้อมูลที่ดึงจากเอกสาร และแก้ไขหากจำเป็น
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4">
        {DOCUMENT_FIELDS.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={field.key}
              className="block text-sm font-medium text-gray-700"
            >
              {field.label}
            </label>
            <input
              type="text"
              id={field.key}
              name={field.key}
              value={data[field.key] || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}