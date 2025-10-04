// src/components/features/sell/CarDataForm.tsx

"use client";

import { useState, useEffect } from 'react';
import { CarFormData, parseOcrData } from '@/lib/ocrUtils';

interface CarDataFormProps {
  ocrData: string;
  initialData: CarFormData;
  onSubmit: (data: CarFormData) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function CarDataForm({ 
  ocrData,
  initialData,
  onSubmit,
  onBack,
  isSubmitting
}: CarDataFormProps) {
  const [formData, setFormData] = useState<CarFormData>(initialData);

  useEffect(() => {
    // เมื่อ ocrData เปลี่ยนแปลง ให้ parse และอัปเดตค่าในฟอร์ม
    const parsed = parseOcrData(ocrData);
    setFormData(prevData => ({
      ...prevData,
      ...parsed,
      price: prevData.price || 0, // รักษาราคาเดิมไว้หากมี
    }));
  }, [ocrData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['price', 'year', 'mileage', 'conditionRating', 'seats', 'doors'].includes(name);
    setFormData({
      ...formData,
      [name]: isNumeric ? parseInt(value) || 0 : value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">กรอกข้อมูลรถยนต์</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ยี่ห้อ</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="เช่น Toyota"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">รุ่น</label>
            <input
              type="text"
              name="model"
              value={formData.model || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="เช่น ALTIS"
            />
          </div>

          {/* Price (Required) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ราคา (บาท) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              name="price"
              required
              value={formData.price || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="เช่น 500000"
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ปี</label>
            <input
              type="number"
              name="year"
              value={formData.year || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="เช่น 2020"
            />
          </div>

          {/* Mileage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลขไมล์ (กม.)
            </label>
            <input
              type="number"
              name="mileage"
              value={formData.mileage || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="เช่น 50000"
            />
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">จังหวัด</label>
            <input
              type="text"
              name="province"
              value={formData.province || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="เช่น กรุงเทพมหานคร"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สี</label>
            <input
              type="text"
              name="color"
              value={formData.color || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="เช่น ขาว"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ย้อนกลับ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.price}
              className="flex-1 px-6 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "กำลังดำเนินการ..." : "ดำเนินการต่อ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}