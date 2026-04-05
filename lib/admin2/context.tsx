"use client";
import { createContext, useContext } from "react";
import type { AdminRole, AdminAction } from "./permissions";
import type { AdminScope } from "./swr-keys";

export interface AdminContextValue {
    userId: string;
    crewId: string;
    firstName: string;
    role: AdminRole;
    can: (action: AdminAction) => boolean;
    invalidate: (scope: AdminScope | "all") => Promise<void>;
}

export const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
    const ctx = useContext(AdminContext);
    if (!ctx) {
        throw new Error("useAdmin must be used inside <AdminProvider>");
    }
    return ctx;
}
