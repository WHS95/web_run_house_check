"use client";

/**
 * PostHog 클라이언트 지연 로딩 래퍼.
 *
 * **왜 필요한가:** `posthog-js`(63.5 kB gzip)를 정적 import 하면 루트 레이아웃을 통해
 * **모든 라우트의 공용 청크**로 끌려 올라간다. 로그인 화면 하나 보려고 분석 SDK를
 * 파싱하는 셈이다. 분석은 첫 페인트 이후에 로드해도 아무 문제가 없다.
 *
 * 호출부는 SDK 로딩 여부를 신경 쓰지 않는다. 아직 로드되지 않았으면 큐에 쌓고,
 * 로드가 끝나면 순서대로 흘려보낸다.
 *
 * ⚠️ `posthog-js`를 컴포넌트에서 직접 import 하지 말 것 — 공용 청크로 돌아온다.
 */

type PostHogClient = typeof import("posthog-js").default;

let client: PostHogClient | null = null;
let loading: Promise<PostHogClient | null> | null = null;

/** 로드 전에 발생한 이벤트를 순서대로 보관한다. */
const queue: Array<(ph: PostHogClient) => void> = [];

function 비활성인가(): boolean {
    return (
        typeof window === "undefined" ||
        process.env.NODE_ENV === "development" ||
        !process.env.NEXT_PUBLIC_POSTHOG_KEY
    );
}

/**
 * PostHog SDK 를 실제로 로드하고 초기화한다.
 * 여러 번 불려도 한 번만 로드한다.
 */
export function analytics로드(): Promise<PostHogClient | null> {
    if (비활성인가()) return Promise.resolve(null);
    if (client) return Promise.resolve(client);
    if (loading) return loading;

    loading = import("posthog-js")
        .then((mod) => {
            const ph = mod.default;
            if (!ph.__loaded) {
                ph.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
                    api_host:
                        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "/ingest",
                    ui_host: "https://us.posthog.com",
                    defaults: "2026-01-30",
                    capture_pageview: false, // App Router는 직접 캡처
                    capture_pageleave: true,
                    person_profiles: "identified_only",
                });
            }
            client = ph;
            // 쌓아둔 이벤트를 순서대로 흘려보낸다.
            while (queue.length > 0) {
                queue.shift()?.(ph);
            }
            return ph;
        })
        .catch(() => null);

    return loading;
}

/** 로드됐으면 즉시, 아니면 큐에 넣고 로드를 시작한다. */
function 실행(작업: (ph: PostHogClient) => void): void {
    if (비활성인가()) return;
    if (client) {
        작업(client);
        return;
    }
    queue.push(작업);
    void analytics로드();
}

export const analytics = {
    capture: (event: string, properties?: Record<string, unknown>) => {
        실행((ph) => ph.capture(event, properties));
    },

    identify: (id: string, properties?: Record<string, unknown>) => {
        실행((ph) => ph.identify(id, properties));
    },

    captureException: (error: unknown, properties?: Record<string, unknown>) => {
        실행((ph) => ph.captureException(error, properties));
    },

    pageview: (url: string) => {
        실행((ph) => ph.capture("$pageview", { $current_url: url }));
    },
};
