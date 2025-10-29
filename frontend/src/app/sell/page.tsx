"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { carsAPI } from "@/lib/carsAPI";

export default function SellLanding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSelling = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create empty draft
      const result = await carsAPI.create();

      if (result.success && result.data.id) {
        // Redirect to the sell flow with the new draft ID
        router.push(`/sell/${result.data.id}`);
      } else {
        setError("Failed to create draft. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create draft");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sell Your Car
          </h1>
          <p className="text-lg text-gray-600">
            Create a listing in just a few steps. Upload your vehicle documents,
            add details, and publish!
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="space-y-6">
            <div className="border-l-4 border-maroon pl-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                What you&apos;ll need:
              </h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">📄</span>
                  <span>Vehicle registration book (for OCR extraction)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🔍</span>
                  <span>
                    Vehicle inspection document or QR code (from inspection
                    station)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">📸</span>
                  <span>5-12 high-quality photos of your vehicle</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">💰</span>
                  <span>Your asking price and vehicle description</span>
                </li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleStartSelling}
              disabled={loading}
              className="w-full bg-maroon text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating draft..." : "Start Selling"}
            </button>

            <p className="text-sm text-gray-500 text-center">
              Your progress will be automatically saved as you go.
              <br />
              You can always come back to finish later.
            </p>
          </div>
        </div>

        {/* Future: Show existing drafts here */}
        {/* <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Drafts
          </h3>
          ... draft list ...
        </div> */}
      </div>
    </div>
  );
}
