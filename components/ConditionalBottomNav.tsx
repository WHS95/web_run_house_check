"use client";

import { usePathname } from "next/navigation";
import BottomNavigation from "@/components/organisms/BottomNavigation";

export default function ConditionalBottomNav() {
  const pathname = usePathname();

  // 바텀 네비게이션을 숨길 페이지들
  const hideBottomNavPages = [
    "/auth/login",
    "/auth/signup",
    "/auth/callback",
    "/auth/verify-crew",
    "/admin",
  ];

  // 현재 경로가 숨김 목록에 있는지 확인
  const shouldHideBottomNav = hideBottomNavPages.some(
    (page) => pathname === page || pathname.startsWith(page + "/")
  );

  // 바텀 네비게이션을 숨겨야 하는 페이지라면 null 반환
  if (shouldHideBottomNav) {
    return null;
  }

  return <BottomNavigation />;
}
