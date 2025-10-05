"use client";

import { useState, useEffect } from "react";
import { SellerRequest, SellerContactRequest } from "@/constants/user";

interface SellerFormProps {
  initialData?: SellerRequest;
  initialContacts?: SellerContactRequest[];
  onSubmit: (data: SellerRequest) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

const CONTACT_TYPES = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "line", label: "LINE" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "website", label: "Website" },
];

export default function SellerForm({
  initialData,
  initialContacts = [],
  onSubmit,
  onCancel,
  submitLabel = "Save",
  isLoading = false,
}: SellerFormProps) {
  const [formData, setFormData] = useState<SellerRequest>({
    displayName: initialData?.displayName || "",
    about: initialData?.about || "",
    mapLink: initialData?.mapLink || "",
    contacts: initialContacts.length > 0 ? initialContacts : [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        displayName: initialData.displayName || "",
        about: initialData.about || "",
        mapLink: initialData.mapLink || "",
        contacts: initialContacts.length > 0 ? initialContacts : [],
      });
    }
  }, [initialData, initialContacts]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? null : value,
    }));

    // Clear field-specific error
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleAddContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        { contactType: "phone", value: "", label: null },
      ],
    }));
  };

  const handleRemoveContact = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
    }));
  };

  const handleContactChange = (
    index: number,
    field: keyof SellerContactRequest,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) =>
        i === index
          ? { ...contact, [field]: value === "" ? null : value }
          : contact
      ),
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.displayName || formData.displayName.trim() === "") {
      errors.displayName = "Display name is required";
    } else if (formData.displayName.length > 50) {
      errors.displayName = "Display name must be 50 characters or less";
    }

    if (formData.about && formData.about.length > 200) {
      errors.about = "About must be 200 characters or less";
    }

    // Validate contacts
    formData.contacts.forEach((contact, index) => {
      if (!contact.value || contact.value.trim() === "") {
        errors[`contact_${index}_value`] = "Contact value is required";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-(--space-m)">
      {/* Display Name Field */}
      <div>
        <label
          htmlFor="displayName"
          className="block text-0 font-medium text-gray-700 mb-1"
        >
          Display Name <span className="text-red-500">*</span>
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          value={formData.displayName || ""}
          onChange={handleInputChange}
          placeholder="e.g., CarJai Motors"
          disabled={isLoading || isSubmitting}
          maxLength={50}
          className={`appearance-none relative block w-full px-3 py-2 text-0 border ${
            formErrors.displayName
              ? "border-red-300 focus:ring-red focus:border-red"
              : "border-gray-300 focus:ring-maroon focus:border-maroon"
          } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {formErrors.displayName && (
          <p className="mt-1 text--1 text-red-600">{formErrors.displayName}</p>
        )}
        <p className="mt-1 text--1 text-gray-500">
          {formData.displayName?.length || 0}/50 characters
        </p>
      </div>

      {/* About Field */}
      <div>
        <label
          htmlFor="about"
          className="block text-0 font-medium text-gray-700 mb-1"
        >
          About
        </label>
        <textarea
          id="about"
          name="about"
          value={formData.about || ""}
          onChange={handleInputChange}
          placeholder="Brief description of your dealership"
          disabled={isLoading || isSubmitting}
          maxLength={200}
          rows={3}
          className={`appearance-none relative block w-full px-3 py-2 text-0 border ${
            formErrors.about
              ? "border-red-300 focus:ring-red focus:border-red"
              : "border-gray-300 focus:ring-maroon focus:border-maroon"
          } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none`}
        />
        {formErrors.about && (
          <p className="mt-1 text--1 text-red-600">{formErrors.about}</p>
        )}
        <p className="mt-1 text--1 text-gray-500">
          {formData.about?.length || 0}/200 characters
        </p>
      </div>

      {/* Map Link Field */}
      <div>
        <label
          htmlFor="mapLink"
          className="block text-0 font-medium text-gray-700 mb-1"
        >
          Map Link
        </label>
        <input
          id="mapLink"
          name="mapLink"
          type="url"
          value={formData.mapLink || ""}
          onChange={handleInputChange}
          placeholder="e.g., https://maps.google.com/..."
          disabled={isLoading || isSubmitting}
          className={`appearance-none relative block w-full px-3 py-2 text-0 border ${
            formErrors.mapLink
              ? "border-red-300 focus:ring-red focus:border-red"
              : "border-gray-300 focus:ring-maroon focus:border-maroon"
          } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {formErrors.mapLink && (
          <p className="mt-1 text--1 text-red-600">{formErrors.mapLink}</p>
        )}
      </div>

      {/* Contacts Section */}
      <div className="border-t pt-(--space-m)">
        <div className="flex justify-between items-center mb-(--space-s)">
          <h3 className="text-0 font-medium text-gray-900">
            Contact Information
          </h3>
          <button
            type="button"
            onClick={handleAddContact}
            disabled={isLoading || isSubmitting}
            className="text--1 text-maroon hover:text-maroon-dark font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Contact
          </button>
        </div>

        {formData.contacts.length === 0 && (
          <p className="text--1 text-gray-500 italic">
            No contacts added. Click &quot;Add Contact&quot; to add one.
          </p>
        )}

        <div className="flex flex-col gap-y-(--space-s)">
          {formData.contacts.map((contact, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-(--space-s)"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-(--space-s)">
                {/* Contact Type */}
                <div>
                  <label
                    htmlFor={`contact-type-${index}`}
                    className="block text--1 font-medium text-gray-700 mb-1"
                  >
                    Type
                  </label>
                  <select
                    id={`contact-type-${index}`}
                    value={contact.contactType}
                    onChange={(e) =>
                      handleContactChange(index, "contactType", e.target.value)
                    }
                    disabled={isLoading || isSubmitting}
                    className="appearance-none relative block w-full px-3 py-2 text--1 border border-gray-300 focus:ring-maroon focus:border-maroon text-gray-900 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {CONTACT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact Value */}
                <div>
                  <label
                    htmlFor={`contact-value-${index}`}
                    className="block text--1 font-medium text-gray-700 mb-1"
                  >
                    Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    id={`contact-value-${index}`}
                    type="text"
                    value={contact.value}
                    onChange={(e) =>
                      handleContactChange(index, "value", e.target.value)
                    }
                    placeholder="e.g., 081-234-5678"
                    disabled={isLoading || isSubmitting}
                    className={`appearance-none relative block w-full px-3 py-2 text--1 border ${
                      formErrors[`contact_${index}_value`]
                        ? "border-red-300 focus:ring-red focus:border-red"
                        : "border-gray-300 focus:ring-maroon focus:border-maroon"
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  {formErrors[`contact_${index}_value`] && (
                    <p className="mt-1 text--1 text-red-600">
                      {formErrors[`contact_${index}_value`]}
                    </p>
                  )}
                </div>

                {/* Contact Label */}
                <div className="flex gap-x-(--space-2xs)">
                  <div className="flex-1">
                    <label
                      htmlFor={`contact-label-${index}`}
                      className="block text--1 font-medium text-gray-700 mb-1"
                    >
                      Label
                    </label>
                    <input
                      id={`contact-label-${index}`}
                      type="text"
                      value={contact.label || ""}
                      onChange={(e) =>
                        handleContactChange(index, "label", e.target.value)
                      }
                      placeholder="e.g., Sales"
                      disabled={isLoading || isSubmitting}
                      maxLength={80}
                      className="appearance-none relative block w-full px-3 py-2 text--1 border border-gray-300 focus:ring-maroon focus:border-maroon placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(index)}
                      disabled={isLoading || isSubmitting}
                      className="px-(--space-2xs) py-(--space-2xs) text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove contact"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-x-(--space-s) justify-end border-t pt-(--space-m)">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting || isLoading}
            className="px-(--space-m) py-(--space-2xs) border border-gray-300 text-0 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="px-(--space-m) py-(--space-2xs) border border-transparent text-0 font-medium rounded-lg text-white bg-black hover:bg-maroon focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maroon disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-(--space-s) w-(--space-s) border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
