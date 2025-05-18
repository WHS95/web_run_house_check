import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  bgColor?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  bgColor = "bg-white",
}) => {
  return (
    <div
      className={`${bgColor} rounded-t-lg shadow-md p-4 border border-opacity-10 border-white ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
