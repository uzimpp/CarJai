"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/ui/TextField";
import { PasswordField } from "@/components/ui/PasswordField";
import { InlineAlert } from "@/components/ui/InlineAlert";

export interface AccountFormData {
  username: string;
  name: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AccountFormProps {
  initialData?: {
    email: string;
    username: string;
    name: string;
    createdAt: string;
  };
  onAccountUpdate: (data: AccountFormData) => Promise<void>;
  onPasswordChange: (data: PasswordChangeData) => Promise<void>;
}

export default function AccountForm({
  initialData,
  onAccountUpdate,
  onPasswordChange,
}: AccountFormProps) {
  // Separate form for account info
  const {
    register: registerAccount,
    handleSubmit: handleAccountSubmit,
    formState: {
      errors: accountErrors,
      isDirty: isAccountDirty,
      isSubmitting: isAccountSubmitting,
    },
    reset: resetAccount,
  } = useForm<AccountFormData>({
    defaultValues: {
      username: initialData?.username || "",
      name: initialData?.name || "",
    },
  });

  // Separate form for password change
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPassword,
    watch,
  } = useForm<PasswordChangeData>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleAccountFormSubmit = async (data: AccountFormData) => {
    try {
      setAccountSuccess(null);
      setAccountError(null);
      await onAccountUpdate(data);
      resetAccount(data);
      setAccountSuccess("Account information updated successfully!");
      setTimeout(() => setAccountSuccess(null), 3000);
    } catch (err) {
      setAccountError(
        err instanceof Error ? err.message : "Failed to update account"
      );
    }
  };

  const handlePasswordFormSubmit = async (data: PasswordChangeData) => {
    try {
      setPasswordSuccess(null);
      setPasswordError(null);
      await onPasswordChange(data);
      resetPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordSuccess("Password changed successfully!");
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    }
  };

  return (
    <div className="space-y-(--space-xl)">
      {/* Account Info Section */}
      <div className="space-y-(--space-m)">
        <div>
          <h3 className="text-1 font-semibold text-gray-900 mb-(--space-xs)">
            Account Information
          </h3>
          <p className="text--1 text-gray-600">
            Update your username and display name
          </p>
        </div>

        {accountSuccess && (
          <InlineAlert type="success" onDismiss={() => setAccountSuccess(null)}>
            {accountSuccess}
          </InlineAlert>
        )}
        {accountError && (
          <InlineAlert type="error" onDismiss={() => setAccountError(null)}>
            {accountError}
          </InlineAlert>
        )}

        <form
          onSubmit={handleAccountSubmit(handleAccountFormSubmit)}
          className="space-y-(--space-m)"
        >
          {/* Read-only Email */}
          <div>
            <label className="block text-0 font-medium text-gray-700 mb-1">
              Email
            </label>
            <p className="text-0 text-gray-900 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              {initialData?.email}
            </p>
            <p className="mt-1 text--1 text-gray-500">
              Email cannot be changed at this time
            </p>
          </div>

          <TextField
            label="Username"
            {...registerAccount("username", {
              required: "Username is required",
              minLength: {
                value: 3,
                message: "Username must be at least 3 characters",
              },
              maxLength: {
                value: 20,
                message: "Username must be at most 20 characters",
              },
            })}
            error={accountErrors.username?.message}
            helper="Used for login and public profile"
          />

          <TextField
            label="Full Name"
            {...registerAccount("name", {
              required: "Full name is required",
              minLength: {
                value: 2,
                message: "Name must be at least 2 characters",
              },
            })}
            error={accountErrors.name?.message}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isAccountDirty || isAccountSubmitting}
              className={`px-4 py-2 text-0 font-medium rounded-lg transition-colors ${
                !isAccountDirty || isAccountSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-maroon text-white hover:bg-maroon-dark"
              }`}
            >
              {isAccountSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Section */}
      <div className="pt-(--space-l) border-t border-gray-200 space-y-(--space-m)">
        <div>
          <h3 className="text-1 font-semibold text-gray-900 mb-(--space-xs)">
            Change Password
          </h3>
          <p className="text--1 text-gray-600">
            Update your password to keep your account secure
          </p>
        </div>

        {passwordSuccess && (
          <InlineAlert
            type="success"
            onDismiss={() => setPasswordSuccess(null)}
          >
            {passwordSuccess}
          </InlineAlert>
        )}
        {passwordError && (
          <InlineAlert type="error" onDismiss={() => setPasswordError(null)}>
            {passwordError}
          </InlineAlert>
        )}

        <form
          onSubmit={handlePasswordSubmit(handlePasswordFormSubmit)}
          className="space-y-(--space-m)"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-(--space-m)">
            <PasswordField
              label="Current Password"
              placeholder="Enter current password"
              autoComplete="current-password"
              {...registerPassword("currentPassword", {
                required: "Current password is required",
              })}
              error={passwordErrors.currentPassword?.message}
            />
            <PasswordField
              label="New Password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              {...registerPassword("newPassword", {
                required: "New password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              error={passwordErrors.newPassword?.message}
            />
            <PasswordField
              label="Confirm New Password"
              placeholder="Re-enter new password"
              autoComplete="new-password"
              {...registerPassword("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) => {
                  if (value !== newPassword) {
                    return "Passwords do not match";
                  }
                  return true;
                },
              })}
              error={passwordErrors.confirmPassword?.message}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPasswordSubmitting}
              className={`px-4 py-2 text-0 font-medium rounded-lg transition-colors ${
                isPasswordSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-maroon text-white hover:bg-maroon-dark"
              }`}
            >
              {isPasswordSubmitting ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Account Created Date */}
      {initialData?.createdAt && (
        <div className="pt-(--space-m) border-t border-gray-200">
          <p className="text--1 text-gray-500">
            Account created:{" "}
            {new Date(initialData.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
