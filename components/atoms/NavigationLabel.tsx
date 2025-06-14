import React from "react";

interface NavigationLabelProps {
  text: string;
  isActive?: boolean;
}

const NavigationLabel: React.FC<NavigationLabelProps> = ({
  text,
  isActive = false,
}) => {
  return (
    <span
      className={`text-xs font-medium transition-colors duration-200 ${
        isActive ? "text-white" : "text-gray-400"
      }`}
    >
      {text}
    </span>
  );
};

export default NavigationLabel;
