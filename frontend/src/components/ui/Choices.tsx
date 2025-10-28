import { useId } from "react";

export interface ChoiceOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ChoicesProps<T extends string | number> {
  name: string;
  label?: string;
  description?: string;
  value: T | null | undefined;
  options: ReadonlyArray<ChoiceOption<T>>;
  onChange: (value: T) => void;
  direction?: "row" | "column";
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export function Choices<T extends string | number>({
  name,
  label,
  description,
  value,
  options,
  onChange,
  direction = "column",
  required = false,
  disabled = false,
  error,
}: ChoicesProps<T>) {
  const groupId = useId();

  return (
    <fieldset aria-describedby={description ? `${groupId}-desc` : undefined}>
      {label && (
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600">*</span>}
        </legend>
      )}
      {description && (
        <p id={`${groupId}-desc`} className="text--1 text-gray-600 mb-2">
          {description}
        </p>
      )}

      <div
        className={
          direction === "row"
            ? "flex gap-(--space-s) flex-wrap"
            : "space-y-(--space-2xs)"
        }
      >
        {options.map((option) => {
          const id = `${groupId}-${String(option.value)}`;
          const checked = value === option.value;
          return (
            <label
              key={String(option.value)}
              htmlFor={id}
              className={
                "flex items-start gap-2 rounded-lg border p-(--space-2xs) cursor-pointer transition-colors " +
                (checked
                  ? "border-maroon bg-red/5"
                  : "border-gray-300 hover:bg-gray-50") +
                (disabled || option.disabled
                  ? " opacity-60 cursor-not-allowed"
                  : "")
              }
            >
              <input
                type="radio"
                id={id}
                name={name}
                value={String(option.value)}
                checked={checked}
                disabled={disabled || option.disabled}
                onChange={() => onChange(option.value)}
                className="mt-0.5 h-4 w-4 text-maroon focus:ring-red-500 border-gray-300"
                required={required}
              />
              <div>
                <div className="text-0 text-gray-900">{option.label}</div>
                {option.description && (
                  <div className="text--1 text-gray-600">
                    {option.description}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error && (
        <p className="text--1 text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export default Choices;
