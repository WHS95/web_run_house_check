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
      className={`text-rh-small transition-colors duration-200 ${
        isActive ? "text-rh-accent font-semibold" : "text-rh-text-muted font-medium"
      }`}
    >
      {text}
    </span>
  );
};

export default NavigationLabel;
