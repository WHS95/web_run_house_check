'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 타임아웃 정리 함수
  const clearAllTimeouts = useCallback(() => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    if (appearTimeoutRef.current) {
      clearTimeout(appearTimeoutRef.current);
      appearTimeoutRef.current = null;
    }
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
  }, []);

  // pathname 변경 감지로 네비게이션 완료 처리
  useEffect(() => {
    if (isNavigating && targetRoute && pathname === targetRoute) {
      // 목표 경로에 도달했음을 확인
      clearAllTimeouts();
      
      // DOM이 완전히 렌더링될 때까지 잠시 대기
      const checkPageReady = () => {
        // 기본적인 DOM 요소들이 렌더링되었는지 확인
        const mainContent = document.querySelector('.main-content') || 
                           document.querySelector('main') ||
                           document.querySelector('[role="main"]') ||
                           document.body.children[0]; // fallback
        
        if (mainContent && mainContent.children.length > 0) {
          // 페이지가 렌더링됨
          finishNavigation();
        } else {
          // 아직 렌더링되지 않음, 잠시 후 다시 확인
          setTimeout(checkPageReady, 50);
        }
      };
      
      const finishNavigation = () => {
        // 블러 효과 제거 및 자연스러운 나타남 효과
        document.body.classList.remove('page-blur');
        document.body.classList.add('page-appear');
        
        // 최종 정리
        cleanupTimeoutRef.current = setTimeout(() => {
          setIsNavigating(false);
          setTargetRoute(null);
          setSlideDirection(null);
          document.body.classList.remove('page-transition', 'page-appear');
          document.body.removeAttribute('data-slide-direction');
        }, 250); // 자연스러운 나타남 효과 시간
      };
      
      // 페이지 준비 상태 확인 시작
      checkPageReady();
    }
  }, [pathname, isNavigating, targetRoute, clearAllTimeouts]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

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
    
    // 이미 네비게이션 중이면 중단
    if (isNavigating) return;
    
    // 기존 타임아웃 정리
    clearAllTimeouts();
    
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
    blurTimeoutRef.current = setTimeout(() => {
      document.body.classList.add('page-blur');
    }, 300);
    
    // 실제 네비게이션 수행
    router.push(href);
    
    // Fallback: 2초 후에도 네비게이션이 완료되지 않으면 강제 정리
    navigationTimeoutRef.current = setTimeout(() => {
      console.warn(`Navigation to ${href} took longer than expected, forcing cleanup`);
      
      // 블러 효과 제거 및 자연스러운 나타남 효과
      document.body.classList.remove('page-blur');
      document.body.classList.add('page-appear');
      
      // 최종 정리
      setTimeout(() => {
        setIsNavigating(false);
        setTargetRoute(null);
        setSlideDirection(null);
        document.body.classList.remove('page-transition', 'page-appear');
        document.body.removeAttribute('data-slide-direction');
      }, 250);
    }, 2000); // 2초 fallback
  }, [router, pathname, getSlideDirection, prefetchRoute, isNavigating, clearAllTimeouts]);

  return (
    <NavigationContext.Provider value={{ isNavigating, targetRoute, slideDirection, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};