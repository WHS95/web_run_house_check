interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 오래된 엔트리 정리 (메모리 누수 방지)
setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
        if (now > entry.resetAt) {
            store.delete(key);
        }
    });
}, 60_000);

interface RateLimitOptions {
    key: string;
    limit: number;
    windowMs: number;
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
}

export function rateLimit({
    key,
    limit,
    windowMs,
}: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return {
            success: true,
            remaining: limit - 1,
            resetAt: now + windowMs,
        };
    }

    entry.count += 1;

    if (entry.count > limit) {
        return {
            success: false,
            remaining: 0,
            resetAt: entry.resetAt,
        };
    }

    return {
        success: true,
        remaining: limit - entry.count,
        resetAt: entry.resetAt,
    };
}
