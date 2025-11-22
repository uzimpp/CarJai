"use client";

import Image from "next/image";
import Link from "next/link";
import { CarListing } from "@/types/car";
import { useCallback, memo } from "react";
import FavoriteButton from "./FavoriteButton";
import { useComparison } from "@/contexts/ComparisonContext";

export interface CarCardProps {
  car: CarListing;
  variant?: "browse" | "listing" | "seller"; // listing: for seller dashboard minimal; browse: for buyers; seller: seller public profile
  onDelete?: (id: number) => void;
  onPublish?: (id: number) => void;
  onUnpublish?: (id: number) => void;
  showActions?: boolean; // when true, show publish/unpublish/delete actions
  showFavorite?: boolean; // when true, show favorite button for buyers
  isFavorited?: boolean; // whether this car is favorited by current user
  onFavoriteToggle?: (carId: number, isFavorited: boolean) => void; // callback when favorite is toggled
  showCompare?: boolean; // when true, show compare button for buyers
}

function CarCard({
  car,
  variant = "browse",
  onDelete,
  onPublish,
  onUnpublish,
  showActions = false,
  showFavorite = false,
  isFavorited = false,
  onFavoriteToggle,
  showCompare = false,
}: CarCardProps) {
  const { addToComparison, removeFromComparison, isInComparison, canAddMore } =
    useComparison();
  const isCompared = isInComparison(car.id);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!onDelete) return;
      if (confirm("Delete this listing?")) onDelete(car.id);
    },
    [car.id, onDelete]
  );

  const handleCompareToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isCompared) {
        removeFromComparison(car.id);
      } else {
        if (!canAddMore) {
          alert(
            `You can compare up to 4 cars. Please remove a car from comparison first.`
          );
          return;
        }
        addToComparison(car);
      }
    },
    [car, isCompared, canAddMore, addToComparison, removeFromComparison]
  );

  const isActive = car.status === "active";

  // Calculate average mileage per year
  const getAvgMileagePerYear = () => {
    if (!car.year || !car.mileage || car.mileage <= 0) return 0;
    const currentYear = new Date().getFullYear();
    const carAge = currentYear - car.year;
    if (carAge <= 0) return 0;
    return Math.round(car.mileage / carAge);
  };

  const avgMileagePerYear = getAvgMileagePerYear();

  return (
    <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <Link href={`/car/${car.id}`}>
        <div className="relative h-48 bg-gray-200">
          {car.thumbnailUrl ? (
            <Image
              src={car.thumbnailUrl}
              alt={`${car.brandName || "Unknown"} ${car.modelName || "Model"}`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.4}
                  d="M3 8L5.72187 10.2682C5.90158 10.418 6.12811 10.5 6.36205 10.5H17.6379C17.8719 10.5 18.0984 10.418 18.2781 10.2682L21 8M6.5 14H6.51M17.5 14H17.51M8.16065 4.5H15.8394C16.5571 4.5 17.2198 4.88457 17.5758 5.50772L20.473 10.5777C20.8183 11.1821 21 11.8661 21 12.5623V18.5C21 19.0523 20.5523 19.5 20 19.5H19C18.4477 19.5 18 19.0523 18 18.5V17.5H6V18.5C6 19.0523 5.55228 19.5 5 19.5H4C3.44772 19.5 3 19.0523 3 18.5V12.5623C3 11.8661 3.18166 11.1821 3.52703 10.5777L6.42416 5.50772C6.78024 4.88457 7.44293 4.5 8.16065 4.5ZM7 14C7 14.2761 6.77614 14.5 6.5 14.5C6.22386 14.5 6 14.2761 6 14C6 13.7239 6.22386 13.5 6.5 13.5C6.77614 13.5 7 13.7239 7 14ZM18 14C18 14.2761 17.7761 14.5 17.5 14.5C17.2239 14.5 17 14.2761 17 14C17 13.7239 17.2239 13.5 17.5 13.5C17.7761 13.5 18 13.7239 18 14Z"
                />
              </svg>
            </div>
          )}

          {/* Status badge (only visible to seller) */}
          {showActions && (
            <div className="absolute top-(--space-s) left-(--space-s)">
              <span
                className={`px-(--space-s) py-(--space-xs) rounded-full text--1 bold shadow-md ${
                  isActive
                    ? "bg-green-600 text-white"
                    : "bg-orange-500 text-white"
                }`}
              >
                {isActive ? "Listed" : car.status?.toUpperCase?.() || "DRAFT"}
              </span>
            </div>
          )}

          {/* Favorite button (top-right for buyers) */}
          {showFavorite && (
            <div className="absolute top-(--space-s) right-(--space-s)">
              <FavoriteButton
                carId={car.id}
                isFavorited={isFavorited}
                onToggle={onFavoriteToggle}
              />
            </div>
          )}

          {/* Compare button (top-right, below favorite if both exist) */}
          {showCompare && (
            <button
              onClick={handleCompareToggle}
              className={`absolute ${
                showFavorite ? "top-16" : "top-(--space-s)"
              } right-(--space-s) w-9 h-9 rounded-full ${
                isCompared
                  ? "bg-maroon text-white"
                  : "bg-white/90 hover:bg-white text-gray-700 hover:text-maroon"
              } flex items-center justify-center shadow-md transition-all`}
              aria-label={
                isCompared ? "Remove from comparison" : "Add to comparison"
              }
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.6}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </button>
          )}

          {/* Delete icon (top-right, positioned below favorite/compare if they exist) */}
          {showActions && onDelete && (
            <button
              aria-label="Delete"
              onClick={handleDelete}
              className={`absolute ${
                showFavorite || showCompare ? "top-16" : "top-(--space-s)"
              } right-(--space-s) w-9 h-9 rounded-full bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center shadow-md transition-colors z-10`}
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

        <div className="p-(--space-xs-s)">
          <div className="flex flex-col gap-(--space-2xs) mb-(--space-s)">
            <h3 className="text-0 bold text-gray-900 line-height-1">
              {car.brandName || "Unknown"} {car.modelName || "Model"}{" "}
              {car.submodelName || ""} {car.year || ""}
            </h3>
            <div className="text-0 bold text-maroon whitespace-nowrap">
              ฿ {car.price ? car.price.toLocaleString() : "0"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-(--space-xs) text--1 text-gray-600 mb-(--space-m)">
            <div className="flex flex-col">
              <div className="text--1 bold text-gray-600">
                {car.mileage != null && car.mileage > 0
                  ? car.mileage.toLocaleString()
                  : "0"}{" "}
                km
              </div>
              <span className="text--1 text-gray-500">
                {" "}
                avg {avgMileagePerYear.toLocaleString()} km/yr
              </span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${
                      star <= (car.conditionRating || 0)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Link>
      {/* Actions */}
      {showActions ? (
        <div className="flex gap-(--space-xs) p-(--space-s) border-t border-gray-100">
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
        </div>
      ) : null}
    </div>
  );
}

export default memo(CarCard);
