"use client";

import React, { useRef } from "react";
import { haptic } from "@/lib/haptic";

interface NativeButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  fullWidth?: boolean;
  hapticFeedback?: "light" | "medium" | "heavy";
  className?: string;
}

const NativeButton: React.FC<NativeButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  hapticFeedback = "light",
  className = "",
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (disabled) return;

    // 햅틱 피드백
    haptic[hapticFeedback]();

    // 터치 애니메이션
    if (buttonRef.current) {
      buttonRef.current.style.transform = "scale(0.96)";
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.style.transform = "scale(1)";
        }
      }, 150);
    }

    onClick?.();
  };

  const baseClasses = `
        relative overflow-hidden rounded-xl font-semibold 
        transition-all duration-150 ease-out
        active:scale-96 focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-sm active:shadow-inner
    `;

  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    success: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled}
      className={`
                ${baseClasses}
                ${variantClasses[variant]}
                ${sizeClasses[size]}
                ${widthClass}
                ${className}
            `}
      style={{
        WebkitTapHighlightColor: "transparent",
        transform: "scale(1)",
        transition: "transform 0.15s ease-out",
      }}
    >
      {children}
    </button>
  );
};

export default NativeButton;
