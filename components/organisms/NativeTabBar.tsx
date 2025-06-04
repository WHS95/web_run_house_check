"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { haptic } from "@/lib/haptic";

interface TabItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NativeTabBarProps {
  tabs: TabItem[];
}

const NativeTabBar: React.FC<NativeTabBarProps> = ({ tabs }) => {
  const pathname = usePathname();

  const handleTabClick = () => {
    haptic.light();
  };

  return (
    <div
      className='
            fixed bottom-0 left-0 right-0 z-50
            bg-white/95 backdrop-blur-md border-t border-gray-200
            safe-area-inset-bottom
        '
    >
      {/* iOS 스타일 홈 인디케이터 공간 */}
      <div className='pb-safe'>
        <div className='flex items-center justify-around h-20 px-2'>
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={handleTabClick}
                className={`
                                    relative flex flex-col items-center justify-center
                                    flex-1 py-2 px-1 rounded-xl
                                    transition-all duration-200 ease-out
                                    active:scale-95 active:bg-gray-100
                                    ${
                                      isActive
                                        ? "text-blue-500"
                                        : "text-gray-500"
                                    }
                                `}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {/* 아이콘 */}
                <div
                  className={`
                                    mb-1 transition-transform duration-200
                                    ${isActive ? "scale-110" : "scale-100"}
                                `}
                >
                  {tab.icon}
                </div>

                {/* 라벨 */}
                <span
                  className={`
                                    text-xs font-medium transition-all duration-200
                                    ${
                                      isActive
                                        ? "opacity-100 font-semibold"
                                        : "opacity-70"
                                    }
                                `}
                >
                  {tab.label}
                </span>

                {/* 활성 인디케이터 */}
                {isActive && (
                  <div
                    className='
                                        absolute -top-0.5 left-1/2 transform -translate-x-1/2
                                        w-1 h-1 bg-blue-500 rounded-full
                                    '
                  />
                )}

                {/* 배지 */}
                {tab.badge && tab.badge > 0 && (
                  <div
                    className='
                                        absolute -top-1 -right-1
                                        min-w-[18px] h-[18px] px-1
                                        bg-red-500 text-white text-xs font-bold
                                        flex items-center justify-center
                                        rounded-full border-2 border-white
                                    '
                  >
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NativeTabBar;
