"use client";

import React from "react";

interface AdminPageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full";
}

export default function AdminPageContainer({
  children,
  className = "",
  maxWidth = "7xl",
}: AdminPageContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div className='min-h-screen bg-rh-bg-primary'>
      <div className={`p-4 lg:p-6 space-y-6 ${maxWidthClasses[maxWidth]} mx-auto ${className}`}>
        {children}
      </div>
    </div>
  );
}