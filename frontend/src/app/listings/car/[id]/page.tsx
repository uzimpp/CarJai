"use client";

import { useParams } from "next/navigation";

export default function CarListingPage() {
  const params = useParams();
  const carId = params.id;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Car Listing #{carId}
        </h1>
        <p className="text-gray-600">
          This page is under construction. Car listing details will be displayed
          here.
        </p>
      </div>
    </div>
  );
}
