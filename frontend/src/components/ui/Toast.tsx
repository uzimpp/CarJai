"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Toast {
  id: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-[300px] max-w-md rounded-lg shadow-[var(--shadow-lg)] p-(--space-m) animate-in slide-in-from-bottom-2 duration-300 ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : toast.type === "error"
              ? "bg-red-50 border border-red-200 text-red-800"
              : toast.type === "warning"
              ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
              : "bg-blue-50 border border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-0 font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (
    message: string,
    type: Toast["type"] = "info",
    duration = 5000
  ) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const ToastContainerComponent = mounted
    ? createPortal(
        <ToastContainer toasts={toasts} onRemove={removeToast} />,
        document.body
      )
    : null;

  return {
    showToast,
    removeToast,
    ToastContainer: ToastContainerComponent,
  };
}
