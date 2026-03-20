"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface CalculatorLayoutProps {
    title: string;
    children: React.ReactNode;
}

export default function CalculatorLayout({
    title,
    children,
}: CalculatorLayoutProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            {/* 헤더 - flex shrink-0 패턴 */}
            <div className="flex-shrink-0 border-b border-rh-border bg-rh-bg-surface">
                <header className="flex items-center py-4 px-4">
                    <button
                        onClick={() => router.back()}
                        className="text-white transition-colors active:opacity-70"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="ml-2 text-base font-semibold text-white">
                        {title}
                    </h1>
                </header>
            </div>

            {/* 콘텐츠 */}
            <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 space-y-5">
                {children}
            </div>
        </div>
    );
}
