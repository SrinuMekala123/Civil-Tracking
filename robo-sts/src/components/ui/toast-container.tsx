"use client";

import { useNotificationsStore } from "@/store/notifications-store";
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export function ToastContainer() {
  const toasts = useNotificationsStore((s) => s.toasts);
  const removeToast = useNotificationsStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "success":
        return "border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/20";
      case "warning":
        return "border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/20";
      case "error":
        return "border-red-500/30 bg-red-50/90 dark:bg-red-950/20";
      default:
        return "border-blue-500/30 bg-blue-50/90 dark:bg-blue-950/20";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 animate-slide-in ${getTypeStyles(
            toast.type
          )}`}
        >
          {getIcon(toast.type)}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white leading-snug">
              {toast.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed break-words">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
