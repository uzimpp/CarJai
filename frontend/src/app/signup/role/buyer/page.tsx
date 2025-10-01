"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import { profileAPI } from "@/lib/profileAPI";
import { BuyerRequest } from "@/constants/user";
import BuyerForm from "@/components/features/profile/BuyerForm";

export default function BuyerProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUserAuth();
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (data: BuyerRequest) => {
    try {
      setError(null);
      await profileAPI.upsertBuyerProfile(data);
      // Redirect to buy page after successful profile creation
      router.push("/buy");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save profile";
      setError(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="">
      {/* Header */}
      <div className="mb-(--space-l)">
        <h1 className="text-4 font-bold text-gray-900 mb-(--space-2xs)">
          Set Up Your Buyer Profile
        </h1>
        <p className="text-0 text-gray-600">
          Tell us about your car preferences so we can help you find the perfect
          match
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-(--space-m) bg-red-50 border border-red-200 rounded-lg p-(--space-s)">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-0 text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-(--space-l)">
        <BuyerForm onSubmit={handleSubmit} submitLabel="Complete Profile" />
      </div>

      {/* Skip Option */}
      <div className="mt-(--space-m) text-center">
        <button
          onClick={() => router.push("/buy")}
          className="text--1 text-gray-600 hover:text-maroon transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
