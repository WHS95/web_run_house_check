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
    <div className={`${bgColor} rounded-t-lg  p-4   ${className}`}>
      {children}
    </div>
  );
};

export default Card;
