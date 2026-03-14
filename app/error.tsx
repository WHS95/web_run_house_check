"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global error:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-rh-bg-primary px-6">
            <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rh-status-error/20">
                    <AlertCircle className="h-8 w-8 text-rh-status-error" />
                </div>
                <h1 className="text-rh-title2 font-bold text-white">
                    문제가 발생했습니다
                </h1>
                <p className="mt-2 text-rh-body text-rh-text-secondary">
                    일시적인 오류가 발생했습니다.
                    <br />
                    잠시 후 다시 시도해주세요.
                </p>
                <button
                    onClick={reset}
                    className="mt-6 inline-flex items-center gap-2 rounded-rh-lg bg-rh-accent px-6 py-3 text-rh-body font-semibold text-white"
                >
                    <RotateCcw className="h-4 w-4" />
                    다시 시도
                </button>
            </div>
        </div>
    );
}
