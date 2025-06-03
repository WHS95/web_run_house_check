"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface AdminContextType {
  crewId: string;
  userId: string;
  firstName: string;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminContextProviderProps {
  children: ReactNode;
  crewId: string;
  userId: string;
  firstName: string;
}

export function AdminContextProvider({
  children,
  crewId,
  userId,
  firstName,
}: AdminContextProviderProps) {
  const value: AdminContextType = {
    crewId,
    userId,
    firstName,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdminContext(): AdminContextType {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error(
      "useAdminContext must be used within an AdminContextProvider"
    );
  }
  return context;
}
