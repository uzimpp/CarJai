"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useComparison } from "@/contexts/ComparisonContext";

export default function ComparisonBar() {
  const router = useRouter();
  const { comparedCars, removeFromComparison, clearComparison } =
    useComparison();

  if (comparedCars.length === 0) {
    return null;
  }

  const handleCompare = () => {
    router.push("/compare");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-[1536px] mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Selected Cars */}
          <div className="flex items-center gap-3 flex-1 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 whitespace-nowrap">
              <svg
                className="w-5 h-5 text-maroon"
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
              <span>Comparing ({comparedCars.length}/4)</span>
            </div>

            <div className="flex items-center gap-2 flex-1 overflow-x-auto pb-1">
              {comparedCars.map((car) => (
                <div
                  key={car.id}
                  className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 min-w-[200px] flex-shrink-0"
                >
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                    {car.thumbnailUrl ? (
                      <Image
                        src={car.thumbnailUrl}
                        alt={`${car.brandName} ${car.modelName}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-2xl">
                        🚗
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {car.brandName} {car.modelName}
                    </p>
                    <p className="text-xs text-maroon font-semibold">
                      ฿{car.price?.toLocaleString() || "N/A"}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromComparison(car.id)}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
                    aria-label="Remove from comparison"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
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
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={clearComparison}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={handleCompare}
              disabled={comparedCars.length < 2}
              className="px-6 py-2 text-sm font-medium text-white bg-maroon hover:bg-red rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Compare {comparedCars.length} Cars</span>
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
