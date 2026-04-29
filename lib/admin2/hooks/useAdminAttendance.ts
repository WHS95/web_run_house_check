"use client";
import { useCallback } from "react";
import useSWR from "swr";
import { useAdmin } from "@/lib/admin2/context";
import { adminKey } from "@/lib/admin2/swr-keys";
import {
    createBulkAttendanceAction,
    deleteAttendanceAction,
    updateAttendanceAction,
} from "@/app/admin2/attendance/actions";

export interface BulkAttendanceInput {
    users: Array<{ userId: string; isHost: boolean }>;
    attendanceTimestamp: string;
    locationId: number;
    exerciseTypeId: number;
}

export function useAdminAttendance(year: number, month: number) {
    const { crewId, invalidate } = useAdmin();
    const key = adminKey.attendance(crewId, year, month);
    const { data, isLoading, error, mutate } = useSWR<{
        summary: unknown[];
        detailData: Record<string, unknown>;
    }>(key);

    const createBulk = useCallback(
        async (input: BulkAttendanceInput): Promise<number> => {
            const result = await createBulkAttendanceAction({
                crewId,
                ...input,
            });
            if (!result?.success) {
                throw new Error(result?.message || "일괄 등록 실패");
            }
            await invalidate("attendance");
            return result.data?.createdCount ?? 0;
        },
        [crewId, invalidate]
    );

    const deleteRecord = useCallback(
        async (recordId: string): Promise<void> => {
            const result = await deleteAttendanceAction({ recordId });
            if (!result?.success) {
                throw new Error(
                    result?.message || result?.error || "삭제 실패"
                );
            }
            await invalidate("attendance");
        },
        [invalidate]
    );

    const updateRecord = useCallback(
        async (
            recordId: string,
            updates: Record<string, unknown>
        ): Promise<void> => {
            const result = await updateAttendanceAction({
                recordId,
                updates,
            });
            if (!result?.success) {
                throw new Error(
                    result?.message || result?.error || "수정 실패"
                );
            }
            await invalidate("attendance");
        },
        [invalidate]
    );

    return {
        data,
        isLoading,
        error,
        createBulk,
        deleteRecord,
        updateRecord,
        refresh: () => mutate(),
    };
}
