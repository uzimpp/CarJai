// src/components/car/RegistrationBookUploader.tsx

"use client";

import { useState, useRef, ChangeEvent, Fragment } from "react";
import Image from "next/image";

interface RegistrationBookUploaderProps {
  onUpload: (file: File) => Promise<void>;
}

export default function RegistrationBookUploader({
  onUpload,
}: RegistrationBookUploaderProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsLoading(true);

    try {
      // Client-side size check only (<10MB); defer quality/size validation to AIGEN
      const maxSizeBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error("File is too large (max 10MB)");
      }

      const isPdf =
        file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      if (isPdf) {
        // Current OCR accepts image only. Ask user to export first page as image.
        throw new Error(
          "PDF detected. Please upload a clear PNG or JPEG image of the registration book."
        );
      }

      // Show preview for images
      const objectUrl = URL.createObjectURL(file);
      setPreviewSrc(objectUrl);

      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload book");
      setPreviewSrc(null); // Clear preview on error
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);
    if (isLoading) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Simulate input change path
    const dt = new DataTransfer();
    dt.items.add(file);
    if (fileInputRef.current) fileInputRef.current.files = dt.files;
    handleFileChange({
      target: { files: dt.files },
    } as unknown as ChangeEvent<HTMLInputElement>);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    }
    if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  return (
    <Fragment>
      {error && (
        <div className="mb-4 p-4 text-red-800 bg-red-50 border border-red-200 rounded-lg text-center text-sm">
          {error}
        </div>
      )}

      <div
        className={`p-8 border-2 border-dashed rounded-xl transition-colors ${
          isDragging
            ? "bg-maroon/10 border-maroon"
            : isLoading
            ? "bg-gray-100 border-gray-400"
            : "bg-gray-50 border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isLoading}
        />
        {previewSrc ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <Image
              src={previewSrc}
              alt="Uploaded preview"
              width={800}
              height={600}
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-sm text-gray-700 font-medium">
              Drag and drop here, or
            </p>
            <button
              onClick={handleUploadClick}
              disabled={isLoading}
              className="inline-block px-6 py-2.5 bg-maroon text-white rounded-lg font-semibold hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
            >
              {isLoading ? "Processing..." : "Select Image"}
            </button>
            <p className="text-xs text-gray-600 mt-2">
              Optional. Upload a clear PNG/JPEG photo to auto-fill details.
            </p>
          </div>
        )}
      </div>
    </Fragment>
  );
}
