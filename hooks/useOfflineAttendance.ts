"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    enqueueAttendance,
    getQueuedAttendances,
    removeFromQueue,
    getQueueCount,
    incrementRetry,
    QueuedAttendance,
} from "@/lib/offline/attendance-queue";
import { submitAttendance } from "@/app/attendance/actions";

interface UseOfflineAttendanceReturn {
    isOnline: boolean;
    queueCount: number;
    enqueue: (
        data: Omit<QueuedAttendance, "id" | "queuedAt" | "retryCount">
    ) => Promise<string>;
    flushQueue: () => Promise<{ success: number; failed: number }>;
    isFlushing: boolean;
}

// navigator.onLine은 부정확 — 실제 ping으로 확인
async function probeOnline(): Promise<boolean> {
    if (typeof window === "undefined") return true;
    try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch(
            `/api/ping?t=${Date.now()}`,
            {
                method: "HEAD",
                cache: "no-store",
                signal: ctrl.signal,
                credentials: "omit",
            },
        );
        clearTimeout(timer);
        return res.ok;
    } catch {
        return false;
    }
}

export function useOfflineAttendance(): UseOfflineAttendanceReturn {
    // SSR/초기 마운트는 낙관적으로 true (probe 후 실제 상태로 보정)
    const [isOnline, setIsOnline] = useState(true);
    const [queueCount, setQueueCount] = useState(0);
    const [isFlushing, setIsFlushing] = useState(false);
    const isFlushingRef = useRef(false);

    const flushQueue = useCallback(async () => {
        if (isFlushingRef.current) return { success: 0, failed: 0 };
        isFlushingRef.current = true;
        setIsFlushing(true);

        let success = 0;
        let failed = 0;

        try {
            const queued = await getQueuedAttendances();

            for (const entry of queued) {
                if (entry.retryCount >= 3) {
                    await removeFromQueue(entry.id);
                    failed++;
                    continue;
                }

                try {
                    const result = await submitAttendance({
                        userId: entry.userId,
                        crewId: entry.crewId,
                        locationId: String(entry.locationId),
                        exerciseTypeId: String(entry.exerciseTypeId),
                        isHost: entry.isHost,
                        attendanceTimestamp: entry.attendanceTimestamp,
                    });

                    if (result.success) {
                        await removeFromQueue(entry.id);
                        success++;
                    } else {
                        await incrementRetry(entry.id);
                        failed++;
                    }
                } catch {
                    await incrementRetry(entry.id);
                    failed++;
                }
            }
        } finally {
            const count = await getQueueCount();
            setQueueCount(count);
            isFlushingRef.current = false;
            setIsFlushing(false);
        }

        return { success, failed };
    }, []);

    useEffect(() => {
        let cancelled = false;
        let pollTimer: ReturnType<typeof setInterval> | null = null;

        const stopPoll = () => {
            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
        };

        const startPoll = () => {
            if (pollTimer) return;
            // 오프라인 판정 시 15초 간격으로 재확인 (online 이벤트 누락 대비)
            pollTimer = setInterval(async () => {
                const ok = await probeOnline();
                if (cancelled) return;
                if (ok) {
                    setIsOnline(true);
                    stopPoll();
                    flushQueue();
                }
            }, 15000);
        };

        const verify = async () => {
            const ok = await probeOnline();
            if (cancelled) return;
            setIsOnline(ok);
            if (ok) {
                stopPoll();
                flushQueue();
            } else {
                startPoll();
            }
        };

        // 초기 확인
        verify();

        // 브라우저 이벤트는 힌트로만 사용 — 매번 실제 probe로 검증
        const handleOnline = () => verify();
        const handleOffline = () => verify();
        const handleVisibility = () => {
            if (document.visibilityState === "visible") verify();
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        document.addEventListener("visibilitychange", handleVisibility);

        getQueueCount().then(setQueueCount);

        return () => {
            cancelled = true;
            stopPoll();
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            document.removeEventListener(
                "visibilitychange",
                handleVisibility,
            );
        };
    }, [flushQueue]);

    const enqueue = useCallback(
        async (
            data: Omit<QueuedAttendance, "id" | "queuedAt" | "retryCount">
        ) => {
            const id = await enqueueAttendance(data);
            const count = await getQueueCount();
            setQueueCount(count);
            return id;
        },
        []
    );

    return {
        isOnline,
        queueCount,
        enqueue,
        flushQueue,
        isFlushing,
    };
}
