import { ReactNode } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export interface InlineAlertProps {
  type: "success" | "error" | "warning" | "info";
  children: ReactNode;
  onDismiss?: () => void;
}

const styles = {
  success: {
    container: "bg-green-50 border-green-200",
    icon: "text-green-600",
    text: "text-green-800",
    Icon: CheckCircleIcon,
  },
  error: {
    container: "bg-red-50 border-red-200",
    icon: "text-red-600",
    text: "text-red-800",
    Icon: XCircleIcon,
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200",
    icon: "text-yellow-600",
    text: "text-yellow-800",
    Icon: ExclamationCircleIcon,
  },
  info: {
    container: "bg-blue-50 border-blue-200",
    icon: "text-blue-600",
    text: "text-blue-800",
    Icon: InformationCircleIcon,
  },
};

export function InlineAlert({ type, children, onDismiss }: InlineAlertProps) {
  const style = styles[type];
  const Icon = style.Icon;

  return (
    <div
      className={`flex items-start gap-(--space-xs) p-(--space-s) rounded-lg border ${style.container} mb-(--space-m)`}
    >
      <Icon className={`h-6 w-6 ${style.icon} flex-shrink-0`} />
      <p className={`text-0 ${style.text} flex-1`}>{children}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={`${style.icon} hover:opacity-70 flex-shrink-0`}
        >
          <XCircleIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
