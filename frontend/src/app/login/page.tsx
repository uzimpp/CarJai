"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUserAuth } from "@/hooks/useUserAuth";
import { validation } from "@/lib/userAuth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading, error, clearError } =
    useUserAuth();

  const [formData, setFormData] = useState({
    email: "",
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
    if (error && (formData.email || formData.password)) {
      clearError();
    }
  }, [formData.email, formData.password, clearError, error]);

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

    if (!formData.email) {
      errors.email = "Please enter your email";
    } else if (!validation.email(formData.email)) {
      errors.email = "Invalid email format";
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
      await login(formData);
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
    <div className="flex items-center justify-center px-(--space-m) max-w-[1536px] mx-auto w-full">
      <div className="max-w-md w-full gap-y-(--space-l) p-(--space-m)">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-5 font-bold line-height-0">Sign in</h2>
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
                  Account already exists. Please login instead.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          className="mt-(--space-l) space-y-(--space-m)"
          onSubmit={handleSubmit}
        >
          <div className="space-y-(--space-s)">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-0 font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  formErrors.email
                    ? "border-red-300 focus:ring-red focus:border-red"
                    : "border-gray-300 focus:ring-maroon focus:border-maroon"
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10 sm:text-sm transition-colors`}
                placeholder="Enter your email"
              />
              {formErrors.email && (
                <p className="mt-1 text-0 text-red-600">{formErrors.email}</p>
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
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  formErrors.password
                    ? "border-red-300 focus:ring-red focus:border-red"
                    : "border-gray-300 focus:ring-maroon focus:border-maroon"
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10 sm:text-sm transition-colors`}
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
                    className="h-(--space-s) w-(--space-s) text-red-400"
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
                <div className="ml-(--space-s)">
                  <p className="text-0 text-red-600">
                    {error.message.includes("invalid credentials")
                      ? "Invalid email or password"
                      : error.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="py-(--space-2xs)">
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
                "Sign In"
              )}
            </button>
          </div>
        </form>
        {/* Additional Links */}
        <div className="text-center ">
          <Link
            href="/signup"
            className="text--1 hover:text-maroon transition-colors"
          >
            Don't have an account?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
