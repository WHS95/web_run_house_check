'use client';

import React from "react";
import NavigationIcon, {
  NavigationIconType,
} from "@/components/atoms/NavigationIcon";
import NavigationLabel from "@/components/atoms/NavigationLabel";
import { useNavigation } from "@/components/providers/NavigationProvider";

interface InstantNavigationItemProps {
  type: NavigationIconType;
  label: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
}

const InstantNavigationItem: React.FC<InstantNavigationItemProps> = ({
  type,
  label,
  href,
  isActive = false,
  onClick,
}) => {
  const { navigate } = useNavigation();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // 이미 현재 페이지라면 네비게이션 하지 않음
    if (isActive) return;
    
    onClick?.();
    navigate(href);
  };

  return (
    <button
      onClick={handleClick}
      className='flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1'
    >
      <div className='flex flex-col items-center gap-1'>
        <NavigationIcon type={type} isActive={isActive} size={20} />
        <NavigationLabel text={label} isActive={isActive} />
      </div>
    </button>
  );
};

export default InstantNavigationItem;