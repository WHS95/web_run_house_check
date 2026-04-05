"use client";
import { ReactNode, useCallback, useMemo } from "react";
import { SWRConfig, useSWRConfig } from "swr";
import { AdminContext } from "@/lib/admin2/context";
import {
    can,
    type AdminRole,
    type AdminAction,
} from "@/lib/admin2/permissions";
import { scopePrefix, type AdminScope } from "@/lib/admin2/swr-keys";
import { adminFetcher } from "@/lib/admin2/fetchers";

interface AdminAuthInput {
    userId: string;
    crewId: string;
    firstName: string;
    role: AdminRole;
}

function ContextBridge({
    value,
    children,
}: {
    value: AdminAuthInput;
    children: ReactNode;
}) {
    const { mutate } = useSWRConfig();

    const invalidate = useCallback(
        async (scope: AdminScope | "all") => {
            const prefix = scopePrefix(scope, value.crewId);
            await mutate(
                (key) =>
                    typeof key === "string" && key.startsWith(prefix),
                undefined,
                { revalidate: true }
            );
        },
        [mutate, value.crewId]
    );

    const ctx = useMemo(
        () => ({
            ...value,
            can: (action: AdminAction) => can(value.role, action),
            invalidate,
        }),
        [value, invalidate]
    );

    return (
        <AdminContext.Provider value={ctx}>{children}</AdminContext.Provider>
    );
}

export function AdminProvider({
    value,
    children,
}: {
    value: AdminAuthInput;
    children: ReactNode;
}) {
    return (
        <SWRConfig
            value={{
                fetcher: adminFetcher,
                revalidateOnFocus: true,
                dedupingInterval: 2000,
            }}
        >
            <ContextBridge value={value}>{children}</ContextBridge>
        </SWRConfig>
    );
}
