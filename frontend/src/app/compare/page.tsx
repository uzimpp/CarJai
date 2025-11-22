"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useComparison } from "@/contexts/ComparisonContext";
import { CarListing, Car, ImageMetadata, InspectionData } from "@/types/car";
import { carsAPI } from "@/lib/carsAPI";

interface CarComparisonData {
  car: Car | null;
  isLoading: boolean;
  error: string | null;
}

function ComparisonRow({
  values,
}: {
  values: (string | number | null | undefined)[];
}) {
  return (
    <div className="py-3 border-b border-gray-100">
      {/* Grid: 3 columns for the 3 cars */}
      <div className="grid grid-cols-3 gap-4">
        {/* Car values */}
        {values.map((value, idx) => (
          <div key={idx} className="text-sm text-gray-900">
            {value != null ? String(value) : "—"}
          </div>
        ))}
      </div>
    </div>
  );
}

function InspectionRow({ values }: { values: (boolean | null | undefined)[] }) {
  const renderValue = (value: boolean | null | undefined) => {
    if (value === null || value === undefined) return "—";
    return (
      <span
        className={`inline-flex items-center gap-1 ${
          value ? "text-green-600" : "text-red-600"
        }`}
      >
        {value ? (
          <>
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            Pass
          </>
        ) : (
          <>
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
            Fail
          </>
        )}
      </span>
    );
  };

  return (
    <div className="py-3 border-b border-gray-100">
      {/* Grid: 3 columns for the 3 cars */}
      <div className="grid grid-cols-3 gap-4 min-w-[450px]">
        {/* Car values */}
        {values.map((value, idx) => (
          <div key={idx} className="min-w-[150px]">
            {renderValue(value)}
          </div>
        ))}
      </div>
    </div>
  );
}

function CarImageNavigator({
  car,
  carData,
  onRemove,
}: {
  car: CarListing;
  carData: Car | null;
  onRemove: () => void;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images: ImageMetadata[] = carData?.images || [];
  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentImageIndex] || images[0];
  const imageUrl = currentImage?.url || car.thumbnailUrl;

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1
      );
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMultipleImages) {
      handleNext(e);
    }
  };

  return (
    <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden group">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${car.brandName} ${car.modelName}`}
          fill
          className="object-cover cursor-pointer"
          unoptimized
          onClick={handleImageClick}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-6xl">
          🚗
        </div>
      )}

      {/* Navigation Buttons */}
      {hasMultipleImages && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous image"
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
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next image"
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
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            {currentImageIndex + 1} / {images.length}
          </div>
        </>
      )}

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow-md transition-colors z-10"
        aria-label="Remove from comparison"
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
    </div>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const { comparedCars, clearComparison, removeFromComparison } =
    useComparison();
  const [carsData, setCarsData] = useState<CarComparisonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (comparedCars.length < 2) {
      router.push("/browse");
    }
  }, [comparedCars.length, router]);

  useEffect(() => {
    const fetchAllCars = async () => {
      setIsLoading(true);
      try {
        const promises = comparedCars.map(async (car) => {
          try {
            const response = await carsAPI.getById(car.id);
            return {
              car: response.success ? response.data : null,
              isLoading: false,
              error: response.success ? null : "Failed to load",
            } as CarComparisonData;
          } catch (error) {
            return {
              car: null,
              isLoading: false,
              error: "Failed to load",
            } as CarComparisonData;
          }
        });

        const results = await Promise.all(promises);
        setCarsData(results);
      } catch {
        console.error("Error fetching car data");
      } finally {
        setIsLoading(false);
      }
    };

    if (comparedCars.length >= 2) {
      fetchAllCars();
    }
  }, [comparedCars]);

  if (comparedCars.length < 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Not Enough Cars to Compare
          </h1>
          <p className="text-gray-600 mb-4">
            Please select at least 2 cars to compare.
          </p>
          <Link
            href="/browse"
            className="inline-block px-6 py-2 text-white bg-maroon hover:bg-red rounded-lg transition-colors"
          >
            Browse Cars
          </Link>
        </div>
      </div>
    );
  }

  // Inspection fields mapping
  const inspectionFields = [
    { key: "brakeResult", label: "Brake System" },
    { key: "handbrakeResult", label: "Handbrake" },
    { key: "alignmentResult", label: "Wheel Alignment" },
    { key: "noiseResult", label: "Noise Level" },
    { key: "emissionResult", label: "Emission" },
    { key: "hornResult", label: "Horn" },
    { key: "speedometerResult", label: "Speedometer" },
    { key: "highLowBeamResult", label: "Headlights" },
    { key: "signalLightsResult", label: "Signal Lights" },
    { key: "otherLightsResult", label: "Other Lights" },
    { key: "windshieldResult", label: "Windshield" },
    { key: "steeringResult", label: "Steering" },
    { key: "wheelsTiresResult", label: "Wheels & Tires" },
    { key: "fuelTankResult", label: "Fuel Tank" },
    { key: "chassisResult", label: "Chassis" },
    { key: "bodyResult", label: "Body" },
    { key: "doorsFloorResult", label: "Doors & Floor" },
    { key: "seatbeltResult", label: "Seatbelts" },
    { key: "wiperResult", label: "Wipers" },
  ];

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="flex text-center text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Compare Cars
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Side-by-side comparison of {comparedCars.length} cars
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={clearComparison}
            className="px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear All
          </button>
          <Link
            href="/browse"
            className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-white bg-maroon hover:bg-red rounded-lg transition-colors"
          >
            Add More Cars
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto mb-4"></div>
            <p className="text-gray-600">Loading car details...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
            {/* Car Images Row */}
            <div className="p-4 md:p-6 bg-gray-50 border-b-2 border-gray-200">
              {/* Grid: 3 columns for the 3 cars */}
              <div className="grid grid-cols-3 gap-4">
                {/* Car images */}
                {comparedCars.map((car, idx) => {
                  const carData = carsData[idx]?.car;
                  return (
                    <div key={car.id} className="space-y-2 min-w-[56px]">
                      <CarImageNavigator
                        car={car}
                        carData={carData}
                        onRemove={() => removeFromComparison(car.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparison Sections */}
            <div className="p-4 md:p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Basic Information
                </h2>
                <div className="space-y-0">
                  <ComparisonRow
                    values={comparedCars.map((car) =>
                      car.price ? `฿${car.price.toLocaleString()}` : null
                    )}
                  />
                  <ComparisonRow
                    values={comparedCars.map(
                      (car) =>
                        [car.brandName, car.modelName, car.submodelName]
                          .filter(Boolean)
                          .join(" ") || null
                    )}
                  />
                  <ComparisonRow values={comparedCars.map((car) => car.year)} />
                  <ComparisonRow
                    values={comparedCars.map((car) =>
                      car.mileage ? `${car.mileage.toLocaleString()} km` : null
                    )}
                  />
                  <ComparisonRow
                    values={comparedCars.map((car) =>
                      car.conditionRating ? `${car.conditionRating}/5` : null
                    )}
                  />
                  {carsData.some((d) => d.car?.car?.description) && (
                    <div className="py-3 border-b border-gray-100">
                      {/* Grid: 3 columns for the 3 cars */}
                      <div className="grid grid-cols-3 gap-4 min-w-[450px]">
                        {/* Car descriptions */}
                        {carsData.map((d, idx) => (
                          <div
                            key={idx}
                            className="text-sm text-gray-900 whitespace-pre-wrap min-w-[150px]"
                          >
                            {d.car?.car?.description || "—"}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  Specifications
                </h2>
                <div className="space-y-0">
                  <ComparisonRow
                    values={comparedCars.map((car) => car.bodyType)}
                  />
                  <ComparisonRow
                    values={comparedCars.map((car) => car.transmission)}
                  />
                  <ComparisonRow
                    values={comparedCars.map((car) => car.drivetrain)}
                  />
                  <ComparisonRow
                    values={comparedCars.map((car) =>
                      car.fuelTypes && car.fuelTypes.length > 0
                        ? car.fuelTypes.join(", ")
                        : null
                    )}
                  />
                  <ComparisonRow
                    values={comparedCars.map((car) =>
                      car.colors && car.colors.length > 0
                        ? car.colors.join(", ")
                        : null
                    )}
                  />
                  {carsData.some((d) => d.car?.car?.seats) && (
                    <ComparisonRow
                      values={carsData.map((d) => d.car?.car?.seats)}
                    />
                  )}
                  {carsData.some((d) => d.car?.car?.doors) && (
                    <ComparisonRow
                      values={carsData.map((d) => d.car?.car?.doors)}
                    />
                  )}
                  {carsData.some((d) => d.car?.car?.engineCc) && (
                    <ComparisonRow
                      values={carsData.map((d) =>
                        d.car?.car?.engineCc
                          ? `${d.car.car.engineCc.toLocaleString()} cc`
                          : null
                      )}
                    />
                  )}
                  {carsData.some((d) => d.car?.car?.licensePlate) && (
                    <ComparisonRow
                      values={carsData.map((d) =>
                        d.car?.car?.licensePlate
                          ? `${d.car.car.prefix || ""} ${
                              d.car.car.number || ""
                            } ${d.car.car.province || ""}`.trim()
                          : null
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Inspection Data */}
              {carsData.some((d) => d.car?.inspection) && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Inspection Results
                  </h2>
                  <div className="space-y-0">
                    <ComparisonRow
                      values={carsData.map(
                        (d) => d.car?.inspection?.station || null
                      )}
                    />
                    <InspectionRow
                      values={carsData.map(
                        (d) => d.car?.inspection?.overallPass
                      )}
                    />
                    {inspectionFields.map((field) => (
                      <InspectionRow
                        key={field.key}
                        values={carsData.map(
                          (d) =>
                            d.car?.inspection?.[
                              field.key as keyof InspectionData
                            ] as boolean | null | undefined
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Details */}
              {carsData.some(
                (d) =>
                  d.car?.car?.isFlooded !== undefined ||
                  d.car?.car?.isHeavilyDamaged !== undefined
              ) && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Additional Details
                  </h2>
                  <div className="space-y-0">
                    <ComparisonRow
                      values={carsData.map((d) =>
                        d.car?.car?.isFlooded !== undefined
                          ? d.car.car.isFlooded
                            ? "Yes"
                            : "No"
                          : null
                      )}
                    />
                    <ComparisonRow
                      values={carsData.map((d) =>
                        d.car?.car?.isHeavilyDamaged !== undefined
                          ? d.car.car.isHeavilyDamaged
                            ? "Yes"
                            : "No"
                          : null
                      )}
                    />
                  </div>
                </div>
              )}

              {/* View Details Links */}
              <div className="pt-4 border-t border-gray-200">
                {/* Grid: 3 columns for the 3 cars */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Action buttons */}
                  {comparedCars.map((car) => (
                    <Link
                      key={car.id}
                      href={`/car/${car.id}`}
                      className="inline-block px-4 py-2 text-sm font-medium text-center text-white bg-maroon hover:bg-red rounded-lg transition-colors"
                    >
                      View
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
