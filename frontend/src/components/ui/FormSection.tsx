import { ReactNode } from "react";

export interface FormSectionProps {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  required?: boolean;
}

export function FormSection({
  id,
  title,
  description,
  children,
  required = false,
}: FormSectionProps) {
  return (
    <section id={id} className="mb-(--space-xl)">
      <div className="mb-(--space-m)">
        <h2 className="text-2 font-bold text-gray-900">
          {title}
          {required && <span className="text-red-600 ml-1">*</span>}
        </h2>
        {description && (
          <p className="text--1 text-gray-600 mt-1">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
