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
  const { navigate, isNavigating, targetRoute, slideDirection } = useNavigation();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // 이미 현재 페이지라면 네비게이션 하지 않음
    if (isActive) return;
    
    onClick?.();
    navigate(href);
  };

  // 현재 네비게이팅 중인 경로인지 확인
  const isCurrentlyNavigating = isNavigating && targetRoute === href;

  return (
    <button
      onClick={handleClick}
      className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-all duration-150 ${
        isCurrentlyNavigating ? 'opacity-60 scale-95' : ''
      }`}
      disabled={isCurrentlyNavigating}
    >
      <div className='flex flex-col items-center gap-1 relative'>
        <NavigationIcon type={type} isActive={isActive || isCurrentlyNavigating} size={20} />
        <NavigationLabel text={label} isActive={isActive || isCurrentlyNavigating} />
        
        {/* 슬라이드 방향 인디케이터 */}
        {isCurrentlyNavigating && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <div className={`w-1 h-1 bg-basic-blue rounded-full animate-pulse`} />
          </div>
        )}
      </div>
    </button>
  );
};

export default InstantNavigationItem;