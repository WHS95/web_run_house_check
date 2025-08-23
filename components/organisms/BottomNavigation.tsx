"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import InstantNavigationItem from "@/components/molecules/InstantNavigationItem";
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
  const router = useRouter();

  // 홈, 출석, 랭킹, 계산기 페이지들 프리페치
  useEffect(() => {
    const prefetchTargets = [
      "/", "/attendance", "/ranking",
      // 계산기 페이지들
      "/calculator", "/calculator/pace", "/calculator/prediction", 
      "/calculator/split-time", "/calculator/heart-rate"
    ];

    prefetchTargets.forEach((route) => {
      if (route !== pathname && !pathname.startsWith('/calculator') || route !== pathname) {
        // Next.js router prefetch 사용
        router.prefetch(route);
      }
    });
  }, [pathname, router]);

  // API 라우트 프리페치
  useEffect(() => {
    const prefetchAPIs = async () => {
      // 현재 페이지가 아닌 경우에만 관련 API 프리페치
      if (pathname !== "/") {
        // 홈페이지 API 프리페치
        fetch("/api/ranking?prefetch=true", {
          method: "GET",
          cache: "force-cache",
        }).catch(() => {});
      }

      if (pathname !== "/attendance") {
        // 출석 페이지 관련 API는 사용자별이므로 프리페치 생략
        // 대신 기본 데이터만 캐시
        const cacheHeaders = new Headers();
        cacheHeaders.append("Cache-Control", "public, max-age=300");
      }

      if (pathname !== "/ranking") {
        // 랭킹 API 프리페치
        const currentDate = new Date();
        fetch(
          `/api/ranking?year=${currentDate.getFullYear()}&month=${
            currentDate.getMonth() + 1
          }&prefetch=true`,
          {
            method: "GET",
            cache: "force-cache",
          }
        ).catch(() => {});
      }
    };

    // 항상 프리페치 실행
    prefetchAPIs();
  }, [pathname]);

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
    <nav className='fixed bottom-0 left-0 right-0 z-50 border-t-2 border-gray-500 rounded-t-lg bg-basic-black-gray'>
      <div className='flex items-center justify-around h-20 max-w-md mx-auto'>
        {navigationItems.map((item) => (
          <div key={item.type} className='relative'>
            {/* 숨겨진 프리페치 링크 */}
            <Link
              href={item.href}
              prefetch={true}
              className='hidden'
              aria-hidden='true'
            >
              {item.label}
            </Link>

            {/* 실제 네비게이션 아이템 */}
            <InstantNavigationItem
              type={item.type}
              label={item.label}
              href={item.href}
              isActive={isActivePath(item.href)}
              onClick={handleNavClick}
            />
          </div>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
