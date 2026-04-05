"use client";
import { useCallback } from "react";
import useSWR from "swr";
import { useAdmin } from "@/lib/admin2/context";
import { adminKey } from "@/lib/admin2/swr-keys";
import type { UserForAdmin } from "@/lib/supabase/admin";

export function useAdminUsers() {
    const { crewId, invalidate } = useAdmin();
    const key = adminKey.users(crewId);
    const { data, isLoading, error, mutate } = useSWR<UserForAdmin[]>(key);

    const changeRole = useCallback(
        async (userId: string, isAdmin: boolean): Promise<void> => {
            const res = await fetch("/api/admin/crew-members", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, isAdmin, crewId }),
            });
            const json = await res.json();
            if (!json?.success) {
                throw new Error(json?.message || "권한 변경 실패");
            }
            await invalidate("users");
        },
        [crewId, invalidate]
    );

    const removeUser = useCallback(
        async (userId: string): Promise<void> => {
            await mutate(
                (prev) => prev?.filter((u) => u.id !== userId) ?? [],
                { revalidate: false }
            );
            try {
                const url = `/api/admin/crew-members?userId=${userId}&crewId=${crewId}`;
                const res = await fetch(url, { method: "DELETE" });
                const json = await res.json();
                if (!json?.success) {
                    throw new Error(json?.message || "멤버 추방 실패");
                }
                await invalidate("users");
            } catch (e) {
                await mutate();
                throw e;
            }
        },
        [crewId, invalidate, mutate]
    );

    return {
        users: data ?? [],
        isLoading,
        error,
        changeRole,
        removeUser,
        refresh: () => mutate(),
    };
}
