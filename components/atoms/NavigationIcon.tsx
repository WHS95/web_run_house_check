import React from "react";
import { Home, ClipboardCheck, Trophy, User, Menu } from "lucide-react";

export type NavigationIconType =
  | "home"
  | "attendance"
  | "ranking"
  | "mypage"
  | "menu";

interface NavigationIconProps {
  type: NavigationIconType;
  isActive?: boolean;
  size?: number;
}

const iconMap = {
  home: Home,
  attendance: ClipboardCheck,
  ranking: Trophy,
  mypage: User,
  menu: Menu,
};

const NavigationIcon: React.FC<NavigationIconProps> = ({
  type,
  isActive = false,
  size = 24,
}) => {
  const IconComponent = iconMap[type];

  return (
    <IconComponent
      size={size}
      className={`transition-colors duration-200 ${
        isActive ? "text-white" : "text-gray-400"
      }`}
    />
  );
};

export default NavigationIcon;
