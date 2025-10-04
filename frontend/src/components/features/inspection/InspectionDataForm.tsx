// src/components/features/inspection/InspectionDataForm.tsx

"use client";

import { useState, useEffect } from 'react';
import { CarFormData } from '@/lib/ocrUtils';
import { InspectionData } from '@/types/inspection';
import { mapInspectionDataToForm } from '@/lib/inspectionUtils';

interface InspectionDataFormProps {
  inspectionData: InspectionData | null;
  initialData: CarFormData;
  onSubmit: (data: CarFormData) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function InspectionDataForm({
  inspectionData,
  initialData,
  onSubmit,
  onBack,
  isSubmitting,
}: InspectionDataFormProps) {
  const [formData, setFormData] = useState<CarFormData>(initialData);

  useEffect(() => {
    // เมื่อข้อมูล Scraper มาถึง ให้แปลงและเติมลงในฟอร์ม
    const mappedData = mapInspectionDataToForm(inspectionData);
    
    // ผสานข้อมูลจากฟอร์มก่อนหน้า (initialData) กับข้อมูลใหม่ (mappedData)
    // โดยให้ข้อมูลจาก Scraper สำคัญกว่า
    setFormData(prevData => ({
      ...prevData,
      ...mappedData,
    }));
  }, [inspectionData]); // ให้ Effect นี้ทำงานเมื่อ inspectionData เปลี่ยนแปลง

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['price', 'year', 'mileage', 'conditionRating', 'seats', 'doors'].includes(name);
    setFormData({
      ...formData,
      [name]: isNumeric ? (value === '' ? undefined : parseInt(value, 10)) : value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">ตรวจสอบและยืนยันข้อมูล</h2>

      <div className="space-y-6">
        {/* แสดงฟิลด์ต่างๆ จาก Scraper ให้แก้ไข */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ยี่ห้อ</label>
          <input type="text" name="brand" value={formData.brand || ""} onChange={handleChange} className="w-full input-style" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">รุ่น</label>
          <input type="text" name="model" value={formData.model || ""} onChange={handleChange} className="w-full input-style" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ปี</label>
          <input type="number" name="year" value={formData.year || ""} onChange={handleChange} className="w-full input-style" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">สี</label>
          <input type="text" name="color" value={formData.color || ""} onChange={handleChange} className="w-full input-style" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">จังหวัด</label>
          <input type="text" name="province" value={formData.province || ""} onChange={handleChange} className="w-full input-style" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนที่นั่ง</label>
          <input type="number" name="seats" value={formData.seats || ""} onChange={handleChange} className="w-full input-style" />
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-4 pt-6 border-t mt-6">
        <button type="button" onClick={onBack} className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
          ย้อนกลับ
        </button>
        <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400">
          {isSubmitting ? 'กำลังสร้างประกาศ...' : 'สร้างและดำเนินการต่อ'}
        </button>
      </div>
    </form>
  );
}