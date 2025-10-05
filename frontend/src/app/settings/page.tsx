"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/hooks/useUserAuth";
import { profileAPI, UpdateSelfRequest } from "@/lib/profileAPI";
import { ProfileData, BuyerRequest, SellerRequest } from "@/constants/user";
import AccountForm, {
  AccountFormData,
  PasswordChangeData,
} from "@/components/features/profile/AccountForm";
import BuyerForm from "@/components/features/profile/BuyerForm";
import SellerForm from "@/components/features/profile/SellerForm";
import { FormSection } from "@/components/ui/FormSection";
import { InlineAlert } from "@/components/ui/InlineAlert";

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUserAuth();
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
      const res = await profileAPI.upsertBuyerProfile(data);
      setBuyerSuccess("Buyer preferences saved successfully!");
      // Update local state immediately with response
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              buyer: res.data,
              profiles: {
                ...prev.profiles,
                buyerComplete: true,
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
      const res = await profileAPI.upsertSellerProfile(data);
      setSellerSuccess("Seller settings saved successfully!");
      // Update local state immediately with response
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              seller: res.data.seller,
              contacts: res.data.contacts || [],
              profiles: {
                ...prev.profiles,
                sellerComplete: true,
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
            {fetchError || "We couldn't load your profile. Please try again."}
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

      {/* Quick section nav (anchors) */}
      <nav className="mb-(--space-l) flex flex-wrap gap-(--space-s) text--1 text-gray-600">
        <a
          href="#account"
          className="hover:text-gray-900 underline-offset-2 hover:underline"
        >
          Account
        </a>
        {profileData.buyer && (
          <a
            href="#preferences"
            className="hover:text-gray-900 underline-offset-2 hover:underline"
          >
            Preferences
          </a>
        )}
        {profileData.seller && (
          <a
            href="#profile"
            className="hover:text-gray-900 underline-offset-2 hover:underline"
          >
            Profile
          </a>
        )}
      </nav>

      {profileData.user && (
        /* Account Section */
        <FormSection
          id="account"
          title="Account"
          description="Manage your account settings"
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
      )}

      {profileData.buyer && (
        /* Buyer Section */
        <FormSection
          id="preferences"
          title="Preferences"
          description="Set your car buying preferences"
        >
          {buyerSuccess && (
            <InlineAlert type="success" onDismiss={() => setBuyerSuccess(null)}>
              {buyerSuccess}
            </InlineAlert>
          )}
          {buyerError && (
            <InlineAlert type="error" onDismiss={() => setBuyerError(null)}>
              {buyerError}
            </InlineAlert>
          )}
          <BuyerForm
            initialData={profileData.buyer}
            onSubmit={handleBuyerSubmit}
            submitLabel="Save Buyer Preferences"
          />
        </FormSection>
      )}

      {profileData.seller && (
        /* Seller Profile Section */
        <FormSection
          id="profile"
          title="Selling Profile"
          description="Manage your seller profile and contact information"
        >
          {sellerSuccess && (
            <InlineAlert
              type="success"
              onDismiss={() => setSellerSuccess(null)}
            >
              {sellerSuccess}
            </InlineAlert>
          )}
          {sellerError && (
            <InlineAlert type="error" onDismiss={() => setSellerError(null)}>
              {sellerError}
            </InlineAlert>
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
      )}
    </div>
  );
}
