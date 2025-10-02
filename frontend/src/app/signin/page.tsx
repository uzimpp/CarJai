"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUserAuth } from "@/hooks/useUserAuth";
import { validation } from "@/lib/profileAPI";
import GoogleSigninButton from "@/components/auth/GoogleSigninButton";

function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signin, isAuthenticated, isLoading, error, clearError } =
    useUserAuth();

  const [formData, setFormData] = useState({
    email_or_username: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/buy");
    }
  }, [isAuthenticated, isLoading, router]);

  // Check for redirect message
  const redirectMessage = searchParams.get("message");

  // Clear errors when user starts typing
  useEffect(() => {
    if (error && (formData.email_or_username || formData.password)) {
      clearError();
    }
  }, [formData.email_or_username, formData.password, clearError, error]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific error
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email_or_username) {
      errors.email_or_username = "Please enter your email or username";
    } else if (
      formData.email_or_username.includes("@") &&
      !validation.email(formData.email_or_username)
    ) {
      errors.email_or_username = "Invalid email format";
    }

    if (!formData.password) {
      errors.password = "Please enter your password";
    } else if (!validation.password(formData.password)) {
      errors.password = "Password must be at least 6 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await signin(formData);
      if (result.success) {
        router.push("/buy");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center max-w-[1536px] mx-auto w-full p-(--space-s-m) my-(--space-xl-2xl)">
      <div className="flex flex-col max-w-[480px] w-full p-(--space-s-m) pt-(--space-m-l) rounded-xl mx-auto">
        {/* Header */}
        <div className="flex text-center mb-(--space-m-l) w-full justify-center mx-auto">
          <h2 className="text-4 font-bold line-height-0">Sign in</h2>
        </div>

        {/* Redirect Message */}
        {redirectMessage === "account_exists" && (
          <div className="bg-maroon/5 border border-maroon/20 rounded-lg p-(--space-s)">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-(--space-s) w-(--space-s) text-maroon"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-(--space-s)">
                <p className="text--1 text-maroon">
                  Account already exists. Please signin instead.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          className="flex flex-col gap-y-(--space-l)"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col space-y-(--space-s)">
            {/* Email/Username Field */}
            <div>
              <label
                htmlFor="email_or_username"
                className="block text-0 font-medium text-gray-700"
              >
                Email or Username
              </label>
              <input
                id="email_or_username"
                name="email_or_username"
                type="text"
                autoComplete="username"
                autoFocus
                value={formData.email_or_username}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 text-0 border ${
                  formErrors.email_or_username
                    ? "border-red-300 focus:ring-red focus:border-red"
                    : "border-gray-300 focus:ring-maroon focus:border-maroon"
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10`}
                placeholder="Enter your email or username"
              />
              {formErrors.email_or_username && (
                <p className="mt-1 text-0 text-red-600">
                  {formErrors.email_or_username}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-0 font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 text-0 border ${
                  formErrors.password
                    ? "border-red-300 focus:ring-red focus:border-red"
                    : "border-gray-300 focus:ring-maroon focus:border-maroon"
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10`}
                placeholder="Enter your password"
              />
              {formErrors.password && (
                <p className="mt-1 text-0 text-red-600">
                  {formErrors.password}
                </p>
              )}
            </div>
          </div>

          {/* General Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-(--space-s)">
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
                  <p className="text-0 text-red-600">
                    {error.message.includes("invalid credentials")
                      ? "Invalid email/username or password"
                      : error.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-(--space-2xs) px-(--space-s) border border-transparent text-0 font-medium rounded-lg text-white bg-black hover:bg-maroon focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-(--space-s) w-(--space-s) border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
        <div className="">
          {/* Divider */}
          <div className="relative my-(--space-3xs)">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text--1">
              <span className="px-2 bg-white text-gray-400">or</span>
            </div>
          </div>

          {/* Google Signin Button */}
          <div className="">
            <GoogleSigninButton mode="signin" disabled={isSubmitting} />
          </div>
        </div>
        {/* Additional Links */}
        <div className="text-center mt-(--space-xs)">
          <Link
            href="/signup"
            className="text--1 hover:text-maroon transition-colors"
          >
            Don&apos;t have an account?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SigninPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SigninForm />
    </Suspense>
  );
}
