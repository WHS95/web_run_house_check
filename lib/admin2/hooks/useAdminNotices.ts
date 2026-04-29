"use client";
import { useCallback } from "react";
import useSWR from "swr";
import { useAdmin } from "@/lib/admin2/context";
import { adminKey } from "@/lib/admin2/swr-keys";
import {
    createNoticeAction,
    deleteNoticeAction,
} from "@/app/admin2/notice/actions";

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
            const result = await createNoticeAction({
                crewId,
                title: input.title,
                content: input.content,
                type: input.type,
            });
            if (!result?.success) {
                throw new Error(result?.message || "공지 등록 실패");
            }
            await invalidate("notices");
            return result.data as unknown as NoticeRow;
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
                const result = await deleteNoticeAction({
                    noticeId: Number(noticeId),
                });
                if (!result?.success) {
                    throw new Error(result?.message || "공지 삭제 실패");
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
