"use client";

import { Fragment, ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <Fragment>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-2xl shadow-[var(--shadow-lg)] w-full ${sizeClasses[size]} animate-in fade-in zoom-in-95 duration-200`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="border-b border-gray-200 px-(--space-l) py-(--space-m)">
              <h3 className="text-2 font-bold text-gray-900">{title}</h3>
            </div>
          )}
          <div className="p-(--space-l)">{children}</div>
        </div>
      </div>
    </Fragment>
  );
}
