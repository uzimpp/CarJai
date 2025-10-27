// src/components/features/inspection/QrCodeUploader.tsx

"use client";

import { useState, useRef, ChangeEvent, Fragment } from "react";
import jsQR from "jsqr";
import Image from "next/image";

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

  const scanQrCode = async (imageUrl: string) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !context) {
      setError("Cannot prepare canvas for scanning");
      setIsLoading(false);
      return;
    }

    const image = new window.Image();
    image.src = imageUrl;
    image.onload = async () => {
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0, image.width, image.height);

      const imageData = context.getImageData(0, 0, image.width, image.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        try {
          await onScanComplete(code.data);
        } finally {
          setIsLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    if (isLoading) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    // Simulate input change path
    const dt = new DataTransfer();
    dt.items.add(file);
    if (fileInputRef.current) fileInputRef.current.files = dt.files;
    handleFileChange({ target: { files: dt.files } } as any);
  };

  return (
    <Fragment>
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {imageSrc && (
        <div className="flex justify-center w-full">
          <Image
            src={imageSrc}
            alt="Preview"
            className="max-w-full max-h-64 mx-auto rounded-md object-contain"
            width={500}
            height={500}
          />
        </div>
      )}

      {error && (
        <div className="p-4 text-red-800 bg-red-100 border border-red-300 rounded-lg text-center">
          {error}
        </div>
      )}

      <div
        className="pt-4 p-6 border-2 border-dashed rounded-xl text-center bg-gray-50"
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
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
        <button
          onClick={handleUploadClick}
          disabled={isLoading}
          className="w-full px-6 py-3 bg-maroon text-white rounded-lg font-semibold hover:bg-red-800 disabled:bg-gray-400 disabled:cursor-wait transition-colors"
        >
          {isLoading ? "Scanning QR Code..." : "Select Image"}
        </button>
      </div>
    </Fragment>
  );
}
