"use client";

import { useState } from "react";
import { apiCall } from "@/lib/apiCall";
import ExtractedDataForm from "./ExtractedDataForm"; // <-- Import component ใหม่

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];


interface DocumentUploaderProps {
  onComplete?: (extractedText: string) => void;
}

export default function DocumentUploader({ onComplete }: DocumentUploaderProps = {}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // เปลี่ยน State จาก string เป็น Object เพื่อเก็บข้อมูลที่มีโครงสร้าง
  const [extractedData, setExtractedData] = useState<ParsedOcrData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // ฟังก์ชันสำหรับแปลงข้อความดิบจาก OCR เป็น Object
  const parseOcrResult = (text: string): ParsedOcrData => {
    const data: ParsedOcrData = {};
    const lines = text.split("\n");

    // ลองแปลง key จาก OCR ให้เป็น key ที่เรากำหนดไว้ใน DOCUMENT_FIELDS
    // เพื่อเพิ่มโอกาสในการ map ข้อมูลได้ถูกต้อง
    const keyMapping: Record<string, string> = {
      license_expiry_date: "expiry_date",
      ownership: "license_plate",
      // เพิ่ม mapping อื่นๆ ตามที่จำเป็น
    };
    
    lines.forEach((line) => {
      const parts = line.split(":");
      if (parts.length >= 2) {
        let key = parts[0].trim();
        const value = parts.slice(1).join(":").trim();
        
        // ตรวจสอบกับ mapping
        key = keyMapping[key] || key;
        data[key] = value;
      }
    });
    return data;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setExtractedData(null); // <-- Reset ข้อมูลที่เคยดึงได้
    setSelectedFile(null);

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setError("Invalid file format. Please upload JPG, PNG, or PDF.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
      );
      return;
    }
    setSelectedFile(file);
  };
  
  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setExtractedData(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const result = await apiCall<{
        success: boolean;
        data?: { extracted_text: string };
        message?: string;
      }>("/api/ocr/verify-document", {
        method: "POST",
        body: formData,
      });

      if (
        result.data?.extracted_text &&
        result.data.extracted_text.trim() !== ""
      ) {
        setOcrResult(result.data.extracted_text);
        if (onComplete) {
          onComplete(result.data.extracted_text);
        }
      } else {
        setError("No text found in the image.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handler เพื่อรับการเปลี่ยนแปลงข้อมูลจาก Child component
  const handleDataChange = (field: string, value: string) => {
    if (extractedData) {
      setExtractedData({
        ...extractedData,
        [field]: value,
      });
    }
  };
  
  return (
    <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-2xl shadow-lg">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Verify Your Document
        </h2>
        <p className="mt-2 text-gray-600">
          Upload your car registration book to extract information.
        </p>
      </div>

      <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-red-400 transition-colors">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileChange}
          accept={ACCEPTED_FILE_TYPES.join(",")}
        />
        <label
          htmlFor="file-upload"
          className="font-medium text-red-600 cursor-pointer hover:text-red-800"
        >
          Choose a file
        </label>
        <p className="mt-2 text-sm text-gray-500">
          {selectedFile ? selectedFile.name : "JPG, PNG, PDF up to 5MB"}
        </p>
      </div>

      {error && (
        <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedFile || isLoading}
        className="w-full px-4 py-3 text-lg font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        {isLoading ? "Processing..." : "Extract Text"}
      </button>

      {/* ส่วนที่เปลี่ยนแปลง: แสดง Component ใหม่แทน textarea เดิม */}
      {extractedData && !error && (
        <ExtractedDataForm data={extractedData} onDataChange={handleDataChange} />
      )}
    </div>
  );
}