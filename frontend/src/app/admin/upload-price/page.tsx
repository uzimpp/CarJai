'use client'; // Mark as a Client Component because we need state and event handlers

import React, { useState, ChangeEvent, FormEvent } from 'react';
import ConditionalLayout from '@/components/global/Layout'; // Import your global layout

// *** เพิ่ม: Interface MarketPrice (ชื่อ field ตรงกับ JSON จาก Backend) ***
interface MarketPrice {
  brand: string;
  model_trim: string; // ใช้ snake_case ตาม Go struct tag
  year_start: number;
  year_end: number;
  price_min_thb: number; // ใช้ number ถ้า Backend ส่ง number
  price_max_thb: number;
  // created_at?: string; // ไม่จำเป็นต้องแสดง
  // updated_at?: string;
}


// Define a type for the response message and potential JSON error
interface UploadResponse {
  message: string;
  error?: string; // Optional error details
}
// Type for JSON error structure from Go backend's utils.WriteError
interface GoErrorResponse {
	success: boolean;
	error: string;
	code: number;
}


export default function UploadMarketPricePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // *** เพิ่ม: State สำหรับเก็บผลลัพธ์ JSON ***
  const [extractedJson, setExtractedJson] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      if (event.target.files[0].type === 'application/pdf') {
        setSelectedFile(event.target.files[0]);
        setUploadStatus(null);
        setExtractedJson(null); // *** เคลียร์ JSON เก่าเมื่อเลือกไฟล์ใหม่ ***
      } else {
        setSelectedFile(null);
        setUploadStatus({ message: '', error: 'Invalid file type. Please select a PDF file.' });
        event.target.value = '';
        setExtractedJson(null); // เคลียร์ JSON ด้วยถ้าไฟล์ไม่ถูกต้อง
      }
    } else {
      // Clear selection if user cancels file dialog
      setSelectedFile(null);
      setUploadStatus(null);
      setExtractedJson(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
        setUploadStatus({ message: '', error: 'Please select a PDF file first.' });
        return;
    }

    setIsLoading(true);
    setUploadStatus(null);
    setExtractedJson(null); // เคลียร์ JSON ก่อนเริ่ม Upload ใหม่
    const formData = new FormData();
    formData.append('marketPricePdf', selectedFile!);

    try {
      // *** ไม่ต้องดึง หรือเช็ค Token จาก localStorage แล้ว ***

      const response = await fetch('/admin/market-price/import', { // URL ถูกต้อง
        method: 'POST',
        // headers: {}, // ไม่ต้องใส่ Authorization หรือ Content-Type สำหรับ FormData
        body: formData,
        credentials: 'include', // <--- ต้องมีอันนี้ เพื่อให้ส่ง Cookie
      });

      const contentType = response.headers.get("content-type");

      // *** เปลี่ยน: การจัดการ Response ***
      if (response.ok && response.status === 200 && contentType && contentType.includes("application/json")) {
          // คาดหวัง JSON Array (MarketPrice[]) เมื่อสำเร็จ (Status 200 OK)
          const result: MarketPrice[] = await response.json();
          setExtractedJson(JSON.stringify(result, null, 2)); // จัดรูปแบบ JSON ให้อ่านง่าย (indent 2 spaces)
          setUploadStatus({ message: `Successfully extracted ${result.length} records.`, error: undefined });
          setSelectedFile(null); // เคลียร์ไฟล์ที่เลือก
           // Reset file input visually
           const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
           if (fileInput) fileInput.value = '';

      } else {
        // จัดการ Error (อาจจะเป็น JSON Error จาก Backend หรือ Text อื่นๆ)
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            if (contentType && contentType.includes("application/json")) {
                const errorResult: GoErrorResponse = await response.json(); // ลอง Parse เป็น GoErrorResponse
                errorMessage = errorResult.error || `Error ${errorResult.code || response.status}`;
            } else {
                 const textError = await response.text(); // อ่านเป็น Text ถ้าไม่ใช่ JSON
                 errorMessage = textError || response.statusText || errorMessage;
            }
        } catch (parseError) {
             console.error("Error parsing error response:", parseError);
             // Attempt to read as text if JSON parsing fails
             try {
                const textError = await response.text();
                errorMessage = textError || response.statusText || errorMessage;
             } catch {
                errorMessage = response.statusText || errorMessage; // Fallback สุดท้าย
             }
        }
        setUploadStatus({ message: '', error: errorMessage });
        setExtractedJson(null); // ไม่มี JSON ถ้าเกิด Error
      }
    } catch (error) {
      console.error('Network or other error during upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown network error occurred';
      setUploadStatus({ message: '', error: `Upload Error: ${errorMessage}` });
      setExtractedJson(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Wrap the content with your ConditionalLayout
  return (
    <ConditionalLayout>
      <div className="flex justify-center items-start w-full py-12 px-4"> {/* items-start ให้ชิดบน */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-2xl"> {/* ขยายความกว้าง */}
          {/* UI Card Header */}
          <div className="text-center mb-6">
            <span className="inline-block p-3 bg-red-100 dark:bg-red-900 rounded-full mb-3">
              {/* Document Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Upload Market Price PDF</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              The system will extract car market prices from the document.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* File Input Area */}
            <div className="mb-4 p-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-center">
              <label
                htmlFor="pdf-upload"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 cursor-pointer"
              >
                Choose a file
              </label>
              <input
                id="pdf-upload"
                name="marketPricePdf"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-full file:border-0
                           file:text-sm file:font-semibold
                           file:bg-red-50 file:text-red-700
                           dark:file:bg-red-900 dark:file:text-red-300
                           hover:file:bg-red-100 dark:hover:file:bg-red-800
                           cursor-pointer"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PDF only, up to 50MB.
              </p>
              {selectedFile && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {/* Status Messages */}
            {uploadStatus && (
              <div
                className={`mb-4 p-3 rounded-md text-sm ${
                  uploadStatus.error
                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                }`}
              >
                {uploadStatus.error || uploadStatus.message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedFile || isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                         bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                         dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-600
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Extracting...' : 'Upload and Extract Data'} {/* เปลี่ยน Text ปุ่ม */}
            </button>
          </form>

          {/* *** เพิ่ม: Textarea สำหรับแสดงผล JSON *** */}
          {extractedJson && (
            <div className="mt-6">
              <label htmlFor="json-output" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Extracted JSON Data:
              </label>
              <textarea
                id="json-output"
                readOnly
                value={extractedJson}
                rows={15} // กำหนดจำนวนบรรทัดเริ่มต้น
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-xs font-mono" // ใช้ font monospace ให้อ่านง่าย
                style={{ resize: 'vertical' }} // อนุญาตให้ย่อขยายแนวตั้ง
              />
            </div>
          )}
          {/* *** สิ้นสุดส่วนที่เพิ่ม *** */}

        </div>
      </div>
    </ConditionalLayout>
  );
}