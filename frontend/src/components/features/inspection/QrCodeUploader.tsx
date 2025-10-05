// src/components/features/inspection/QrCodeUploader.tsx

"use client";

import { useState, useRef, ChangeEvent } from "react";
import jsQR from "jsqr";

interface QrCodeUploaderProps {
  onScanComplete: (url: string) => void;
}

export default function QrCodeUploader({
  onScanComplete,
}: QrCodeUploaderProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setImageSrc(imageUrl);
      scanQrCode(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const scanQrCode = (imageUrl: string) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !context) {
      setError("Cannot prepare canvas for scanning");
      setIsLoading(false);
      return;
    }

    const image = new Image();
    image.src = imageUrl;
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0, image.width, image.height);

      const imageData = context.getImageData(0, 0, image.width, image.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        console.log("QR Code found -> URL:", code.data);
        onScanComplete(code.data);
      } else {
        setError("No QR Code found in this image. Please try again");
        setIsLoading(false);
        setImageSrc(null); // Clear preview on failure
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Reset file input
        }
      }
    };
    image.onerror = () => {
      setError("Unable to load image file");
      setIsLoading(false);
    };
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-2xl shadow-lg mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Upload Inspection Report
        </h2>
        <p className="mt-2 text-gray-600">
          Please upload an image of the vehicle inspection report with QR Code
        </p>
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {imageSrc && (
        <div className="mt-4 border border-gray-200 rounded-lg p-2">
          <p className="text-center text-sm mb-2 text-gray-500">
            Uploaded Image Preview:
          </p>
          <img
            src={imageSrc}
            alt="Preview"
            className="max-w-full max-h-64 mx-auto rounded-md"
          />
        </div>
      )}

      {error && (
        <div className="p-4 text-red-800 bg-red-100 border border-red-300 rounded-lg text-center">
          {error}
        </div>
      )}

      <div className="pt-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isLoading}
        />
        <button
          onClick={handleUploadClick}
          disabled={isLoading}
          className="w-full px-6 py-4 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-wait transition-colors text-lg font-semibold"
        >
          {isLoading ? "Scanning QR Code..." : "Select Image"}
        </button>
      </div>
    </div>
  );
}
