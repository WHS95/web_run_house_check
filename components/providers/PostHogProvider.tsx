"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

function PostHogPageView() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
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
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        if (!key) return;
        if (posthog.__loaded) return;

        posthog.init(key, {
            api_host:
                process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "/ingest",
            ui_host: "https://us.posthog.com",
            capture_pageview: false,
            capture_pageleave: true,
            person_profiles: "identified_only",
            loaded: (ph) => {
                if (process.env.NODE_ENV === "development") ph.debug();
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
