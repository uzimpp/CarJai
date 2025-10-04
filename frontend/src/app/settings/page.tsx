"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import { profileAPI } from "@/lib/profileAPI";
import { ProfileData, BuyerRequest, SellerRequest } from "@/constants/user";
import BuyerForm from "@/components/features/profile/BuyerForm";
import SellerForm from "@/components/features/profile/SellerForm";

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, roles, profiles } = useUserAuth();
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

  // Fetch role-specific profiles after /api/auth/me via useUserAuth
  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setError(null);

      // Build initial aggregate from /api/auth/me (hook)
      const aggregate: ProfileData = {
        user: user!,
        roles: roles || { buyer: false, seller: false },
        profiles: profiles || { buyerComplete: false, sellerComplete: false },
      } as ProfileData;

      // Conditionally fetch buyer
      if (roles?.buyer) {
        try {
          const buyerRes = await profileAPI.getBuyerProfile();
          aggregate.buyer = buyerRes.data;
        } catch {}
      }

      // Conditionally fetch seller (and contacts)
      if (roles?.seller) {
        try {
          const sellerRes = await profileAPI.getSellerProfile();
          aggregate.seller = sellerRes.data.seller;
          aggregate.contacts = sellerRes.data.contacts || [];
        } catch {}
      }

      setProfileData(aggregate);
      setShowBuyerForm(!!roles?.buyer);
      setShowSellerForm(!!roles?.seller);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch profile";
      setError(message);
    } finally {
      setLoadingProfile(false);
    }
  }, [isAuthenticated, roles, profiles, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mt-4 text-gray-600">Please sign in to view settings.</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen px-(--space-m) py-(--space-xl) max-w-[1200px] mx-auto">
        <div className="rounded-xl border border-red-200 bg-red-50 p-(--space-l)">
          <h1 className="text-2 font-bold text-red-800 mb-(--space-s)">
            Unable to load settings
          </h1>
          <p className="text-0 text-red-700 mb-(--space-m)">
            {error || "We couldn't load your profile. Please try again."}
          </p>
          <button
            onClick={() => {
              setLoadingProfile(true);
              fetchProfile();
            }}
            className="inline-flex items-center px-(--space-m) py-(--space-2xs) text-0 font-medium rounded-lg text-white bg-maroon hover:bg-red transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
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

      {/* Buyer Profile Section (no role switching) */}
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
          {/* Role switching removed: no CTA to become buyer */}
        </div>

        {profileData.roles.buyer ? (
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
              Your account doesn&apos;t have the Buyer role.
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
          {/* Role switching removed: no CTA to become seller */}
        </div>

        {profileData.roles.seller ? (
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
              Your account doesn&apos;t have the Seller role.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
