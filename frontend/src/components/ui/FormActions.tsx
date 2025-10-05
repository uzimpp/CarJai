export interface FormActionsProps {
  isSubmitting?: boolean;
  isDirty?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

export function FormActions({
  isSubmitting = false,
  isDirty = false,
  onCancel,
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-(--space-s) pt-(--space-m)">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-(--space-m) py-(--space-2xs) border border-gray-300 text-0 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelLabel}
        </button>
      )}
      <button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="px-(--space-m) py-(--space-2xs) border border-transparent text-0 font-medium rounded-lg text-white bg-maroon hover:bg-red transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
