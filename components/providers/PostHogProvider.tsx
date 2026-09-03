"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { analytics, analytics로드 } from "@/lib/analytics";

/**
 * PostHog 페이지뷰 추적.
 *
 * `posthog-js`(63.5 kB)를 정적 import 하지 않는다 — 그렇게 하면 루트 레이아웃을 통해
 * 모든 라우트의 공용 청크로 끌려 올라간다. `lib/analytics.ts`가 첫 페인트 이후
 * 지연 로드하고, 그 전에 발생한 이벤트는 큐에 쌓아 순서를 보존한다.
 */

function PostHogPageView() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!pathname) return;
        let url = window.origin + pathname;
        const qs = searchParams?.toString();
        if (qs) url = `${url}?${qs}`;
        analytics.pageview(url);
    }, [pathname, searchParams]);

    return null;
}

export default function PostHogProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        // 브라우저가 한가해진 뒤 SDK를 가져온다 — 첫 페인트를 막지 않는다.
        const ric =
            typeof window !== "undefined" &&
            "requestIdleCallback" in window
                ? window.requestIdleCallback
                : (cb: () => void) => window.setTimeout(cb, 1);
        const id = ric(() => void analytics로드());
        return () => {
            if (
                typeof window !== "undefined" &&
                "cancelIdleCallback" in window
            ) {
                window.cancelIdleCallback(id as number);
            }
        };
    }, []);

    return (
        <>
            <Suspense fallback={null}>
                <PostHogPageView />
            </Suspense>
            {children}
        </>
    );
}
