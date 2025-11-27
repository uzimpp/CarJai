"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Car, InspectionData } from "@/types/car";
import { SellerContact } from "@/types/user";
import { carsAPI } from "@/lib/carsAPI";
import { useUserAuth } from "@/hooks/useUserAuth";
import { favoritesAPI } from "@/lib/favoritesAPI";
import FavoriteButton from "@/components/car/FavoriteButton";
import ReportModal from "@/components/reports/ReportModal";
import { reportsAPI } from "@/lib/reportsAPI";
import { FlagIcon, StarIcon } from "@heroicons/react/24/outline";
import { DEFAULT_CAR_SUBTOPICS } from "@/types/report";
import { recentAPI } from "@/lib/recentAPI";
import StarRating from "@/components/ui/StarRating";

export default function CarListingPage() {
  const params = useParams();
  const router = useRouter();
  const carId = Number(params.id);
  const { roles, isAuthenticated } = useUserAuth();

  const [car, setCar] = useState<Car | null>(null);
  const [contacts, setContacts] = useState<SellerContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCarIds, setFavoriteCarIds] = useState<Set<number>>(new Set());
  const [isReportCarOpen, setIsReportCarOpen] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string>("");
  const [isCompareChecked, setIsCompareChecked] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const isBuyer = isAuthenticated && roles?.buyer;

  useEffect(() => {
    let mounted = true;
    const fetchCarData = async () => {
      if (!carId || isNaN(carId)) {
        setError("Invalid car ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const carResponse = await carsAPI.getById(carId);
        if (!mounted) return;

        if (carResponse.success) {
          setCar(carResponse.data);
          setContacts(carResponse.data.sellerContacts || []);
        } else {
          setError("Car not found");
        }
      } catch (err) {
        if (mounted) {
          setError("Failed to load car details");
          console.error("Error fetching car:", err);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchCarData();
    return () => {
      mounted = false;
    };
  }, [carId]);

  useEffect(() => {
    if (!car) return;
    try {
      const c = car.car;
      const imgs = car.images || [];
      const first = imgs[0];
      void recentAPI.addRecent(carId, {
        title: [c?.brandName, c?.modelName, c?.submodelName]
          .filter(Boolean)
          .join(" "),
        price: c?.price,
        thumbnailId: first?.id,
        thumbnailUrl:
          first?.url ||
          (first?.id ? `/api/cars/images/${first.id}` : undefined),
      });
    } catch {
      // Ignore non-critical recent view errors
    }
  }, [carId, car]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (isBuyer) {
        try {
          const favorites = await favoritesAPI.getFavorites();
          const favoriteIds = new Set(favorites.map((car) => car.id));
          setFavoriteCarIds(favoriteIds);
          setIsFavorited(favoriteIds.has(carId));
        } catch (error) {
          console.error("Failed to fetch favorites:", error);
        }
      }
    };

    fetchFavorites();
  }, [isBuyer, carId]);

  const handleFavoriteToggle = async (
    carId: number,
    newFavoriteState: boolean
  ) => {
    setIsFavorited(newFavoriteState);
    const newFavoriteCarIds = new Set(favoriteCarIds);
    if (newFavoriteState) {
      newFavoriteCarIds.add(carId);
    } else {
      newFavoriteCarIds.delete(carId);
    }
    setFavoriteCarIds(newFavoriteCarIds);
  };

  const handleSubmitCarReport = async (data: {
    topic: string;
    subTopics: string[];
    description: string;
  }) => {
    setReportFeedback("");
    try {
      const res = await reportsAPI.submitCarReport(carId, data);
      if (res?.success) {
        setReportFeedback("Thanks! Your report has been submitted.");
      }
    } catch (e: unknown) {
      let msg = "Failed to submit car report";
      if (typeof e === "object" && e !== null && "message" in e) {
        const m = (e as { message?: unknown }).message;
        if (typeof m === "string") msg = m;
      } else if (typeof e === "string") {
        msg = e;
      }
      setReportFeedback(msg);
      throw e;
    }
  };

  const getContactIcon = (contactType: string) => {
    const iconClass = "w-5 h-5 text-maroon";
    switch (contactType.toLowerCase()) {
      case "phone":
        return (
          <svg
            className={iconClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        );
      case "line":
        return (
          <svg
            className={iconClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case "facebook":
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
      case "email":
        return (
          <svg
            className={iconClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case "instagram":
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        );
      default:
        return (
          <svg
            className={iconClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        );
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH").format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Fallback mapping for body type codes
  const getBodyTypeLabel = (bodyType: string | undefined): string => {
    if (!bodyType) return "N/A";
    if (bodyType.includes(" ") || bodyType !== bodyType.toUpperCase()) {
      return bodyType;
    }
    const bodyTypeMap: Record<string, string> = {
      CITYCAR: "City Car",
      DAILY: "Daily Use",
      PICKUP: "Pickup",
      SUV: "SUV",
      VAN: "Van",
      SPORTLUX: "Sport / Luxury",
    };
    return bodyTypeMap[bodyType] || bodyType;
  };

  if (isLoading) {
    return (
      <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-maroon mx-auto"></div>
            <p className="mt-4 text-0 text-gray-600 font-medium">
              Loading car details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-3 font-bold text-gray-900 mb-2">
              {error || "Car Not Found"}
            </h2>
            <p className="text-0 text-gray-600 mb-6">
              The car you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <button
              onClick={() => router.back()}
              className="px-(--space-l) py-(--space-s) bg-maroon hover:bg-red text-white font-medium rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const carData = car.car;
  const images = car.images;
  const inspection = car.inspection;

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-(--space-xl)">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-(--space-xl)">
          {/* Image Gallery */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {images && images.length > 0 ? (
              <div className="relative group">
                <div className="aspect-[16/10] relative bg-gray-100">
                  <Image
                    src={
                      images[currentImageIndex]?.url ||
                      "/api/cars/images/" + images[currentImageIndex]?.id
                    }
                    alt={`${carData.brandName} ${carData.modelName}`}
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                  />
                </div>

                {/* Image Navigation Dots */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? "bg-white w-6"
                            : "bg-white/50 hover:bg-white/75"
                        }`}
                        aria-label={`View image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Previous/Next buttons */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          currentImageIndex === 0
                            ? images.length - 1
                            : currentImageIndex - 1
                        )
                      }
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Previous image"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
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
                      onClick={() =>
                        setCurrentImageIndex(
                          currentImageIndex === images.length - 1
                            ? 0
                            : currentImageIndex + 1
                        )
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Next image"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </>
                )}

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="grid grid-cols-6 gap-2 p-4 bg-gray-50 border-t border-gray-200">
                    {images.slice(0, 6).map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex
                            ? "border-maroon ring-2 ring-maroon/20"
                            : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <Image
                          src={img.url || "/api/cars/images/" + img.id}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[16/10] flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-0 text-gray-500">No images available</p>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Specifications */}
          <div className="bg-white rounded-2xl border border-gray-200 p-(--space-xl) shadow-sm">
            <h2 className="text-3 font-bold text-gray-900 mb-(--space-l)">
              Vehicle Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-(--space-m)">
              <div className="space-y-(--space-m)">
                <div>
                  <h3 className="text-1 font-semibold text-gray-900 mb-(--space-s)">
                    Basic Information
                  </h3>
                  <div className="space-y-(--space-s)">
                    {[
                      { label: "Year", value: carData.year || "N/A" },
                      {
                        label: "Body Type",
                        value: getBodyTypeLabel(carData.bodyType),
                      },
                      {
                        label: "Transmission",
                        value: carData.transmission || "N/A",
                      },
                      {
                        label: "Drivetrain",
                        value: carData.drivetrain || "N/A",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between py-2 border-b border-gray-100"
                      >
                        <span className="text-0 text-gray-600">
                          {item.label}:
                        </span>
                        <span className="text-0 font-medium text-gray-900">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-(--space-m)">
                <div>
                  <h3 className="text-1 font-semibold text-gray-900 mb-(--space-s)">
                    Details
                  </h3>
                  <div className="space-y-(--space-s)">
                    {[
                      { label: "Seats", value: carData.seats || "N/A" },
                      { label: "Doors", value: carData.doors || "N/A" },
                      {
                        label: "Engine CC",
                        value: carData.engineCc
                          ? `${formatPrice(carData.engineCc)} cc`
                          : "N/A",
                      },
                      {
                        label: "Fuel Types",
                        value: carData.fuelTypes?.join(", ") || "N/A",
                      },
                      {
                        label: "Colors",
                        value: carData.colors?.join(", ") || "N/A",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between py-2 border-b border-gray-100"
                      >
                        <span className="text-0 text-gray-600">
                          {item.label}:
                        </span>
                        <span className="text-0 font-medium text-gray-900">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inspection Results */}
          {inspection && (
            <div className="bg-white rounded-2xl border border-gray-200 p-(--space-xl) shadow-sm">
              <div className="flex items-center justify-between mb-(--space-l)">
                <h2 className="text-3 font-bold text-gray-900">
                  Vehicle Inspection Results
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-(--space-m) py-(--space-2xs) rounded-full text-0 font-semibold ${
                      inspection.overallPass
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {inspection.overallPass ? "PASSED" : "FAILED"}
                  </span>
                </div>
              </div>
              <p className="text-0 text-gray-600 mb-(--space-l)">
                Inspection Station:{" "}
                <span className="font-medium">{inspection.station}</span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-(--space-s)">
                {[
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
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                  >
                    <span className="text--1 text-gray-600">{label}</span>
                    <span
                      className={`flex-shrink-0 ${
                        inspection[key as keyof InspectionData]
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {inspection[key as keyof InspectionData] ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-(--space-l)">
          {/* Car Title, Price, and Actions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-(--space-m) shadow-sm">
            {/* Header with Share Button */}
            <div className="flex items-start justify-between mb-(--space-m)">
              <div className="flex-1">
                <h1 className="text-3 font-bold text-gray-900 mb-(--space-2xs) line-height-12">
                  {carData.brandName} {carData.modelName} {carData.submodelName}{" "}
                  {carData.year}
                </h1>
                <p className="text--1 text-gray-500">
                  Listed on {formatDate(carData.createdAt)}
                </p>
              </div>
              <button
                onClick={async () => {
                  if (isSharing) return;

                  try {
                    setIsSharing(true);
                    if (navigator.share) {
                      await navigator.share({
                        title: `${carData.brandName} ${carData.modelName}`,
                        text: `Check out this car: ${carData.brandName} ${carData.modelName} ${carData.submodelName}`,
                        url: window.location.href,
                      });
                    } else {
                      await navigator.clipboard.writeText(window.location.href);
                      alert("Link copied to clipboard!");
                    }
                  } catch (error) {
                    // User cancelled or error occurred - silently ignore
                    if (error instanceof Error && error.name !== "AbortError") {
                      console.error("Share error:", error);
                    }
                  } finally {
                    setIsSharing(false);
                  }
                }}
                disabled={isSharing}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Share"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>
            </div>
            {/* Price */}
            <div className="flex items-center justify-end text-4 font-bold text-maroon mb-(--space-m)">
              {formatPrice(carData.price || 0)}.-
            </div>
            {/* Rating */}
            <div className="flex items-center justify-center">
              <StarRating value={carData.conditionRating} onChange={() => {}} />
            </div>
            {/* Mileage */}
            <div className="flex items-center justify-between py-2 border-t border-gray-200 mt-(--space-m)">
              <span className="text-0 text-gray-600">Mileage</span>
              <div className="text-right">
                <div className="text-1 font-semibold text-gray-900">
                  {carData.mileage
                    ? `${formatPrice(carData.mileage)} km`
                    : "N/A"}
                </div>
                {carData.mileage && carData.year && (
                  <div className="text--1 text-gray-500">
                    Avg{" "}
                    {formatPrice(
                      Math.round(carData.mileage / (2025 - carData.year))
                    )}{" "}
                    km/year
                  </div>
                )}
              </div>
            </div>
            {/* License Plate */}
            {(carData.licensePlate || carData.prefix || carData.number) && (
              <div className="mb-(--space-s)">
                <div className="flex items-center gap-2">
                  {carData.prefix && (
                    <span className="text-1 font-bold text-gray-900">
                      {carData.prefix}
                    </span>
                  )}
                  {carData.number && (
                    <span className="text-1 font-bold text-gray-900">
                      {carData.number}
                    </span>
                  )}
                  {carData.province && (
                    <span className="text--1 text-gray-600">
                      ({carData.province})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {carData.description && (
              <div className="mb-(--space-s)">
                <h3 className="text-0 font-semibold text-gray-900 mb-(--space-2xs)">
                  Description
                </h3>
                <p className="text-0 text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {carData.description}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-(--space-s-m) border-t border-gray-200 pt-(--space-m) ">
              {isBuyer && (
                <FavoriteButton
                  carId={carId}
                  isFavorited={isFavorited}
                  onToggle={handleFavoriteToggle}
                />
              )}
              {isBuyer && (
                <button
                  onClick={() => setIsReportCarOpen(true)}
                  className="rounded-full border py-1.5 px-3 text--1 medium gap-(--space-xs-s) flex items-center justify-center transition-all min-h-[36px] hover:bg-white text-gray-700 hover:text-maroon border-gray-200"
                  aria-label="Report this listing"
                >
                  <FlagIcon className="h-5 w-5" aria-hidden="true" />
                  Report
                </button>
              )}
              {/* Compare Checkbox */}
              {isBuyer && (
                <button
                  onClick={() => setIsCompareChecked(!isCompareChecked)}
                  className={`rounded-full border py-1.5 px-3 text--1 medium gap-(--space-xs-s) flex items-center justify-center transition-all min-h-[36px] ${
                    isCompareChecked
                      ? "bg-maroon text-white border-maroon"
                      : "bg-white/90 hover:bg-white text-gray-700 hover:text-maroon border-gray-200"
                  }`}
                  aria-label={
                    isCompareChecked
                      ? "Remove from comparison"
                      : "Add to comparison"
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
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-(--space-m) shadow-sm">
            <h2 className="text-3 font-bold text-gray-900 mb-(--space-2xs)">
              Contact Seller
            </h2>
            {contacts.length > 0 ? (
              <div className="space-y-(--space-s) mb-(--space-2xs)">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-(--space-xs) rounded-xl hover:bg-gray-50 transition-all border border-gray-100"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-maroon/10 rounded-lg flex items-center justify-center">
                      {getContactIcon(contact.contactType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-0 font-medium text-gray-900 capitalize">
                          {contact.value}
                        </p>
                        {contact.label && (
                          <span className="text--1 text-gray-500 ml-2">
                            ({contact.label})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-0 text-gray-600 mb-(--space-l)">
                No contact information available
              </p>
            )}

            <div className="space-y-(--space-s) pt-(--space-2xs)">
              <Link
                href={`/seller/${carData.sellerId}`}
                className="block w-full text-center px-(--space-l) py-(--space-s) bg-maroon hover:bg-red text-white font-medium rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                View Seller Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modals */}
      <ReportModal
        isOpen={isReportCarOpen}
        target="car"
        onClose={() => setIsReportCarOpen(false)}
        onSubmit={handleSubmitCarReport}
        suggestedSubtopics={DEFAULT_CAR_SUBTOPICS}
      />
    </div>
  );
}
