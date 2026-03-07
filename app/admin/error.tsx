"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Admin error:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-rh-bg-primary px-6">
            <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rh-status-warning/20">
                    <AlertCircle className="h-8 w-8 text-rh-status-warning" />
                </div>
                <h1 className="text-rh-title2 font-bold text-white">
                    관리자 페이지 오류
                </h1>
                <p className="mt-2 text-rh-body text-rh-text-secondary">
                    관리자 기능에 일시적인 문제가
                    발생했습니다.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="inline-flex items-center gap-2 rounded-rh-lg bg-rh-accent px-5 py-3 text-rh-body font-semibold text-white"
                    >
                        <RotateCcw className="h-4 w-4" />
                        다시 시도
                    </button>
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 rounded-rh-lg bg-rh-bg-surface border border-rh-border px-5 py-3 text-rh-body text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        대시보드
                    </Link>
                </div>
            </div>
        </div>
    );
}
