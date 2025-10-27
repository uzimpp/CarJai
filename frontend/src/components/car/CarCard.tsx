"use client";

import Image from "next/image";
import Link from "next/link";
import { CarListing } from "@/types/Car";
import { useCallback } from "react";

export interface CarCardProps {
  car: CarListing;
  variant?: "browse" | "listing" | "seller"; // listing: for seller dashboard minimal; browse: for buyers; seller: seller public profile
  onDelete?: (id: number) => void;
  onPublish?: (id: number) => void;
  onUnpublish?: (id: number) => void;
  showActions?: boolean; // when true, show publish/unpublish/delete actions
}

export default function CarCard({
  car,
  variant = "browse",
  onDelete,
  onPublish,
  onUnpublish,
  showActions = false,
}: CarCardProps) {
  const handleDelete = useCallback(() => {
    if (!onDelete) return;
    if (confirm("Delete this listing?")) onDelete(car.id);
  }, [car.id, onDelete]);

  const isActive = car.status === "active";

  return (
    <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
        {car.images && car.images.length > 0 ? (
          <Image
            src={`/api/cars/images/${car.images[0].id}`}
            alt={`${car.brandName || "Unknown"} ${car.modelName || "Model"}`}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-6xl">🚗</span>
          </div>
        )}

        {/* Status badge (always visible) */}
        <div className="absolute top-(--space-s) left-(--space-s)">
          <span
            className={`px-(--space-s) py-(--space-xs) rounded-full text--1 bold shadow-md ${
              isActive ? "bg-green-600 text-white" : "bg-orange-500 text-white"
            }`}
          >
            {isActive ? "Listed" : car.status?.toUpperCase?.() || "DRAFT"}
          </span>
        </div>

        {/* Delete icon (top-right) */}
        {showActions && onDelete && (
          <button
            aria-label="Delete"
            onClick={handleDelete}
            className="absolute top-(--space-s) right-(--space-s) w-9 h-9 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center shadow-md"
          >
            {/* trash icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M9 3.75A2.25 2.25 0 0 1 11.25 1.5h1.5A2.25 2.25 0 0 1 15 3.75V4.5h4.5a.75.75 0 0 1 0 1.5h-.651l-1.077 12.923A3.75 3.75 0 0 1 14.03 22.5H9.97a3.75 3.75 0 0 1-3.742-3.577L5.15 6H4.5a.75.75 0 0 1 0-1.5H9V3.75Zm1.5.75h3V3.75a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75V4.5ZM6.65 6l1.062 12.74A2.25 2.25 0 0 0 9.97 21h4.06a2.25 2.25 0 0 0 2.257-2.26L17.35 6H6.65ZM9.75 9a.75.75 0 0 1 .75.75V18a.75.75 0 0 1-1.5 0V9.75A.75.75 0 0 1 9.75 9Zm4.5 0a.75.75 0 0 1 .75.75V18a.75.75 0 0 1-1.5 0V9.75a.75.75 0 0 1 .75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="p-(--space-m)">
        <div className="flex items-start justify-between gap-(--space-s) mb-(--space-s)">
          <h3 className="text-2 bold text-gray-900 line-height-11">
            {car.brandName || "Unknown"} {car.modelName || "Model"}
          </h3>
          <div className="text-2 bold text-maroon whitespace-nowrap">
            ฿{car.price ? car.price.toLocaleString() : "0"}
          </div>
        </div>

        {/* Minimal meta for listing/seller; richer meta for browse */}
        {variant === "browse" ? (
          <div className="grid grid-cols-2 gap-(--space-xs) text--1 text-gray-600 mb-(--space-m)">
            {car.year && <div>Year: {car.year}</div>}
            {car.mileage != null && car.mileage > 0 && (
              <div>Mileage: {car.mileage.toLocaleString()} km</div>
            )}
            {car.bodyType && <div>Type: {car.bodyType}</div>}
            {car.transmission && <div>Gear: {car.transmission}</div>}
          </div>
        ) : (
          <div className="flex flex-wrap gap-(--space-s) text--1 text-gray-600 mb-(--space-m)">
            {car.year && <span>📅 {car.year}</span>}
            {car.mileage != null && car.mileage > 0 && (
              <span>🛣️ {car.mileage.toLocaleString()} km</span>
            )}
            {car.provinceId && <span>📍 Province #{car.provinceId}</span>}
          </div>
        )}

        {/* Actions */}
        {showActions ? (
          <div className="flex gap-(--space-xs) pt-(--space-s) border-t border-gray-100">
            {isActive
              ? onUnpublish && (
                  <button
                    onClick={() => onUnpublish(car.id)}
                    className="flex-1 px-(--space-s) py-(--space-xs) text-orange-700 bg-orange-100 rounded-xl hover:bg-orange-200 transition-all medium text--1"
                  >
                    Unpublish
                  </button>
                )
              : onPublish && (
                  <button
                    onClick={() => onPublish(car.id)}
                    className="flex-1 px-(--space-s) py-(--space-xs) text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:shadow-md transition-all medium text--1"
                  >
                    Publish
                  </button>
                )}
            <Link
              href={`/sell/${car.id}`}
              className="flex-1 px-(--space-s) py-(--space-xs) text-gray-800 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all medium text--1 text-center"
            >
              Edit
            </Link>
            <Link
              href={`/car/${car.id}`}
              className="flex-1 px-(--space-s) py-(--space-xs) text-blue-700 bg-blue-100 rounded-xl hover:bg-blue-200 transition-all medium text--1 text-center"
            >
              View
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
