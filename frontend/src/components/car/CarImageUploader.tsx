"use client";

import { useState, useRef, DragEvent, useEffect } from "react";
import Image from "next/image";
import { carsAPI } from "@/lib/carsAPI";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { MIN_IMAGES, MAX_IMAGES } from "@/constants/car";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

interface ImagePreview {
  file: File | null;
  preview: string;
  order: number;
  status: "uploading" | "uploaded" | "failed";
  serverId?: number;
  error?: string;
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
  const [, setIsUploading] = useState(false); // reserved for future disable states
  const [error, setError] = useState("");
  const [, setDragActive] = useState(false); // used to style dropzone
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draggedIndexRef = useRef<number | null>(null);

  // Load existing images on mount
  useEffect(() => {
    const loadExistingImages = async () => {
      try {
        const result = await carsAPI.restoreProgress(carId);
        if (result.success && result.data.images) {
          const existingImages: ImagePreview[] = result.data.images
            .slice()
            .sort(
              (a: { displayOrder?: number }, b: { displayOrder?: number }) =>
                (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
            )
            .map((img: { id: number; displayOrder: number }) => ({
              file: null,
              preview: `/api/cars/images/${img.id}`, // Backend image URL
              order: img.displayOrder,
              status: "uploaded" as const,
              serverId: img.id,
            }));
          setImages(existingImages);
          if (onUploadComplete) {
            onUploadComplete();
          }
        }
      } catch {
        // Silent fail - user can still add new images
      }
    };

    if (carId) {
      loadExistingImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    setError("");
    const fileArray = Array.from(files);
    const newImages: ImagePreview[] = [];

    // Check if adding these files would exceed max
    if (images.length + fileArray.length > MAX_IMAGES) {
      setError(
        `Maximum ${MAX_IMAGES} images allowed (currently have ${images.length})`
      );
      return;
    }

    // Validate files and create previews
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
        status: "uploading",
      });
    }

    if (newImages.length === 0) return;

    // Add to UI immediately
    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);

    // Upload immediately
    setIsUploading(true);

    try {
      const filesToUpload = newImages
        .filter((img) => img.file)
        .map((img) => img.file!);

      const result = await carsAPI.uploadImages(carId, filesToUpload);

      if (result.success && result.data) {
        // Update images with server IDs and success status
        const updatedImagesWithIds = updatedImages.map((img) => {
          const matchIdx = newImages.findIndex((ni) => ni.file === img.file);
          if (matchIdx !== -1) {
            const uploadedImg = result.data!.images[matchIdx];
            if (uploadedImg) {
              return {
                ...img,
                status: "uploaded" as const,
                serverId: uploadedImg.id,
                preview: `/api/cars/images/${uploadedImg.id}`,
              };
            }
            return {
              ...img,
              status: "failed" as const,
              error: "Upload failed",
            };
          }
          return img;
        });

        setImages(updatedImagesWithIds);

        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        // Mark all new images as failed
        const failedImages = updatedImages.map((img) => {
          if (newImages.some((ni) => ni.file === img.file)) {
            return {
              ...img,
              status: "failed" as const,
              error: result.message || "Upload failed",
            };
          }
          return img;
        });
        setImages(failedImages);
        setError(result.message || "Upload error occurred");
      }
    } catch (err) {
      // Mark all new images as failed
      const failedExceptionImages = updatedImages.map((img) => {
        if (newImages.some((ni) => ni.file === img.file)) {
          return {
            ...img,
            status: "failed" as const,
            error: err instanceof Error ? err.message : "Upload error occurred",
          };
        }
        return img;
      });
      setImages(failedExceptionImages);
      setError(err instanceof Error ? err.message : "Upload error occurred");
    } finally {
      setIsUploading(false);
    }
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

  // handleFileChange unused but kept for future direct file input usage
  // const handleFileChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
  //   handleFiles(_e.target.files);
  // };

  const removeImage = async (index: number) => {
    const imageToRemove = images[index];

    // Optimistically remove from UI
    const newImages = images.filter((_, i) => i !== index);
    newImages.forEach((img, i) => {
      img.order = i;
    });
    setImages(newImages);
    URL.revokeObjectURL(imageToRemove.preview);

    // Delete from backend if uploaded
    if (imageToRemove.serverId && imageToRemove.status === "uploaded") {
      try {
        await carsAPI.deleteImage(imageToRemove.serverId);
      } catch {
        setError("Failed to remove image");
        // Could restore the image here if needed
      }
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
    draggedIndexRef.current = index;
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();

    const currentDraggedIndex = draggedIndexRef.current;
    if (currentDraggedIndex === null || currentDraggedIndex === index) {
      return;
    }

    // Update images using functional update to get latest state
    setImages((prevImages) => {
      const newImages = [...prevImages];
      const draggedImage = newImages[currentDraggedIndex];
      newImages.splice(currentDraggedIndex, 1);
      newImages.splice(index, 0, draggedImage);

      // Update order
      newImages.forEach((img, i) => {
        img.order = i;
      });

      return newImages;
    });

    // Update both state and ref
    setDraggedIndex(index);
    draggedIndexRef.current = index;
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    draggedIndexRef.current = null;

    // Use functional update to get latest images state
    setImages((prevImages) => {
      // Save new order to backend if all images are uploaded
      const allUploaded = prevImages.every(
        (img) => img.status === "uploaded" && img.serverId
      );

      if (allUploaded && prevImages.length > 0) {
        const imageIds = prevImages.map((img) => img.serverId!);

        // Call API asynchronously
        carsAPI.reorderImages(carId, imageIds).catch(() => {
          setError("Failed to save image order");
        });
      }

      return prevImages;
    });
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className="w-full max-w-6xl pb-4 space-y-6"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      {/* Error Message */}
      {error && <InlineAlert type="error">{error}</InlineAlert>}

      {/* Image Previews with Reorder */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Images ({images.length}/{MAX_IMAGES})
            </h3>
            {images.length < MIN_IMAGES && (
              <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                ⚠️ Need {MIN_IMAGES - images.length} more
              </span>
            )}
            {images.length >= MIN_IMAGES &&
              images.every((img) => img.status === "uploaded") && (
                <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  ✓ All images saved
                </span>
              )}
            {images.some((img) => img.status === "uploading") && (
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                ⏳ Uploading...
              </span>
            )}
            {/* Add More tile trigger (desktop) */}
          </div>
        </div>
      )}
      {/* Grid with Add More tile */}
      <p className="text-sm text-gray-600 mb-4">
        💡 Images are saved automatically. Drag to reorder (first image will be
        the main image)
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img: ImagePreview, index: number) => (
          <div
            key={img.serverId || `temp-${img.preview}-${index}`}
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
            {/* {img.status === "uploading" && (
              <div className="absolute top-2 right-12 z-10 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                ⏳
              </div>
            )} */}
            {/* 
            {img.status === "uploaded" && (
              <div className="absolute top-2 right-12 z-10 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                ✓
              </div>
            )}
            {img.status === "failed" && (
              <div className="absolute top-2 right-12 z-10 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                ✗
              </div>
            )} */}
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
            <Image
              src={img.preview}
              alt={`Preview ${index + 1}`}
              className="w-full h-48 object-cover"
              width={300}
              height={192}
              unoptimized
            />
            {/* File Info */}
            {img.file && (
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
            )}
          </div>
        ))}
        {/* Add more tile */}
        <button
          type="button"
          onClick={() => {
            console.log("Add more clicked");
            fileInputRef.current?.click();
          }}
          className="flex items-center justify-center aspect-square border-2 border-dashed rounded-lg text-gray-400 hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer"
          title="Add more images"
        >
          <svg
            className="w-10 h-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.3}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      <p className="text-sm text-gray-500">Supports JPEG, PNG, WebP, GIF</p>
    </div>
  );
}
