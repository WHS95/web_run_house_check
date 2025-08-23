import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "white" | "blue" | "gray" | "red";
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "white",
  className = "",
}) => {
  // 크기별 클래스 정의
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  };

  // 색상별 클래스 정의
  const colorClasses = {
    white: "bg-white",
    blue: "bg-basic-blue",
    gray: "bg-gray-400",
    red: "bg-red-400",
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full splash-dot`}
      ></div>
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full splash-dot`}
      ></div>
      <div
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full splash-dot`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
