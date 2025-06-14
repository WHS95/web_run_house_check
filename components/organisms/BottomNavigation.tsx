"use client";

import React from "react";
import { usePathname } from "next/navigation";
import NavigationItem from "@/components/molecules/NavigationItem";
import { haptic } from "@/lib/haptic";

const navigationItems = [
  {
    type: "home" as const,
    label: "홈",
    href: "/",
  },
  {
    type: "attendance" as const,
    label: "출석",
    href: "/attendance",
  },
  {
    type: "ranking" as const,
    label: "랭킹",
    href: "/ranking",
  },
  {
    type: "mypage" as const,
    label: "마이페이지",
    href: "/mypage",
  },
  {
    type: "menu" as const,
    label: "메뉴",
    href: "/menu",
  },
];

const BottomNavigation: React.FC = () => {
  const pathname = usePathname();

  const handleNavClick = () => {
    haptic.light();
  };

  const isActivePath = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 border-t border-t-2 border-gray-500 rounded-t-lg bg-basic-black-gray'>
      <div className='flex items-center justify-around h-20 max-w-md mx-auto'>
        {navigationItems.map((item) => (
          <NavigationItem
            key={item.type}
            type={item.type}
            label={item.label}
            href={item.href}
            isActive={isActivePath(item.href)}
            onClick={handleNavClick}
          />
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
