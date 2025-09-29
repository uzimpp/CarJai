"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserAuth } from "@/hooks/useUserAuth";
import { validation } from "@/lib/userAuth";

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated, isLoading, error, clearError } =
    useUserAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/buy");
    }
  }, [isAuthenticated, isLoading, router]);

  // Clear errors when user starts typing
  useEffect(() => {
    if (
      error &&
      (formData.email || formData.password || formData.confirmPassword)
    ) {
      clearError();
    }
  }, [
    formData.email,
    formData.password,
    formData.confirmPassword,
    clearError,
    error,
  ]);

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

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await signup({
        email: formData.email,
        password: formData.password,
      });
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
    <div className="flex items-center justify-center p-(--space-m) ">
      <div className="max-w-md w-full gap-y-(--space-l)">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-5 font-bold line-height-0">
            Get Started on CarJai
          </h2>
        </div>

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
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  formErrors.email
                    ? "border-red-300 focus:ring-red focus:border-red"
                    : "border-gray-300 focus:ring-maroon focus:border-maroon"
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10 sm:text-sm`}
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
                autoComplete="new-password"
                value={formData.password}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  formErrors.password
                    ? "border-red-300 focus:ring-red focus:border-red"
                    : "border-gray-300 focus:ring-maroon focus:border-maroon"
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="Enter your password"
              />
              {formErrors.password && (
                <p className="mt-1 text-0 text-red-600">
                  {formErrors.password}
                </p>
              )}
              <p className="mt-1 text--1 text-gray-500">
                Password must be at least 6 characters
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-0 font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  formErrors.confirmPassword
                    ? "border-red-300 focus:ring-red focus:border-red"
                    : "border-gray-300 focus:ring-maroon focus:border-maroon"
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="Enter password again"
              />
              {formErrors.confirmPassword && (
                <p className="mt-1 text-0 text-red-600">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* General Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
                    {error.message.includes("already exists")
                      ? "This email already has an account. Please use a different email."
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
                  Creating account...
                </div>
              ) : (
                "Sign Up"
              )}
            </button>
          </div>
        </form>
        {/* Additional Links */}
        <div className="text-center ">
          <Link
            href="/login"
            className="text--1 hover:text-maroon transition-colors"
          >
            Already have an account?
          </Link>
        </div>
      </div>
    </div>
  );
}
