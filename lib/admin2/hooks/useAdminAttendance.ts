"use client";
import { useCallback } from "react";
import useSWR from "swr";
import { useAdmin } from "@/lib/admin2/context";
import { adminKey } from "@/lib/admin2/swr-keys";

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
            const res = await fetch("/api/admin/attendance/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ crewId, ...input }),
            });
            const json = await res.json();
            if (!json?.success) {
                throw new Error(json?.message || "일괄 등록 실패");
            }
            await invalidate("attendance");
            return json.data?.createdCount ?? 0;
        },
        [crewId, invalidate]
    );

    const deleteRecord = useCallback(
        async (recordId: string): Promise<void> => {
            const res = await fetch(
                `/api/admin/attendance/delete?recordId=${recordId}`,
                { method: "DELETE" }
            );
            const json = await res.json();
            if (!json?.success) {
                throw new Error(json?.message || json?.error || "삭제 실패");
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
            const res = await fetch("/api/admin/attendance/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recordId, updates }),
            });
            const json = await res.json();
            if (!json?.success) {
                throw new Error(json?.message || json?.error || "수정 실패");
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
