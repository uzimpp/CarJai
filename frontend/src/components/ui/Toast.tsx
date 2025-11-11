"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

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

function ToastItem({
  toast,
  onRemove,
  isMobile,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
  isMobile: boolean;
}) {
  const handleRemove = () => {
    onRemove(toast.id);
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          text: "text-green-800",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          icon: <CheckCircleIcon className="w-6 h-6" />,
        };
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-800",
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          icon: <XCircleIcon className="w-6 h-6" />,
        };
      case "warning":
        return {
          bg: "bg-yellow-60",
          border: "border-yellow-200",
          text: "text-yellow-800",
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          icon: <ExclamationCircleIcon className="w-6 h-6" />,
        };
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-800",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          icon: <InformationCircleIcon className="w-6 h-6" />,
        };
    }
  };

  const styles = getToastStyles();

  // Animation variants based on screen size
  const variants = {
    initial: isMobile ? { opacity: 0, y: 100 } : { opacity: 0, x: 100 },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
    },
    exit: isMobile ? { opacity: 0, y: 100 } : { opacity: 0, x: 100 },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`w-full max-w-md rounded-3xl shadow-lg p-(--space-s-m) ${styles.bg} ${styles.text} border border-white/20`}
    >
      <div className="flex items-center gap-x-(--space-s)">
        {/* Icon */}
        <div className={`rounded-full`}>{styles.icon}</div>

        {/* Message */}
        <p className="text-0 font-medium flex-1 pt-0.5">{toast.message}</p>

        {/* Close Button */}
        <button
          onClick={handleRemove}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-black/5"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.4}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  // Only show the most recent toast (no stacking)
  const currentToast = toasts.length > 0 ? toasts[toasts.length - 1] : null;

  // Detect mobile screen size
  const [mobileState, setMobileState] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setMobileState(window.innerWidth < 768);
    };
    // Check on mount
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [window.innerWidth]);

  return (
    <div className="fixed bottom-(--space-s-m) left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-(--space-s-m) md:bottom-(--space-s-m) z-[100] pointer-events-none w-full max-w-md md:px-0 md:w-auto">
      <AnimatePresence mode="wait">
        {currentToast && (
          <div key={currentToast.id} className="pointer-events-auto">
            <ToastItem
              toast={currentToast}
              onRemove={onRemove}
              isMobile={mobileState}
            />
          </div>
        )}
      </AnimatePresence>
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

    // Replace existing toast instead of stacking
    setToasts([newToast]);

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
