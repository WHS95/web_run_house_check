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

  const navigate = useCallback(
    (href: string) => {
      // 프리페치는 BottomNavigation mount 시 1회 처리됨
      router.push(href);
    },
    [router]
  );

  return (
    <NavigationContext.Provider value={{ navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};
