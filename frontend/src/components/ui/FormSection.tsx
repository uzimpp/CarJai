import { ReactNode } from "react";

export interface FormSectionProps {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({
  id,
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section id={id} className="mb-(--space-xl)">
      <div className="mb-(--space-m)">
        <h2 className="text-3 font-bold text-gray-900">{title}</h2>
        {description && (
          <p className="text--1 text-gray-600 mt-1">{description}</p>
        )}
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-(--space-l)">
        {children}
      </div>
    </section>
  );
}
