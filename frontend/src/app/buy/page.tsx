"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { carsAPI } from "@/lib/carsAPI";
import type Car from "@/types/Car";
import PriceFormatting from "@/lib/PriceFormatting";

function BuyPageContent() {
  const searchParams = useSearchParams();
  const queryText = searchParams.get("q") || "";

  const [cars, setCars] = useState<Car[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 20;

  useEffect(() => {
    fetchCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryText, page]);

  const fetchCars = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await carsAPI.search({
        q: queryText || undefined,
        page,
        limit,
      });

      if (result.success) {
        setCars(result.data.cars || []);
        setTotal(result.data.total);
      } else {
        throw new Error(result.message || "Failed to fetch cars");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="pb-(--space-l) px-(--space-m) py-(--space-s) max-w-[1536px] mx-auto w-full">
      {/* Header */}
      <div className="mb-(--space-m)">
        <h1 className="text-4 font-bold text-gray-900 mb-(--space-2xs)">
          Browse Cars
        </h1>
        {queryText && (
          <p className="text-0 text-gray-600">
            Search results for:{" "}
            <span className="font-bold text-maroon">
              &quot;{queryText}&quot;
            </span>
          </p>
        )}
        <p className="text-0 text-gray-600">
          {total} {total === 1 ? "car" : "cars"} found
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-(--space-2xl)">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-maroon"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-(--space-m) py-(--space-s) rounded-xl">
          <p className="font-semibold">Error</p>
          <p className="text--1">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && cars.length === 0 && (
        <div className="text-center py-(--space-2xl)">
          <div className="text-6xl mb-(--space-m)">🚗</div>
          <h2 className="text-2 font-bold text-gray-900 mb-(--space-2xs)">
            No cars found
          </h2>
          <p className="text-0 text-gray-600 mb-(--space-m)">
            {queryText
              ? `Try adjusting your search term "${queryText}"`
              : "Be the first to list a car!"}
          </p>
          <Link
            href="/sell"
            className="inline-block px-(--space-m) py-(--space-s) bg-maroon text-white rounded-xl hover:bg-red transition-all font-semibold"
          >
            List Your Car
          </Link>
        </div>
      )}

      {/* Cars Grid */}
      {!loading && !error && cars.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-(--space-m)">
            {cars.map((car) => (
              <Link
                key={car.id}
                href={`/cars/${car.id}`}
                className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
              >
                {/* Car Image */}
                <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200">
                  {car.images && car.images.length > 0 ? (
                    <Image
                      src={`/api/cars/images/${car.images[0].id}`}
                      alt={`${car.brandName || "Car"} ${car.modelName || ""}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-6xl">🚗</span>
                    </div>
                  )}
                  {car.conditionRating && (
                    <div className="absolute top-(--space-2xs) right-(--space-2xs) bg-white/90 backdrop-blur-sm px-(--space-2xs) py-(--space-3xs) rounded-lg">
                      <div className="flex items-center gap-(--space-3xs)">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text--1 font-bold">
                          {car.conditionRating}/5
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Car Info */}
                <div className="p-(--space-s)">
                  {/* Title */}
                  <h3 className="text-1 font-bold text-gray-900 mb-(--space-3xs) line-clamp-1">
                    {car.brandName || "Unknown"} {car.modelName || "Car"}{" "}
                    {car.year && `(${car.year})`}
                  </h3>

                  {/* Price */}
                  <p className="text-2 font-bold text-maroon mb-(--space-2xs)">
                    {PriceFormatting(car.price)}
                  </p>

                  {/* Details */}
                  <div className="space-y-(--space-3xs) mb-(--space-s)">
                    {car.mileage && (
                      <div className="flex items-center gap-(--space-3xs) text--1 text-gray-600">
                        <span>📏</span>
                        <span>
                          {new Intl.NumberFormat("th-TH").format(car.mileage)}{" "}
                          km
                        </span>
                      </div>
                    )}
                    {car.provinceId && (
                      <div className="flex items-center gap-(--space-3xs) text--1 text-gray-600">
                        <span>📍</span>
                        <span>Province #{car.provinceId}</span>
                      </div>
                    )}
                    {car.seats && (
                      <div className="flex items-center gap-(--space-3xs) text--1 text-gray-600">
                        <span>👥</span>
                        <span>{car.seats} seats</span>
                      </div>
                    )}
                    {car.color && (
                      <div className="flex items-center gap-(--space-3xs) text--1 text-gray-600">
                        <span>🎨</span>
                        <span>{car.color}</span>
                      </div>
                    )}
                  </div>

                  {/* View Details Button */}
                  <button className="w-full py-(--space-2xs) bg-maroon/10 text-maroon rounded-lg font-semibold text-0 group-hover:bg-maroon group-hover:text-white transition-all">
                    View Details
                  </button>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-(--space-s) mt-(--space-l)">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-(--space-m) py-(--space-2xs) bg-white border border-gray-300 rounded-lg font-semibold text-0 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>

              <div className="flex items-center gap-(--space-3xs)">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-(--space-s) py-(--space-2xs) rounded-lg font-semibold text-0 transition-all ${
                        page === pageNum
                          ? "bg-maroon text-white"
                          : "bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-(--space-m) py-(--space-2xs) bg-white border border-gray-300 rounded-lg font-semibold text-0 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function BuyPage() {
  return (
    <Suspense
      fallback={
        <div className="pb-(--space-l) px-(--space-m) py-(--space-s) max-w-[1536px] mx-auto w-full">
          <div className="flex justify-center items-center py-(--space-2xl)">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-maroon"></div>
          </div>
        </div>
      }
    >
      <BuyPageContent />
    </Suspense>
  );
}
