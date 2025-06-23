"use client";

import { useState, useCallback } from "react";

interface Toast {
  id: string;
  description: string;
  duration?: number;
}

interface ToastOptions {
  description: string;
  duration?: number;
}

let toastId = 0;

const generateId = () => {
  toastId += 1;
  return toastId.toString();
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = generateId();
    const newToast: Toast = {
      id,
      description: options.description,
      duration: options.duration || 3000,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, newToast.duration);

    // Simple native notification for mobile
    if (typeof window !== "undefined" && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
}
