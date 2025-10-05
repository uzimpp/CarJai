import { forwardRef, InputHTMLAttributes, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export interface PasswordFieldProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "className" | "autoComplete"
  > {
  label?: string;
  helper?: string;
  error?: string;
  showToggle?: boolean;
  autoComplete?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      label,
      helper,
      error,
      disabled,
      showToggle = true,
      autoComplete = "current-password",
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-0 font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            disabled={disabled}
            autoComplete={autoComplete}
            className={`appearance-none relative block w-full px-3 py-2 text-0 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-maroon focus:border-transparent transition-colors ${
              showToggle ? "pr-10" : ""
            } ${
              error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
            } ${disabled ? "bg-gray-50 opacity-50 cursor-not-allowed" : ""}`}
            {...props}
          />
          {showToggle && !disabled && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        {helper && !error && (
          <p className="mt-1 text--1 text-gray-500">{helper}</p>
        )}
        {error && <p className="mt-1 text--1 text-red-600">{error}</p>}
      </div>
    );
  }
);

PasswordField.displayName = "PasswordField";
