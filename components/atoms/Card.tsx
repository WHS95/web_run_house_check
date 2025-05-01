import React from "react";

interface CardProps {
  children: React.ReactNode;
  bgColor?: string;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  bgColor = "bg-white",
  className = "",
}) => {
  return (
    <div className={`card ${bgColor} ${className} w-full`}>
      <div className='max-w-md mx-auto px-5'>{children}</div>
    </div>
  );
};

export default Card;
