"use client";

import { useState, useRef, DragEvent } from "react";
import { apiCall } from "@/lib/apiCall";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MIN_IMAGES = 5;
const MAX_IMAGES = 12;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

interface ImagePreview {
  file: File;
  preview: string;
  order: number;
}

interface CarImageUploaderProps {
  carId: number;
  onUploadComplete?: () => void;
}

export default function CarImageUploader({
  carId,
  onUploadComplete,
}: CarImageUploaderProps) {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    setError("");
    const newImages: ImagePreview[] = [];
    const fileArray = Array.from(files);

    // Check if adding these files would exceed max
    if (images.length + fileArray.length > MAX_IMAGES) {
      setError(
        `Maximum ${MAX_IMAGES} images allowed (currently have ${images.length})`
      );
      return;
    }

    for (const file of fileArray) {
      // Validate file type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError(
          `File ${file.name} is not supported (only JPEG, PNG, WebP, GIF)`
        );
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File ${file.name} exceeds 50MB`);
        continue;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      newImages.push({
        file,
        preview,
        order: images.length + newImages.length,
      });
    }

    setImages([...images, ...newImages]);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter(
      (_: ImagePreview, i: number) => i !== index
    );
    // Update order
    newImages.forEach((img: ImagePreview, i: number) => {
      img.order = i;
    });
    setImages(newImages);

    // Revoke URL to free memory
    URL.revokeObjectURL(images[index].preview);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    // Update order
    newImages.forEach((img: ImagePreview, i: number) => {
      img.order = i;
    });

    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleUpload = async () => {
    console.log("=== Upload Debug Info ===");
    console.log("Car ID:", carId);
    console.log("Images count:", images.length);
    console.log("MIN_IMAGES:", MIN_IMAGES);

    if (images.length < MIN_IMAGES) {
      const errorMsg = `Please select at least ${MIN_IMAGES} images (currently have ${images.length})`;
      setError(errorMsg);
      console.error(errorMsg);
      return;
    }

    setIsUploading(true);
    setError("");

    const formData = new FormData();

    // Sort by order and append to formData
    const sortedImages = [...images].sort((a, b) => a.order - b.order);
    sortedImages.forEach((img, index) => {
      console.log(
        `Adding image ${index + 1}:`,
        img.file.name,
        img.file.size,
        "bytes"
      );
      formData.append("images", img.file);
    });

    try {
      const url = `/api/cars/${carId}/images`;
      console.log("Uploading to:", url);

      const result = await apiCall<{
        success: boolean;
        data?: {
          carId: number;
          uploadedCount: number;
          images: Array<{
            id: number;
            carId: number;
            imageType: string;
            imageSize: number;
            displayOrder: number;
            uploadedAt: string;
          }>;
        };
        message?: string;
      }>(url, {
        method: "POST",
        body: formData,
      });

      console.log("Upload result:", result);

      if (result.success) {
        console.log("✅ Upload successful!");
        // Clear previews
        images.forEach((img) => URL.revokeObjectURL(img.preview));
        setImages([]);

        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        const errorMsg = result.message || "Upload error occurred";
        console.error("❌ Upload failed:", errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error("❌ Upload exception:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Upload error occurred");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl p-8 space-y-6 bg-white rounded-2xl shadow-lg">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Upload Car Images</h2>
        <p className="mt-2 text-gray-600">
          Upload at least {MIN_IMAGES} images (maximum {MAX_IMAGES} images)
        </p>
        <p className="text-sm text-gray-500">
          Current: {images.length} images | Max file size: 50MB/image
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`p-12 border-2 border-dashed rounded-xl text-center transition-all ${
          dragActive
            ? "border-red-500 bg-red-50"
            : "border-gray-300 hover:border-red-400 bg-gray-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="images-upload"
          className="hidden"
          onChange={handleFileChange}
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          multiple
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-lg text-gray-700">
              Drag and drop images here, or
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-6 py-2 text-red-600 font-medium hover:text-red-800 transition-colors"
            >
              Select Files
            </button>
          </div>

          <p className="text-sm text-gray-500">Supports JPEG, PNG, WebP, GIF</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 text-red-600 bg-red-50 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Image Previews with Reorder */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Selected Images ({images.length}/{MAX_IMAGES})
            </h3>
            {images.length < MIN_IMAGES && (
              <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                ⚠️ Need {MIN_IMAGES - images.length} more
              </span>
            )}
            {images.length >= MIN_IMAGES && (
              <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                ✓ Ready to upload
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            💡 Drag images to reorder (first image will be the main image)
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img: ImagePreview, index: number) => (
              <div
                key={`${img.preview}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e: DragEvent<HTMLDivElement>) =>
                  handleDragOver(e, index)
                }
                onDragEnd={handleDragEnd}
                className={`relative group cursor-move border-2 rounded-lg overflow-hidden transition-all ${
                  draggedIndex === index
                    ? "border-red-500 shadow-lg opacity-50"
                    : "border-gray-200 hover:border-red-300"
                }`}
              >
                {/* Order Badge */}
                <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                  {index + 1}
                  {index === 0 && " (Main)"}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  title="Remove this image"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Image Preview */}
                <img
                  src={img.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-48 object-cover"
                />

                {/* File Info */}
                <div className="p-2 bg-gray-50">
                  <p
                    className="text-xs text-gray-600 truncate"
                    title={img.file.name}
                  >
                    {img.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(img.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex gap-4">
        <button
          onClick={handleUpload}
          disabled={images.length < MIN_IMAGES || isUploading}
          className="flex-1 px-6 py-3 text-lg font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          title={
            images.length < MIN_IMAGES
              ? `Need ${MIN_IMAGES - images.length} more images`
              : "Click to upload"
          }
        >
          {isUploading ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Uploading...
            </>
          ) : (
            `Upload ${images.length} image${images.length > 1 ? "s" : ""} ${
              images.length < MIN_IMAGES
                ? `(need ${MIN_IMAGES - images.length} more)`
                : ""
            }`
          )}
        </button>

        {images.length > 0 && (
          <button
            onClick={() => {
              images.forEach((img: ImagePreview) =>
                URL.revokeObjectURL(img.preview)
              );
              setImages([]);
              setError("");
            }}
            disabled={isUploading}
            className="px-6 py-3 text-lg font-semibold text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Upload high-quality images to attract buyers</li>
          <li>First image will be the main image shown in listings</li>
          <li>Drag images to reorder display sequence</li>
          <li>
            Recommended angles: front, rear, sides, interior, dashboard, engine
          </li>
        </ul>
      </div>
    </div>
  );
}
