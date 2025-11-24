"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import { profileAPI, UpdateSelfRequest } from "@/lib/profileAPI";
import { ProfileData, BuyerRequest, SellerRequest } from "@/types/user";
import AccountForm, {
  AccountFormData,
  PasswordChangeData,
} from "@/components/profile/AccountForm";
import BuyerForm from "@/components/profile/BuyerForm";
import SellerForm from "@/components/profile/SellerForm";
import { FormSection } from "@/components/ui/FormSection";
import { InlineAlert } from "@/components/ui/InlineAlert";
import Link from "next/link";

// Smooth scroll with offset for anchor links
const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
  const href = e.currentTarget.getAttribute("href");
  if (href?.startsWith("#")) {
    e.preventDefault();
    const targetId = href.substring(1);
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80; // Offset for fixed header if any
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }
};

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, validateSession } = useUserAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [buyerError, setBuyerError] = useState<string | null>(null);
  const [buyerSuccess, setBuyerSuccess] = useState<string | null>(null);
  const [sellerError, setSellerError] = useState<string | null>(null);
  const [sellerSuccess, setSellerSuccess] = useState<string | null>(null);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch aggregated profile once
  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setFetchError(null);
      const response = await profileAPI.getProfile();
      setProfileData(response.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch profile";
      setFetchError(message);
    } finally {
      setLoadingProfile(false);
    }
  }, [isAuthenticated]);

  // Atomic update for account info only
  const handleAccountUpdate = async (data: AccountFormData) => {
    const updateData: UpdateSelfRequest = {};
    if (data.username) updateData.username = data.username;
    if (data.name) updateData.name = data.name;

    const res = await profileAPI.updateSelf(updateData);

    // Optimistically update local state
    setProfileData((prev) =>
      prev
        ? {
            ...prev,
            user: res.data.user,
          }
        : prev
    );
  };

  // Atomic update for password only
  const handlePasswordChange = async (data: PasswordChangeData) => {
    await profileAPI.changePassword({
      current_password: data.currentPassword,
      new_password: data.newPassword,
    });
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleBuyerSubmit = async (data: BuyerRequest) => {
    try {
      setBuyerError(null);
      setBuyerSuccess(null);
      // Use unified endpoint
      const res = await profileAPI.updateSelf({ buyer: data });
      setBuyerSuccess("Buyer preferences saved successfully!");
      // Refresh auth context to get updated roles
      await validateSession();
      // Update local state immediately with response
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              buyer: res.data.buyer,
              profiles: {
                ...prev.profiles,
                buyerComplete: res.data.buyer
                  ? res.data.buyer.province !== null &&
                    res.data.buyer.budgetMin !== null &&
                    res.data.buyer.budgetMax !== null
                  : false,
              },
            }
          : prev
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update buyer profile";
      setBuyerError(message);
    }
  };

  const handleSellerSubmit = async (data: SellerRequest) => {
    try {
      setSellerError(null);
      setSellerSuccess(null);
      // Use unified endpoint
      const res = await profileAPI.updateSelf({ seller: data });
      setSellerSuccess("Seller settings saved successfully!");
      // Refresh auth context to get updated roles
      await validateSession();
      // Update local state immediately with response
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              seller: res.data.seller,
              contacts: res.data.contacts || [],
              profiles: {
                ...prev.profiles,
                sellerComplete: res.data.seller
                  ? res.data.seller.displayName.trim().length > 0
                  : false,
              },
            }
          : prev
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update seller profile";
      setSellerError(message);
    }
  };

  if (isLoading || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-maroon mx-auto"></div>
          <p className="mt-6 text-0 text-gray-600 font-medium">
            Loading your settings...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-(--space-l)">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2 font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-0 text-gray-600 mb-6">
            Please sign in to view and manage your settings.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center px-6 py-3 bg-maroon text-white font-medium rounded-lg hover:bg-red transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-(--space-xl) max-w-2xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2 font-bold text-red-900 mb-2">
                Unable to load settings
              </h1>
              <p className="text-0 text-red-700 mb-6">
                {fetchError ||
                  "We couldn't load your profile. Please try again."}
              </p>
              <button
                onClick={() => {
                  setLoadingProfile(true);
                  fetchProfile();
                }}
                className="inline-flex items-center gap-2 px-6 py-3 text-0 font-medium rounded-lg text-white bg-maroon hover:bg-red transition-colors"
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
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full scroll-smooth">
      {/* Header */}
      <div className="mb-(--space-xl)">
        <div className="mb-(--space-m)">
          <h1 className="text-3 bold text-gray-900 mb-2">Settings</h1>
          <p className="text-0 text-gray-600">
            Manage your account, preferences, and seller profile
          </p>
        </div>
        {/* Quick section nav (anchors) */}
        <nav className="flex flex-wrap gap-(--space-xs) text--1">
          <Link
            href="#account"
            onClick={handleAnchorClick}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-maroon hover:text-white rounded-full transition-all duration-200 font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Account
          </Link>
          {profileData.buyer && (
            <Link
              href="#preferences"
              onClick={handleAnchorClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-maroon hover:text-white rounded-full transition-all duration-200 font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Preferences
            </Link>
          )}
          {profileData.seller && (
            <Link
              href="#profile"
              onClick={handleAnchorClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-maroon hover:text-white rounded-full transition-all duration-200 font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Profile
            </Link>
          )}
        </nav>
      </div>

      {profileData.user && (
        /* Account Section */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-(--space-l) mb-(--space-xl) transition-shadow hover:shadow-md">
          <FormSection
            id="account"
            title="Account"
            description="Manage your account information and security settings"
          >
            <AccountForm
              initialData={{
                email: profileData.user.email,
                username: profileData.user.username,
                name: profileData.user.name,
                createdAt: profileData.user.created_at,
              }}
              onAccountUpdate={handleAccountUpdate}
              onPasswordChange={handlePasswordChange}
            />
          </FormSection>
        </div>
      )}

      {profileData.buyer && (
        /* Buyer Section */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-(--space-l) mb-(--space-xl) transition-shadow hover:shadow-md">
          <FormSection
            id="preferences"
            title="Buyer Preferences"
            description="Set your car buying preferences for better matches and personalized recommendations"
          >
            {buyerSuccess && (
              <div className="mb-(--space-m)">
                <InlineAlert
                  type="success"
                  onDismiss={() => setBuyerSuccess(null)}
                >
                  {buyerSuccess}
                </InlineAlert>
              </div>
            )}
            {buyerError && (
              <div className="mb-(--space-m)">
                <InlineAlert type="error" onDismiss={() => setBuyerError(null)}>
                  {buyerError}
                </InlineAlert>
              </div>
            )}
            <BuyerForm
              initialData={profileData.buyer}
              onSubmit={handleBuyerSubmit}
              submitLabel="Save Buyer Preferences"
            />
          </FormSection>
        </div>
      )}

      {profileData.seller && (
        /* Seller Profile Section */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-(--space-l) mb-(--space-xl) transition-shadow hover:shadow-md">
          <FormSection
            id="profile"
            title="Selling Profile"
            description="Manage your seller profile and contact information for buyer inquiries"
          >
            {sellerSuccess && (
              <div className="mb-(--space-m)">
                <InlineAlert
                  type="success"
                  onDismiss={() => setSellerSuccess(null)}
                >
                  {sellerSuccess}
                </InlineAlert>
              </div>
            )}
            {sellerError && (
              <div className="mb-(--space-m)">
                <InlineAlert
                  type="error"
                  onDismiss={() => setSellerError(null)}
                >
                  {sellerError}
                </InlineAlert>
              </div>
            )}
            <SellerForm
              initialData={{
                displayName: profileData.seller.displayName,
                about: profileData.seller.about,
                mapLink: profileData.seller.mapLink,
                contacts: [],
              }}
              initialContacts={profileData.contacts || []}
              onSubmit={handleSellerSubmit}
              submitLabel="Save Seller Settings"
            />
          </FormSection>
        </div>
      )}
    </div>
  );
}
