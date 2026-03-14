import { get, set, del, keys } from "idb-keyval";

export interface QueuedAttendance {
    id: string;
    userId: string;
    crewId: string;
    locationId: number;
    exerciseTypeId: number;
    isHost: boolean;
    attendanceTimestamp: string;
    queuedAt: string;
    retryCount: number;
}

const QUEUE_PREFIX = "attendance_queue_";

export async function enqueueAttendance(
    data: Omit<QueuedAttendance, "id" | "queuedAt" | "retryCount">
): Promise<string> {
    const id = `${QUEUE_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const entry: QueuedAttendance = {
        ...data,
        id,
        queuedAt: new Date().toISOString(),
        retryCount: 0,
    };
    await set(id, entry);
    return id;
}

export async function getQueuedAttendances(): Promise<QueuedAttendance[]> {
    const allKeys = await keys();
    const queueKeys = allKeys.filter(
        (k) => typeof k === "string" && k.startsWith(QUEUE_PREFIX)
    );
    const entries: QueuedAttendance[] = [];
    for (const key of queueKeys) {
        const entry = await get<QueuedAttendance>(key);
        if (entry) entries.push(entry);
    }
    return entries.sort(
        (a, b) =>
            new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime()
    );
}

export async function removeFromQueue(id: string): Promise<void> {
    await del(id);
}

export async function getQueueCount(): Promise<number> {
    const allKeys = await keys();
    return allKeys.filter(
        (k) => typeof k === "string" && k.startsWith(QUEUE_PREFIX)
    ).length;
}

export async function incrementRetry(id: string): Promise<void> {
    const entry = await get<QueuedAttendance>(id);
    if (entry) {
        entry.retryCount += 1;
        await set(id, entry);
    }
}
