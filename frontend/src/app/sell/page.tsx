"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { carsAPI } from "@/lib/carsAPI";
import {
  FileText,
  Search,
  Camera,
  DollarSign,
  Save,
  ArrowRight,
} from "lucide-react";

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

  const requirements = [
    {
      icon: FileText,
      title: "Vehicle Registration Book",
      description: "Optional - for OCR auto-fill",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Search,
      title: "Inspection Report",
      description: "Required - QR code or URL from inspection station",
      color: "text-maroon",
      bgColor: "bg-maroon/10",
      required: true,
    },
    {
      icon: Camera,
      title: "Vehicle Photos",
      description: "5-12 high-quality photos of your vehicle",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: DollarSign,
      title: "Price & Description",
      description: "Your asking price and vehicle description",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3 bold mb-4">Sell Your Car</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create a listing in just a few steps. Upload your vehicle documents,
            add details, and publish!
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-(--space-l) mb-8">
          <div className="space-y-8">
            {/* Requirements Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                What you&apos;ll need:
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requirements.map((req, index) => {
                  const Icon = req.icon;
                  return (
                    <div
                      key={index}
                      className={`${req.bgColor} rounded-lg p-4 border border-gray-100`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`${req.color} bg-white rounded-lg p-2 shadow-sm`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {req.title}
                            </h3>
                            {req.required && (
                              <span className="text-xs bg-maroon text-white px-2 py-0.5 rounded-full font-medium">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {req.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handleStartSelling}
              disabled={loading}
              className="w-full bg-maroon text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating draft...</span>
                </>
              ) : (
                <>
                  <span>Start Selling</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Info Note */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <Save className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700 font-medium mb-1">
                    Auto-save enabled
                  </p>
                  <p className="text-sm text-gray-600">
                    Your progress will be automatically saved as you go. You can
                    always come back to finish later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
