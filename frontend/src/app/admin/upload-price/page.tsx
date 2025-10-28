'use client'; // Mark as a Client Component because we need state and event handlers

import React, { useState, ChangeEvent, FormEvent } from 'react';
import ConditionalLayout from '@/components/global/Layout'; // Import your global layout

// Define a type for the response message
interface UploadResponse {
  message: string;
  error?: string; // Optional error details
}

export default function UploadMarketPricePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      // Check if file is PDF before setting state
      if (event.target.files[0].type === 'application/pdf') {
        setSelectedFile(event.target.files[0]);
        setUploadStatus(null); // Clear previous status on new file selection
      } else {
        setSelectedFile(null); // Clear selection if not PDF
        setUploadStatus({ message: '', error: 'Invalid file type. Please select a PDF file.' });
        event.target.value = ''; // Reset the file input visually
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // *** แก้ไข 1: ตรวจสอบ selectedFile ก่อนใช้ append() เพื่อแก้ Type Error ***
    if (!selectedFile) {
        setUploadStatus({ message: '', error: 'Please select a PDF file first.' });
        return;
    }
    // *** สิ้นสุดการแก้ไข ***

    setIsLoading(true);
    setUploadStatus(null);
    const formData = new FormData();
    // *** แก้ไข 2: ใช้ Non-null Assertion (!) เพื่อให้ TypeScript ยอมรับ ***
    formData.append('marketPricePdf', selectedFile!); 
    // *** สิ้นสุดการแก้ไข ***

    try {
      // *** 1. ดึง Admin Token (ตัวอย่าง: จาก Local Storage) ***
      const adminToken = localStorage.getItem("admin_jwt"); // ใช้ "admin_jwt" ซึ่งเป็นชื่อ cookie/token ที่ใช้บ่อยใน Admin
      
      if (!adminToken) {
           setUploadStatus({ message: '', error: 'Admin authentication token not found. Please sign in first.' });
           setIsLoading(false);
           return;
      }

      const response = await fetch('/api/admin/market-price/import', { 
        method: 'POST',
        headers: {
           // *** 2. เพิ่ม Authorization Header ***
           'Authorization': `Bearer ${adminToken}`,
        },
        body: formData,
      });

      // Handle response body (checking if it is JSON first)
      const contentType = response.headers.get("content-type");
      let result = { message: "", error: "" };
      if (contentType && contentType.includes("application/json")) {
          result = await response.json();
      } else {
          // If 401/403/404 is returned without JSON, we use status text
          result.error = await response.text(); 
      }
      
      if (response.ok && response.status === 202) {
        setUploadStatus({ message: result.message || 'PDF received and import process started in background.' });
        setSelectedFile(null);
         const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
         if (fileInput) fileInput.value = '';

      } else {
        // Try to get error message from backend response, otherwise use status text
        const errorMessage = result.error || result.message || response.statusText || 'Upload failed. Please check backend logs.';
        setUploadStatus({ message: '', error: `Error ${response.status}: ${errorMessage}` });
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setUploadStatus({ message: '', error: `An error occurred during upload: ${errorMessage}. Check console or network logs.` });
    } finally {
      setIsLoading(false);
    }
  };

  // Wrap the content with your ConditionalLayout
  return (
    <ConditionalLayout>
      <div className="flex justify-center items-center w-full py-12 px-4"> {/* Adjust padding as needed */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
          {/* UI Card */}
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
              {isLoading ? 'Uploading...' : 'Upload and Start Import'}
            </button>
          </form>
        </div>
      </div>
    </ConditionalLayout>
  );
}