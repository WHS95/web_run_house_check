'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionContextType {
  isTransitioning: boolean;
  startTransition: () => void;
  endTransition: () => void;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export const usePageTransition = () => {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within PageTransitionProvider');
  }
  return context;
};

interface PageTransitionProviderProps {
  children: React.ReactNode;
}

export const PageTransitionProvider: React.FC<PageTransitionProviderProps> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pathname = usePathname();

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
  }, []);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  // 라우트 변경 시 전환 애니메이션 자동 종료
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <PageTransitionContext.Provider value={{ isTransitioning, startTransition, endTransition }}>
      {/* 전환 오버레이 */}
      <div 
        className={`fixed inset-0 z-[9999] bg-basic-black transition-opacity duration-150 pointer-events-none ${
          isTransitioning ? 'opacity-40' : 'opacity-0'
        }`}
      />
      
      {/* 메인 컨텐츠 */}
      <div 
        className={`transition-all duration-150 ${
          isTransitioning ? 'scale-95 opacity-90' : 'scale-100 opacity-100'
        }`}
      >
        {children}
      </div>
    </PageTransitionContext.Provider>
  );
};