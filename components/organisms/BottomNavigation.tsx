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

  /* 페이지 프리페치 */
  useEffect(() => {
    const prefetchTargets = [
      "/",
      "/attendance",
      "/ranking",
      "/calculator",
      "/calculator/pace",
      "/calculator/prediction",
      "/calculator/split-time",
      "/calculator/heart-rate",
    ];

    prefetchTargets.forEach((route) => {
      if (
        route !== pathname &&
        (!pathname.startsWith("/calculator") || route !== pathname)
      ) {
        router.prefetch(route);
      }
    });
  }, [pathname, router]);

  /* API 프리페치 */
  useEffect(() => {
    const prefetchAPIs = async () => {
      if (pathname !== "/") {
        fetch("/api/ranking?prefetch=true", {
          method: "GET",
          cache: "force-cache",
        }).catch(() => {});
      }

      if (pathname !== "/attendance") {
        const cacheHeaders = new Headers();
        cacheHeaders.append("Cache-Control", "public, max-age=300");
      }

      if (pathname !== "/ranking") {
        const currentDate = new Date();
        fetch(
          `/api/ranking?year=${currentDate.getFullYear()}&month=${
            currentDate.getMonth() + 1
          }&prefetch=true`,
          {
            method: "GET",
            cache: "force-cache",
          },
        ).catch(() => {});
      }
    };

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
    <nav className='ios-tab-bar'>
      <div className='flex items-center justify-around h-16 max-w-md mx-auto pt-2'>
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
      <div className='pb-safe' />
    </nav>
  );
};

export default BottomNavigation;
