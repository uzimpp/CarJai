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
import { recentAPI } from "@/lib/recentAPI";

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
          // Seller contacts are now included in the car response
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

  // Record recent view once car data is available
  useEffect(() => {
    if (!car) return;
    try {
      const c = car.car;
      const imgs = car.images || [];
      const first = imgs[0];
      // Fire-and-forget; do not block UI
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

  // Fetch favorites for authenticated buyers
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

  useEffect(() => {
    if (isBuyer && carId) {
      const recordView = async () => {
        try {
          await carsAPI.recordView(carId);
        } catch (err) {
          console.error("Failed to record viewing history:", err);
        }
      };
      recordView();
    }
  }, [carId, isBuyer]); // ทำงานทุกครั้งที่ carId หรือ สถานะ isBuyer เปลี่ยน

  const handleFavoriteToggle = async (
    carId: number,
    newFavoriteState: boolean
  ) => {
    // Update local state immediately for optimistic UI
    setIsFavorited(newFavoriteState);
    const newFavoriteCarIds = new Set(favoriteCarIds);
    if (newFavoriteState) {
      newFavoriteCarIds.add(carId);
    } else {
      newFavoriteCarIds.delete(carId);
    }
    setFavoriteCarIds(newFavoriteCarIds);
  };

  const getContactIcon = (contactType: string) => {
    switch (contactType.toLowerCase()) {
      case "phone":
        return "📞";
      case "line":
        return "💬";
      case "facebook":
        return "📘";
      case "email":
        return "📧";
      case "instagram":
        return "📷";
      default:
        return "📞";
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-24 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-(--space-3xl)">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-(--space-l)">
              <span className="text-5xl">🚗</span>
            </div>
            <h2 className="text-3 bold text-gray-900 mb-(--space-s)">
              {error || "Car Not Found"}
            </h2>
            <p className="text-1 text-gray-600 mb-(--space-l)">
              The car you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <button
              onClick={() => router.back()}
              className="inline-block px-(--space-xl) py-(--space-m) text-white bg-gradient-to-r from-maroon to-red rounded-3xl hover:shadow-xl transition-all bold text-1 shadow-lg"
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
      {/* Header */}
      <div className="mb-(--space-l)">
        <h1 className="text-4 bold text-gray-900 mb-(--space-s)">
          {carData.brandName} {carData.modelName} {carData.submodelName}
        </h1>
        <div className="flex items-center justify-between">
          <div className="text-2 bold text-maroon">
            ฿{formatPrice(carData.price || 0)}
          </div>
          <div className="flex items-center gap-(--space-m)">
            <div className="text--1 text-gray-600">
              Listed on {formatDate(carData.createdAt)}
            </div>
            {isBuyer && (
              <FavoriteButton
                carId={carId}
                isFavorited={isFavorited}
                onToggle={handleFavoriteToggle}
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-(--space-l)">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-(--space-l)">
          {/* Image Gallery */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {images && images.length > 0 ? (
              <div className="relative">
                <div className="aspect-video relative">
                  <Image
                    src={
                      images[currentImageIndex]?.url ||
                      "/api/cars/images/" + images[currentImageIndex]?.id
                    }
                    alt={`${carData.brandName} ${carData.modelName}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Image Navigation */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === currentImageIndex
                            ? "bg-white"
                            : "bg-white/50 hover:bg-white/75"
                        }`}
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
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          currentImageIndex === images.length - 1
                            ? 0
                            : currentImageIndex + 1
                        )
                      }
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-gray-100">
                <span className="text-6xl">🚗</span>
              </div>
            )}
          </div>

          {/* Car Specifications */}
          <div className="bg-white rounded-lg border border-gray-200 p-(--space-l)">
            <h2 className="text-2 bold text-gray-900 mb-(--space-m)">
              Vehicle Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-(--space-m)">
              <div className="space-y-(--space-s)">
                <div className="flex justify-between">
                  <span className="text-gray-600">Year:</span>
                  <span className="font-medium">{carData.year || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mileage:</span>
                  <span className="font-medium">
                    {carData.mileage
                      ? `${formatPrice(carData.mileage)} km`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Body Type:</span>
                  <span className="font-medium">
                    {carData.bodyType || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transmission:</span>
                  <span className="font-medium">
                    {carData.transmission || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Drivetrain:</span>
                  <span className="font-medium">
                    {carData.drivetrain || "N/A"}
                  </span>
                </div>
              </div>
              <div className="space-y-(--space-s)">
                <div className="flex justify-between">
                  <span className="text-gray-600">Seats:</span>
                  <span className="font-medium">{carData.seats || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Doors:</span>
                  <span className="font-medium">{carData.doors || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Engine CC:</span>
                  <span className="font-medium">
                    {carData.engineCc || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fuel Types:</span>
                  <span className="font-medium">
                    {carData.fuelTypes?.join(", ") || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Colors:</span>
                  <span className="font-medium">
                    {carData.colors?.join(", ") || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* License Plate */}
            {(carData.licensePlate || carData.prefix || carData.number) && (
              <div className="mt-(--space-m) pt-(--space-m) border-t border-gray-200">
                <h3 className="text-1 font-semibold text-gray-900 mb-(--space-s)">
                  License Plate Information
                </h3>
                <div className="flex items-center space-x-(--space-s)">
                  {carData.prefix && (
                    <span className="text-1 font-medium">{carData.prefix}</span>
                  )}
                  {carData.number && (
                    <span className="text-1 font-medium">{carData.number}</span>
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
              <div className="mt-(--space-m) pt-(--space-m) border-t border-gray-200">
                <h3 className="text-1 font-semibold text-gray-900 mb-(--space-s)">
                  Description
                </h3>
                <p className="text-0 text-gray-700 whitespace-pre-wrap">
                  {carData.description}
                </p>
              </div>
            )}
          </div>

          {/* Inspection Results */}
          {inspection && (
            <div className="bg-white rounded-lg border border-gray-200 p-(--space-l)">
              <h2 className="text-2 bold text-gray-900 mb-(--space-m)">
                Vehicle Inspection Results
              </h2>
              <div className="mb-(--space-m)">
                <div className="flex items-center justify-between">
                  <span className="text-1 font-semibold">Overall Result:</span>
                  <span
                    className={`px-(--space-s) py-(--space-xs) rounded-full text--1 font-medium ${
                      inspection.overallPass
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {inspection.overallPass ? "PASSED" : "FAILED"}
                  </span>
                </div>
                <p className="text--1 text-gray-600 mt-1">
                  Inspection Station: {inspection.station}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-(--space-s)">
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
                  <div key={key} className="flex items-center justify-between">
                    <span className="text--1 text-gray-600">{label}:</span>
                    <span
                      className={`text--1 font-medium ${
                        inspection[key as keyof InspectionData]
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {inspection[key as keyof InspectionData] ? "✓" : "✗"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-(--space-l)">
          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-(--space-l)">
            <h2 className="text-2 font-bold text-gray-900 mb-(--space-m)">
              Contact Seller
            </h2>
            {contacts.length > 0 ? (
              <div className="space-y-(--space-s)">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-start p-(--space-s) rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 text-maroon mt-1">
                      {getContactIcon(contact.contactType)}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text--1 font-medium text-gray-900 capitalize">
                          {contact.contactType}
                        </p>
                        {contact.label && (
                          <span className="text--2 text-gray-500 ml-2">
                            ({contact.label})
                          </span>
                        )}
                      </div>
                      <p className="text-0 text-gray-600 break-all mt-1">
                        {contact.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text--1 text-gray-600">
                No contact information available
              </p>
            )}

            <div className="mt-(--space-m) pt-(--space-m) border-t border-gray-200">
              <Link
                href={`/seller/${carData.sellerId}`}
                className="block w-full text-center px-(--space-m) py-(--space-s) text-white bg-gradient-to-r from-maroon to-red rounded-lg hover:shadow-lg transition-all font-medium"
              >
                View Seller Profile
              </Link>
            </div>
          </div>

          {/* Vehicle Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-(--space-l)">
            <h3 className="text-1 font-semibold text-gray-900 mb-(--space-s)">
              Vehicle Status
            </h3>
            <div className="space-y-(--space-xs)">
              <div className="flex justify-between">
                <span className="text--1 text-gray-600">Condition:</span>
                <span className="text--1 font-medium">
                  {carData.conditionRating
                    ? `${carData.conditionRating}/5`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text--1 text-gray-600">Flooded:</span>
                <span className="text--1 font-medium">
                  {carData.isFlooded ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text--1 text-gray-600">Heavily Damaged:</span>
                <span className="text--1 font-medium">
                  {carData.isHeavilyDamaged ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text--1 text-gray-600">Chassis Number:</span>
                <span className="text--1 font-medium font-mono">
                  {carData.chassisNumber || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
