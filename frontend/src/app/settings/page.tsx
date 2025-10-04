"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import { profileAPI } from "@/lib/profileAPI";
import { ProfileData, BuyerRequest, SellerRequest } from "@/constants/user";
import BuyerForm from "@/components/features/profile/BuyerForm";
import SellerForm from "@/components/features/profile/SellerForm";

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUserAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [showSellerForm, setShowSellerForm] = useState(false);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (isAuthenticated) {
        try {
          const response = await profileAPI.getProfile();
          setProfileData(response.data);
          // Auto-show forms if roles exist
          setShowBuyerForm(response.data.roles.buyer);
          setShowSellerForm(response.data.roles.seller);
        } catch (err) {
          console.error("Failed to fetch profile:", err);
        } finally {
          setLoadingProfile(false);
        }
      }
    };

    fetchProfile();
  }, [isAuthenticated]);

  const handleBuyerSubmit = async (data: BuyerRequest) => {
    try {
      setError(null);
      setSuccessMessage(null);
      await profileAPI.upsertBuyerProfile(data);
      setSuccessMessage("Buyer profile updated successfully!");
      // Refresh profile data
      const response = await profileAPI.getProfile();
      setProfileData(response.data);
      setShowBuyerForm(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update buyer profile";
      setError(message);
    }
  };

  const handleSellerSubmit = async (data: SellerRequest) => {
    try {
      setError(null);
      setSuccessMessage(null);
      await profileAPI.upsertSellerProfile(data);
      setSuccessMessage("Seller profile updated successfully!");
      // Refresh profile data
      const response = await profileAPI.getProfile();
      setProfileData(response.data);
      setShowSellerForm(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update seller profile";
      setError(message);
    }
  };

  if (isLoading || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !profileData) {
    return null;
  }

  return (
    <div className="min-h-screen px-(--space-m) py-(--space-xl) max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-(--space-xl)">
        <h1 className="text-5 font-bold text-gray-900 mb-(--space-2xs)">
          Settings
        </h1>
        <p className="text-0 text-gray-600">
          Manage your account and profile settings
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-(--space-m) bg-green-50 border border-green-200 rounded-lg p-(--space-s)">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-0 text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Account Section */}
      <section className="mb-(--space-xl)">
        <h2 className="text-3 font-bold text-gray-900 mb-(--space-m)">
          Account Information
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 p-(--space-l)">
          <div className="space-y-(--space-s)">
            <div>
              <label className="block text-0 font-medium text-gray-700">
                Email
              </label>
              <p className="text-0 text-gray-900 mt-1">
                {profileData.user.email}
              </p>
            </div>
            <div>
              <label className="block text-0 font-medium text-gray-700">
                Account Created
              </label>
              <p className="text-0 text-gray-900 mt-1">
                {new Date(profileData.user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Buyer Profile Section */}
      <section className="mb-(--space-xl)">
        <div className="flex justify-between items-center mb-(--space-m)">
          <div>
            <h2 className="text-3 font-bold text-gray-900">Buyer Profile</h2>
            {profileData.roles.buyer && (
              <p className="text--1 text-gray-600 mt-1">
                Status:{" "}
                {profileData.profiles.buyerComplete ? (
                  <span className="text-green-600 font-medium">Complete</span>
                ) : (
                  <span className="text-orange-600 font-medium">
                    Incomplete
                  </span>
                )}
              </p>
            )}
          </div>
          {!profileData.roles.buyer && !showBuyerForm && (
            <button
              onClick={() => setShowBuyerForm(true)}
              className="px-(--space-m) py-(--space-2xs) text-0 font-medium rounded-lg text-white bg-black hover:bg-maroon transition-colors"
            >
              Become a Buyer
            </button>
          )}
        </div>

        {profileData.roles.buyer || showBuyerForm ? (
          <div className="bg-white rounded-lg border border-gray-200 p-(--space-l)">
            <BuyerForm
              initialData={profileData.buyer}
              onSubmit={handleBuyerSubmit}
              submitLabel="Update Buyer Profile"
            />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-(--space-l)">
            <p className="text-0 text-gray-600">
              You haven&apos;t set up a buyer profile yet. Click &quot;Become a
              Buyer&quot; to get started.
            </p>
          </div>
        )}
      </section>

      {/* Seller Profile Section */}
      <section className="mb-(--space-xl)">
        <div className="flex justify-between items-center mb-(--space-m)">
          <div>
            <h2 className="text-3 font-bold text-gray-900">Seller Profile</h2>
            {profileData.roles.seller && (
              <p className="text--1 text-gray-600 mt-1">
                Status:{" "}
                {profileData.profiles.sellerComplete ? (
                  <span className="text-green-600 font-medium">Complete</span>
                ) : (
                  <span className="text-orange-600 font-medium">
                    Incomplete
                  </span>
                )}
              </p>
            )}
          </div>
          {!profileData.roles.seller && !showSellerForm && (
            <button
              onClick={() => setShowSellerForm(true)}
              className="px-(--space-m) py-(--space-2xs) text-0 font-medium rounded-lg text-white bg-black hover:bg-maroon transition-colors"
            >
              Become a Seller
            </button>
          )}
        </div>

        {profileData.roles.seller || showSellerForm ? (
          <div className="bg-white rounded-lg border border-gray-200 p-(--space-l)">
            <SellerForm
              initialData={
                profileData.seller
                  ? {
                      displayName: profileData.seller.displayName,
                      about: profileData.seller.about,
                      mapLink: profileData.seller.mapLink,
                      contacts: [],
                    }
                  : undefined
              }
              initialContacts={profileData.contacts || []}
              onSubmit={handleSellerSubmit}
              submitLabel="Update Seller Profile"
            />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-(--space-l)">
            <p className="text-0 text-gray-600">
              You haven&apos;t set up a seller profile yet. Click &quot;Become a
              Seller&quot; to get started.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
