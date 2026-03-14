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

interface UseOfflineAttendanceReturn {
    isOnline: boolean;
    queueCount: number;
    enqueue: (
        data: Omit<QueuedAttendance, "id" | "queuedAt" | "retryCount">
    ) => Promise<string>;
    flushQueue: () => Promise<{ success: number; failed: number }>;
    isFlushing: boolean;
}

export function useOfflineAttendance(): UseOfflineAttendanceReturn {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== "undefined" ? navigator.onLine : true
    );
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
                    const res = await fetch("/api/attendance", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: entry.userId,
                            crewId: entry.crewId,
                            locationId: entry.locationId,
                            exerciseTypeId: entry.exerciseTypeId,
                            isHost: entry.isHost,
                            attendanceTimestamp: entry.attendanceTimestamp,
                        }),
                    });

                    if (res.ok) {
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
        const handleOnline = () => {
            setIsOnline(true);
            flushQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        getQueueCount().then(setQueueCount);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
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
