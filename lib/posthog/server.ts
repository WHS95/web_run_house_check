import "server-only";

import { PostHog } from "posthog-node";

let client: PostHog | null = null;

/**
 * 서버(라우트 핸들러·서버 액션·서버 컴포넌트)에서 PostHog 이벤트를
 * 기록할 때 사용. 환경변수가 비어있으면 null을 돌려주어 안전하게 no-op.
 * 요청 종료 직전 `await flush()`를 호출해 이벤트를 전송할 것.
 */
export function getPostHogServer(): PostHog | null {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return null;
    if (!client) {
        client = new PostHog(key, {
            host:
                process.env.NEXT_PUBLIC_POSTHOG_HOST ??
                "https://us.i.posthog.com",
            flushAt: 1,
            flushInterval: 0,
        });
    }
    return client;
}

/** 서버리스 환경에서는 응답 직전 반드시 호출. */
export async function flushPostHog(): Promise<void> {
    if (client) await client.shutdown();
}
