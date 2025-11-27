"use client";

import Image from "next/image";
import Link from "next/link";
import { CarListing } from "@/types/car";
import { useCallback, memo } from "react";
import FavoriteButton from "./FavoriteButton";
import { useComparison } from "@/contexts/ComparisonContext";

export interface CarCardProps {
  car: CarListing;
  variant?: "browse" | "listing";
  // Buyer features (for browse variant)
  favorite?: {
    isFavorited: boolean;
    onToggle: (carId: number, isFavorited: boolean) => void;
  };
  // Seller features (for listing variant)
  actions?: {
    onDelete?: (id: number) => void;
    onPublish?: (id: number) => void;
    onUnpublish?: (id: number) => void;
    onMarkAsSold?: (id: number) => void;
  };
}

function CarCard({ car, variant = "browse", favorite, actions }: CarCardProps) {
  const { addToComparison, removeFromComparison, isInComparison, canAddMore } =
    useComparison();
  const isCompared = isInComparison(car.id);

  const handleCompareToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isCompared) {
        removeFromComparison(car.id);
      } else {
        if (!canAddMore) {
          alert(
            `You can compare up to 3 cars. Please remove a car from comparison first.`
          );
          return;
        }
        addToComparison(car);
      }
    },
    [car, isCompared, canAddMore, addToComparison, removeFromComparison]
  );

  const isActive = car.status === "active";
  const isDraft = car.status === "draft";
  const isSold = car.status === "sold";

  // Get status badge styling
  const getStatusBadgeStyle = () => {
    if (isActive) {
      return "bg-green-600 text-white";
    } else if (isSold) {
      return "bg-blue-600 text-white";
    } else if (isDraft) {
      return "bg-orange-500 text-white";
    }
    return "bg-gray-500 text-white";
  };

  const getStatusLabel = () => {
    if (isActive) return "Listed";
    if (isSold) return "Sold";
    if (isDraft) return "Draft";
    return car.status?.toUpperCase() || "DRAFT";
  };

  // Calculate average mileage per year
  const getAvgMileagePerYear = () => {
    if (!car.year || !car.mileage || car.mileage <= 0) return 0;
    const currentYear = new Date().getFullYear();
    const carAge = currentYear + 1 - car.year;
    if (carAge <= 0) return 0;
    return Math.round(car.mileage / carAge);
  };

  const avgMileagePerYear = getAvgMileagePerYear();

  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full min-w-60">
      <Link href={`/car/${car.id}`} className="flex flex-col flex-1 min-h-0">
        {/* Image section with consistent aspect ratio */}
        <div className="relative w-full aspect-[4/3] bg-gray-200 overflow-hidden">
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

          {/* Top left: Status badge (only visible to seller) */}
          {variant === "listing" && actions && (
            <div className="absolute top-(--space-s) left-(--space-s) z-20">
              <span
                className={`px-(--space-s) py-(--space-xs) rounded-full text--1 bold shadow-md ${getStatusBadgeStyle()}`}
              >
                {getStatusLabel()}
              </span>
            </div>
          )}
        </div>

        {/* Content section with consistent min-heights */}
        <div className="flex flex-col flex-1 p-(--space-xs-s) gap-(--space-xs-s) min-h-0">
          <div className="flex flex-col flex-1 min-h-[100px]">
            {/* Car name and year section */}
            <div className="flex flex-col gap-1 min-h-[60px]">
              <h3 className="text-0 bold text-gray-900 line-height-1 line-clamp-2">
                {car.brandName || "-"} {car.modelName || "N/A"}{" "}
                {car.submodelName || "N/A"}
              </h3>
              <p className="text-0 text-grey/60 medium line-height-1">
                {car.year || "N/A"}
              </p>
            </div>
            {/* Price section with consistent height */}
            <div className="text-1 bold text-maroon whitespace-nowrap flex justify-end mt-1.5 min-h-[32px] items-end">
              <span className="">
                {car.price ? car.price.toLocaleString() : "0"}.-
              </span>
            </div>
          </div>

          {/* Mileage and rating section with consistent height */}
          <div className="grid grid-cols-2 gap-(--space-xs) text--1 text-gray-600 border-y border-gray-200 py-(--space-xs) min-h-[60px]">
            <div className="flex flex-col justify-center">
              <div className="text--1 semi-bold text-gray-600">
                {car.mileage != null && car.mileage > 0
                  ? car.mileage.toLocaleString()
                  : "0"}{" "}
                km
              </div>
              <span className="text--1 text-gray-500">
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
                        : "text-gray-200"
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
      {/* Action buttons section with consistent min-height */}
      <div className="flex items-center justify-start gap-(--space-xs-s) p-(--space-xs-s) pt-0 min-h-[52px]">
        {/* Browse variant: Favorite (only if buyer), Compare (always), Seller Profile (always) */}
        {variant === "browse" && (
          <>
            {/* Favorite button - only shown for buyers */}
            {favorite && (
              <div onClick={(e) => e.preventDefault()}>
                <FavoriteButton
                  carId={car.id}
                  isFavorited={favorite.isFavorited}
                  onToggle={favorite.onToggle}
                />
              </div>
            )}
            {/* Compare button - always shown in browse variant */}
            <button
              onClick={(e) => {
                e.preventDefault();
                handleCompareToggle(e);
              }}
              className={`rounded-full border py-1.5 px-3 text--1 medium gap-(--space-xs-s) flex items-center justify-center transition-all min-h-[36px] ${
                isCompared
                  ? "bg-maroon text-white border-maroon"
                  : "bg-white/90 hover:bg-white text-gray-700 hover:text-maroon border-gray-200"
              }`}
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
                  strokeWidth={1}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              Compare
            </button>
            {/* Seller profile link - always shown in browse variant if sellerId exists */}
            {car.sellerId && (
              <Link
                href={`/seller/${car.sellerId}`}
                onClick={(e) => e.stopPropagation()}
                className="rounded-full border py-1.5 px-3 text--1 medium gap-(--space-xs-s) bg-white/90 hover:bg-white text-gray-700 hover:text-maroon border-gray-200 flex items-center justify-center transition-all min-h-[36px]"
                aria-label="View seller profile"
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
                    strokeWidth={1}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Seller
              </Link>
            )}
          </>
        )}

        {/* Listing variant: Status actions, Edit, Delete */}
        {variant === "listing" && actions && (
          <div className="flex flex-col gap-(--space-2xs-xs) w-full min-h-[120px]">
            {/* Primary action buttons row */}
            <div className="flex gap-(--space-2xs-xs)">
              {/* Publish/Unpublish button */}
              {isActive && actions.onUnpublish ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    actions.onUnpublish!(car.id);
                  }}
                  className="flex-1 px-(--space-s) py-(--space-xs) text-orange-700 bg-orange-100 rounded-xl hover:bg-orange-200 transition-all medium text--1 min-h-[40px] flex items-center justify-center"
                >
                  Unpublish
                </button>
              ) : (
                !isSold &&
                actions.onPublish && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      actions.onPublish!(car.id);
                    }}
                    className="flex-1 px-(--space-s) py-(--space-xs) text-white bg-green-600 rounded-xl hover:shadow-md transition-all medium text--1 min-h-[40px] flex items-center justify-center"
                  >
                    Publish
                  </button>
                )
              )}

              {/* Mark as Sold button - show if active (enabled) or sold (disabled) */}
              {(isActive || isSold) &&
                actions.onMarkAsSold &&
                (isSold ? (
                  <div
                    className="flex-1 px-(--space-s) py-(--space-xs) text-blue-400 bg-blue-50 rounded-xl cursor-not-allowed transition-all medium text--1 text-center flex items-center justify-center min-h-[40px]"
                    title="This listing is already marked as sold"
                  >
                    Already Marked as Sold
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm("Mark this listing as sold?")) {
                        actions.onMarkAsSold!(car.id);
                      }
                    }}
                    className="flex-1 px-(--space-s) py-(--space-xs) text-blue-700 bg-blue-100 rounded-xl hover:bg-blue-200 transition-all medium text--1 min-h-[40px] flex items-center justify-center"
                  >
                    Mark as Sold
                  </button>
                ))}
            </div>

            {/* Secondary actions row */}
            <div className="flex gap-(--space-2xs-xs)">
              {isSold ? (
                <div
                  className="flex-1 px-(--space-s) py-(--space-xs) text-gray-400 bg-gray-50 rounded-xl cursor-not-allowed transition-all medium text--1 text-center flex items-center justify-center min-h-[40px]"
                  title="Cannot edit sold listings"
                >
                  Cannot Edit
                </div>
              ) : (
                <Link
                  href={`/sell/${car.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 px-(--space-s) py-(--space-xs) text-gray-800 bg-gray-200 rounded-xl hover:bg-gray-200 transition-all medium text--1 text-center flex items-center justify-center min-h-[40px]"
                >
                  Edit
                </Link>
              )}
              {actions.onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    actions.onDelete!(car.id);
                  }}
                  className="px-(--space-s) py-(--space-xs) text-red-700 bg-red-100 rounded-xl hover:bg-red-100 transition-all medium text--1 flex items-center justify-center gap-1.5 min-h-[40px]"
                  aria-label="Delete listing"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 3.75A2.25 2.25 0 0 1 11.25 1.5h1.5A2.25 2.25 0 0 1 15 3.75V4.5h4.5a.75.75 0 0 1 0 1.5h-.651l-1.077 12.923A3.75 3.75 0 0 1 14.03 22.5H9.97a3.75 3.75 0 0 1-3.742-3.577L5.15 6H4.5a.75.75 0 0 1 0-1.5H9V3.75Zm1.5.75h3V3.75a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75V4.5ZM6.65 6l1.062 12.74A2.25 2.25 0 0 0 9.97 21h4.06a2.25 2.25 0 0 0 2.257-2.26L17.35 6H6.65ZM9.75 9a.75.75 0 0 1 .75.75V18a.75.75 0 0 1-1.5 0V9.75A.75.75 0 0 1 9.75 9Zm4.5 0a.75.75 0 0 1 .75.75V18a.75.75 0 0 1-1.5 0V9.75a.75.75 0 0 1 .75-.75Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(CarCard);
