"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import BottomNavigation from "@/components/organisms/BottomNavigation";

const AdminBottomNavigation = dynamic(
    () =>
        import(
            "@/components/organisms/AdminBottomNavigation"
        ),
    { ssr: true },
);

const BOTTOM_INSET_VALUE = 'calc(4.5rem + env(safe-area-inset-bottom, 0px))';

export default function ConditionalBottomNav() {
  const pathname = usePathname();

  // 바텀 네비게이션을 완전히 숨길 페이지들
  const hideBottomNavPages = [
    "/auth/login",
    "/auth/signup",
    "/auth/callback",
    "/auth/verify-crew",
    "/master",
    "/map",
  ];

  const shouldHideBottomNav = hideBottomNavPages.some(
    (page) => pathname === page || pathname.startsWith(page + "/")
  );

  // /admin2 경로에서는 관리자 전용 바텀 네비 표시
  const isAdmin2 = pathname.startsWith("/admin2");

  /* ── Bottom Inset Layer System ──
   * 바텀 내비 표시 여부에 따라 CSS 변수를 동적으로 설정.
   * 모든 scroll-area-bottom, pb-bottom-inset, bottom-above-inset 등이 이 변수를 참조.
   */
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--rh-bottom-inset',
      shouldHideBottomNav ? '0px' : BOTTOM_INSET_VALUE
    );
  }, [shouldHideBottomNav]);

  if (shouldHideBottomNav) {
    return null;
  }

  if (isAdmin2) {
    return <AdminBottomNavigation />;
  }

  return <BottomNavigation />;
}
