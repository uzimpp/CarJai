"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { carsAPI, type Car } from "@/lib/carsAPI";
import { useUserAuth } from "@/hooks/useUserAuth";

interface RecentViewRequest {
  car_id: number;
}

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useUserAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const carId = params.id as string;

  // Record view when component mounts and user is authenticated
  useEffect(() => {
    const recordView = async () => {
      if (!user || !carId) return;

      try {
        const response = await fetch("/api/recent-views/record", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            car_id: parseInt(carId),
          } as RecentViewRequest),
        });

        if (!response.ok) {
          console.warn("Failed to record car view:", response.statusText);
        }
      } catch (error) {
        console.warn("Error recording car view:", error);
      }
    };

    recordView();
  }, [user, carId]);

  // Fetch car details
  useEffect(() => {
    const fetchCarDetails = async () => {
      if (!carId) return;

      try {
        setLoading(true);
        const response = await carsAPI.getById(parseInt(carId));
        
        if (response.success && response.data) {
          setCar(response.data);
        } else {
          setError("Car not found");
        }
      } catch (err) {
        console.error("Error fetching car details:", err);
        setError("Failed to load car details");
      } finally {
        setLoading(false);
      }
    };

    fetchCarDetails();
  }, [carId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto mb-4"></div>
          <p className="text-gray-600">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Car Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The requested car could not be found."}</p>
          <Link
            href="/buy"
            className="bg-maroon text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Browse Cars
          </Link>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    if (car?.images && car.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % car.images!.length);
    }
  };

  const prevImage = () => {
    if (car?.images && car.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + car.images!.length) % car.images!.length);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-gray-200 rounded-2xl overflow-hidden">
              {car.images && car.images.length > 0 ? (
                <>
                  <Image
                    src={`/api/cars/images/${car.images[currentImageIndex].id}`}
                    alt={`${car.brandName || "Car"} ${car.modelName || ""}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {car.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-8xl">🚗</span>
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {car.images && car.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {car.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 ${
                      index === currentImageIndex ? "ring-2 ring-maroon" : ""
                    }`}
                  >
                    <Image
                      src={`/api/cars/images/${image.id}`}
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

          {/* Car Details */}
          <div className="space-y-6">
            {/* Title and Price */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {car.brandName || "Unknown"} {car.modelName || "Car"} {car.year && `(${car.year})`}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                {car.price && (
                  <span className="text-3xl font-bold text-maroon">
                    ฿{car.price.toLocaleString()}
                  </span>
                )}
                {car.conditionRating && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-semibold">{car.conditionRating}/5</span>
                  </div>
                )}
              </div>
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-2 gap-4">
              {car.year && (
                <div className="bg-white p-4 rounded-lg">
                  <span className="text-gray-600 text-sm">Year</span>
                  <p className="font-semibold">{car.year}</p>
                </div>
              )}
              {car.mileage && (
                <div className="bg-white p-4 rounded-lg">
                  <span className="text-gray-600 text-sm">Mileage</span>
                  <p className="font-semibold">{car.mileage.toLocaleString()} km</p>
                </div>
              )}
              {car.color && (
                <div className="bg-white p-4 rounded-lg">
                  <span className="text-gray-600 text-sm">Color</span>
                  <p className="font-semibold">{car.color}</p>
                </div>
              )}
              {car.seats && (
                <div className="bg-white p-4 rounded-lg">
                  <span className="text-gray-600 text-sm">Seats</span>
                  <p className="font-semibold">{car.seats}</p>
                </div>
              )}
            </div>

            {/* Contact Seller */}
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Contact Seller</h3>
              <div className="space-y-3">
                <Link
                  href={`/seller/${car.sellerId}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 bg-maroon text-white rounded-full flex items-center justify-center font-semibold">
                    S
                  </div>
                  <div>
                    <p className="font-semibold">View Seller Profile</p>
                    <p className="text-sm text-gray-600">Contact seller for more details</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}