"use client";

import React, { createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";

interface NavigationContextType {
  navigate: (href: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
}) => {
  const router = useRouter();

  // 추가 프리페치 (네비게이션 직전)
  const prefetchRoute = useCallback(
    (href: string) => {
      // 한번 더 프리페치 (네비게이션 직전 최신화)
      router.prefetch(href);

      // 관련 API도 미리 호출 (중요한 경우만)
      if (href === "/ranking") {
        // 한국 시간 기준으로 현재 날짜 생성
        const now = new Date();
        const koreaOffset = 9 * 60; // 9시간(분 단위)
        const currentDate = new Date(
          now.getTime() + (koreaOffset - now.getTimezoneOffset()) * 60000
        );
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
    },
    [router]
  );

  const navigate = useCallback(
    (href: string) => {
      // 네비게이션 직전 추가 프리페치
      prefetchRoute(href);

      // 바로 네비게이션 수행 (애니메이션 없음)
      router.push(href);
    },
    [router, prefetchRoute]
  );

  return (
    <NavigationContext.Provider value={{ navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};
