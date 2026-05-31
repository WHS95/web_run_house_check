"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

function PostHogPageView() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (process.env.NODE_ENV === "development") return;
        if (!pathname) return;
        let url = window.origin + pathname;
        const qs = searchParams?.toString();
        if (qs) url = `${url}?${qs}`;
        posthog.capture("$pageview", { $current_url: url });
    }, [pathname, searchParams]);

    return null;
}

export default function PostHogProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        // dev 모드에서는 SDK 부팅/네트워크 비용 회피
        if (process.env.NODE_ENV === "development") return;
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        if (!key) return;
        if (posthog.__loaded) return;

        posthog.init(key, {
            api_host:
                process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "/ingest",
            ui_host: "https://us.posthog.com",
            defaults: "2026-01-30",
            capture_pageview: false, // App Router는 직접 캡처
            capture_pageleave: true,
            person_profiles: "identified_only",
            loaded: (ph) => {
                if (process.env.NODE_ENV === "development") ph.debug();
                // 플릿 공통 앱 식별자 등록
                ph.register({ app_name: "attendance" });
                // 크로스앱 익명 ID 스티칭
                try {
                    const urlAnon = new URLSearchParams(
                        window.location.search
                    ).get("rh_anon");
                    const anon =
                        urlAnon || localStorage.getItem("rh_anon");
                    if (anon) {
                        localStorage.setItem("rh_anon", anon);
                        ph.register({ rh_anon: anon });
                    }
                } catch {}
            },
        });
    }, []);

    return (
        <PHProvider client={posthog}>
            <Suspense fallback={null}>
                <PostHogPageView />
            </Suspense>
            {children}
        </PHProvider>
    );
}
