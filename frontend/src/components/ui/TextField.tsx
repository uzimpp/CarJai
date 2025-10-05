import { forwardRef, InputHTMLAttributes } from "react";

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;
  helper?: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, helper, error, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-0 font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`appearance-none relative block w-full px-3 py-2 text-0 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-maroon focus:border-transparent transition-colors ${
            error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
          } ${disabled ? "bg-gray-50 opacity-50 cursor-not-allowed" : ""}`}
          {...props}
        />
        {helper && !error && (
          <p className="mt-1 text--1 text-gray-500">{helper}</p>
        )}
        {error && <p className="mt-1 text--1 text-red-600">{error}</p>}
      </div>
    );
  }
);

TextField.displayName = "TextField";
