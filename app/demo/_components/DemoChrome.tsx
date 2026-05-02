"use client";

import { ReactNode, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { X, Calendar, BarChart3, LayoutDashboard } from "lucide-react";

/**
 * 데모 페이지 공통 chrome.
 * - 상단 "체험 모드" 배너 (디스미서블)
 * - 하단 데모 전용 탭바 (3개 화면)
 * - ?embed=1 쿼리가 있으면 둘 다 숨겨 frameless 모드 (iframe 임베드용)
 */
export default function DemoChrome({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const isEmbed = searchParams.get("embed") === "1";
    const [bannerVisible, setBannerVisible] = useState(true);

    if (isEmbed) {
        return <div className="flex flex-col min-h-screen bg-rh-bg-primary">{children}</div>;
    }

    const tabs: Array<{ href: string; label: string; icon: typeof Calendar }> = [
        { href: "/demo/attendance", label: "출석", icon: Calendar },
        { href: "/demo/admin", label: "관리", icon: LayoutDashboard },
        { href: "/demo/stats", label: "통계", icon: BarChart3 },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            {bannerVisible && (
                <div className="sticky top-0 z-[60] flex items-center justify-between gap-2 bg-rh-accent/90 px-3 py-2 text-[12px] font-medium text-white backdrop-blur-md">
                    <span className="truncate">
                        체험 모드 — 실제 데이터가 아닙니다
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={() => router.push("/intro")}
                            className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] hover:bg-white/25"
                        >
                            소개로
                        </button>
                        <button
                            aria-label="배너 닫기"
                            onClick={() => setBannerVisible(false)}
                            className="rounded-full p-1 hover:bg-white/15"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1">{children}</div>

            <nav className="ios-tab-bar sticky bottom-0 z-50 grid grid-cols-3 border-t border-rh-border bg-rh-bg-surface/90 backdrop-blur-md pb-safe">
                {tabs.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] transition-colors ${
                                active
                                    ? "text-rh-accent"
                                    : "text-rh-text-tertiary hover:text-white"
                            }`}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
