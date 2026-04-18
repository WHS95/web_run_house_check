"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * 루트 레이아웃·서버 컴포넌트 렌더 중 발생한 예외를 처리하는 최종 경계.
 * Next.js App Router 규약상 <html>·<body> 태그를 직접 포함해야 한다.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html lang="ko">
            <body className="bg-rh-bg-primary text-rh-text-primary">
                <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
                    <h2 className="text-xl font-bold">
                        문제가 발생했어요
                    </h2>
                    <p className="text-sm text-rh-text-secondary">
                        잠시 후 다시 시도해 주세요.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="mt-2 rounded-lg bg-rh-accent px-4 py-2 text-sm font-semibold text-white hover:bg-rh-accent-hover"
                    >
                        다시 시도
                    </button>
                </div>
            </body>
        </html>
    );
}
