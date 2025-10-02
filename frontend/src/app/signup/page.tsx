"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserAuth } from "@/hooks/useUserAuth";
import { validation } from "@/lib/profileAPI";
import GoogleSigninButton from "@/components/auth/GoogleSigninButton";

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated, isLoading, error, clearError } =
    useUserAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    name: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated - check if they have roles already
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // If user already has a role, redirect them appropriately
      // This handles users who already completed signup coming back to this page
      router.push("/signup/role");
    }
  }, [isAuthenticated, isLoading, router]);

  // Clear errors when user starts typing
  useEffect(() => {
    if (
      error &&
      (formData.email ||
        formData.password ||
        formData.confirmPassword ||
        formData.username ||
        formData.name)
    ) {
      clearError();
    }
  }, [
    formData.email,
    formData.password,
    formData.confirmPassword,
    formData.username,
    formData.name,
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

    if (!formData.username) {
      errors.username = "Please enter a username";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 20) {
      errors.username = "Username must be less than 20 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    if (!formData.name) {
      errors.name = "Please enter your full name";
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      errors.name = "Name must be less than 100 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await signup({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        name: formData.name,
      });
      if (result.success) {
        // Account created successfully, wait a moment for state to update, then redirect
        setTimeout(() => {
          router.push("/signup/role");
        }, 100);
      } else if (result.error?.includes("already exists")) {
        router.push("/signin?message=account_exists");
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
        <div className="text-center mb-(--space-m-l)">
          <h2 className="text-4 font-bold line-height-12">Create an account</h2>
        </div>

        {/* Form */}
        <form
          className="flex flex-col gap-y-(--space-l) w-full"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col space-y-(--space-s)">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-0 font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 text-0 border ${
                  formErrors.name
                    ? "border-red-300 focus:ring-red focus:border-red"
                    : "border-gray-300 focus:ring-maroon focus:border-maroon"
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10`}
                placeholder="Enter your full name"
              />
              {formErrors.name && (
                <p className="mt-1 text-0 text-red-600">{formErrors.name}</p>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-0 font-medium text-gray-700"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 text-0 border ${
                  formErrors.username
                    ? "border-red-300 focus:ring-red focus:border-red"
                    : "border-gray-300 focus:ring-maroon focus:border-maroon"
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10`}
                placeholder="Choose a username"
              />
              {formErrors.username && (
                <p className="mt-1 text-0 text-red-600">
                  {formErrors.username}
                </p>
              )}
              <p className="mt-1 text--1 text-gray-500">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

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
                className={`mt-1 appearance-none relative block w-full px-3 py-2 text-0 border ${
                  formErrors.email
                    ? "border-red-300 focus:ring-red focus:border-red"
                    : "border-gray-300 focus:ring-maroon focus:border-maroon"
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10`}
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
                className={`mt-1 appearance-none relative block w-full px-3 py-2 text-0 border ${
                  formErrors.confirmPassword
                    ? "border-red-300 focus:ring-red focus:border-red"
                    : "border-gray-300 focus:ring-maroon focus:border-maroon"
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:z-10`}
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
                    {error.message.includes("already exists")
                      ? "This email already has an account. Please use a different email."
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
                Creating account...
              </div>
            ) : (
              "Continue"
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

          {/* Google Signup Button */}
          <div className="">
            <GoogleSigninButton mode="signup" disabled={isSubmitting} />
          </div>
        </div>
        {/* Additional Links */}
        <div className="text-center mt-(--space-xs)">
          <Link
            href="/signin"
            className="text--1 hover:text-maroon transition-colors"
          >
            Already have an account?
          </Link>
        </div>
      </div>
    </div>
  );
}
