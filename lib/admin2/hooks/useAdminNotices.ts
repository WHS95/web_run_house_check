"use client";
import { useCallback } from "react";
import useSWR from "swr";
import { useAdmin } from "@/lib/admin2/context";
import { adminKey } from "@/lib/admin2/swr-keys";

export type NoticeType = "공지" | "일반" | "중요";

export interface NoticeRow {
    id: string;
    crew_id: string;
    title: string | null;
    type: NoticeType;
    content: string;
    is_active: boolean;
    author_id: string | null;
    created_at: string;
    author: { first_name: string } | null;
}

export interface CreateNoticeInput {
    title: string;
    content: string;
    type: NoticeType;
}

export function useAdminNotices(search?: string) {
    const { crewId, invalidate } = useAdmin();
    const key = adminKey.notices(crewId, search);
    const { data, isLoading, error, mutate } = useSWR<NoticeRow[]>(key);

    const createNotice = useCallback(
        async (input: CreateNoticeInput): Promise<NoticeRow> => {
            const res = await fetch("/api/admin/notices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ crewId, ...input }),
            });
            const json = await res.json();
            if (!json?.success) {
                throw new Error(json?.message || "공지 등록 실패");
            }
            await invalidate("notices");
            return json.data as NoticeRow;
        },
        [crewId, invalidate]
    );

    const deleteNotice = useCallback(
        async (noticeId: string): Promise<void> => {
            await mutate(
                (prev) => prev?.filter((n) => n.id !== noticeId) ?? [],
                { revalidate: false }
            );
            try {
                const res = await fetch("/api/admin/notices", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ noticeId }),
                });
                const json = await res.json();
                if (!json?.success) {
                    throw new Error(json?.message || "공지 삭제 실패");
                }
                await invalidate("notices");
            } catch (e) {
                await mutate();
                throw e;
            }
        },
        [mutate, invalidate]
    );

    return {
        notices: data ?? [],
        isLoading,
        error,
        createNotice,
        deleteNotice,
        refresh: () => mutate(),
    };
}
