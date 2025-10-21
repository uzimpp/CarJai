import { useId } from "react";

export interface CheckOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface CheckBoxesProps<T extends string | number> {
  name: string;
  label?: string;
  description?: string;
  values: ReadonlyArray<T> | null | undefined;
  options: ReadonlyArray<CheckOption<T>>;
  onChange: (values: T[]) => void;
  direction?: "row" | "column";
  disabled?: boolean;
  error?: string;
}

export function CheckBoxes<T extends string | number>({
  name,
  label,
  description,
  values,
  options,
  onChange,
  direction = "column",
  disabled = false,
  error,
}: CheckBoxesProps<T>) {
  const groupId = useId();
  const selected = new Set((values ?? []) as ReadonlyArray<T>);

  const toggle = (val: T) => {
    const next = new Set(selected);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    onChange(Array.from(next));
  };

  return (
    <fieldset aria-describedby={description ? `${groupId}-desc` : undefined}>
      {label && (
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          {label}
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
          const checked = selected.has(option.value);
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
                type="checkbox"
                id={id}
                name={name}
                value={String(option.value)}
                checked={checked}
                disabled={disabled || option.disabled}
                onChange={() => toggle(option.value)}
                className="mt-0.5 h-4 w-4 text-maroon focus:ring-red-500 border-gray-300"
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

export default CheckBoxes;
