'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface NavigationContextType {
  isNavigating: boolean;
  targetRoute: string | null;
  slideDirection: 'left' | 'right' | null;
  navigate: (href: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

// 네비게이션 순서 정의
const NAVIGATION_ORDER = [
  '/',           // 홈
  '/attendance', // 출석
  '/ranking',    // 랭킹
  '/mypage',     // 마이페이지
  '/menu'        // 메뉴
];

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetRoute, setTargetRoute] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const getSlideDirection = useCallback((currentPath: string, targetPath: string) => {
    const currentIndex = NAVIGATION_ORDER.indexOf(currentPath);
    const targetIndex = NAVIGATION_ORDER.indexOf(targetPath);
    
    // 현재 경로나 타겟 경로가 메인 네비게이션에 없으면 기본적으로 오른쪽
    if (currentIndex === -1 || targetIndex === -1) return 'right';
    
    // 타겟이 현재보다 오른쪽에 있으면 left → right 슬라이드
    // 타겟이 현재보다 왼쪽에 있으면 right → left 슬라이드
    return targetIndex > currentIndex ? 'right' : 'left';
  }, []);

  // 추가 프리페치 (네비게이션 직전)
  const prefetchRoute = useCallback((href: string) => {
    // 한번 더 프리페치 (네비게이션 직전 최신화)
    router.prefetch(href);
    
    // 관련 API도 미리 호출 (중요한 경우만)
    if (href === '/ranking') {
      const currentDate = new Date();
      fetch(`/api/ranking?year=${currentDate.getFullYear()}&month=${currentDate.getMonth() + 1}&prefetch=true`, {
        method: 'GET',
        cache: 'force-cache'
      }).catch(() => {});
    }
  }, [router]);

  const navigate = useCallback((href: string) => {
    // 같은 페이지면 네비게이션 하지 않음
    if (pathname === href) return;
    
    // 네비게이션 직전 추가 프리페치
    prefetchRoute(href);
    
    // 슬라이드 방향 계산
    const direction = getSlideDirection(pathname, href);
    
    // 네비게이션 상태 설정
    setIsNavigating(true);
    setTargetRoute(href);
    setSlideDirection(direction);
    
    // DOM에 슬라이드 클래스 추가
    document.body.classList.add('page-transition');
    document.body.setAttribute('data-slide-direction', direction);
    
    // 0.3초 후 블러 효과 시작 (슬라이드 완료 후)
    setTimeout(() => {
      document.body.classList.add('page-blur');
    }, 300);
    
    // 실제 네비게이션 수행
    router.push(href);
    
    // 전환 완료 후 상태 정리 (블러 후 0.1초 뒤)
    setTimeout(() => {
      document.body.classList.remove('page-blur');
      document.body.classList.add('page-appear');
    }, 400); // 300ms 슬라이드 + 100ms 블러
    
    // 최종 정리
    setTimeout(() => {
      setIsNavigating(false);
      setTargetRoute(null);
      setSlideDirection(null);
      document.body.classList.remove('page-transition', 'page-appear');
      document.body.removeAttribute('data-slide-direction');
    }, 600); // 전체 애니메이션 완료
  }, [router, pathname, getSlideDirection, prefetchRoute]);

  return (
    <NavigationContext.Provider value={{ isNavigating, targetRoute, slideDirection, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};