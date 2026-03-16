"use client";

import React, { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Gauge,
    Timer,
    Split,
    HeartPulse,
    CircleDot,
    ChevronRight,
    LogOut,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import dynamic from "next/dynamic";
import { getFCMToken } from "@/lib/firebase/client";
import BottomNavigation from "@/components/organisms/BottomNavigation";

// 동적 로딩으로 번들 크기 최적화
const PageHeader = dynamic(
    () => import("@/components/organisms/common/PageHeader"),
    {
        ssr: true,
    }
);

const menuItems = [
    {
        icon: Gauge,
        title: "페이스 계산기",
        description: "거리와 시간으로 페이스 계산",
        href: "/calculator/pace",
        iconBg: "bg-rh-accent",
    },
    {
        icon: Timer,
        title: "완주 시간 예측기",
        description: "기록 기반 완주 시간 예측",
        href: "/calculator/prediction",
        iconBg: "bg-rh-status-success",
    },
    {
        icon: Split,
        title: "스플릿 타임 계산기",
        description: "구간별 스플릿 타임 계산",
        href: "/calculator/split-time",
        iconBg: "bg-rh-status-warning",
    },
    {
        icon: HeartPulse,
        title: "심박수 존 계산기",
        description: "최대 심박수 기반 존 계산",
        href: "/calculator/heart-rate",
        iconBg: "bg-rh-status-error",
    },
    {
        icon: CircleDot,
        title: "트랙 페이스 계산기",
        description: "트랙 거리별 페이스 변환",
        href: "/calculator/track-pace",
        iconBg: "bg-rh-bg-muted",
    },
];

export default function MenuPage() {
    const router = useRouter();

    // Supabase 클라이언트 메모화
    const supabase = useMemo(
        () =>
            createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            ),
        []
    );

    const handleItemClick = useCallback(
        (item: (typeof menuItems)[0]) => {
            // 햅틱 피드백
            if (typeof window !== "undefined" && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
            router.push(item.href);
        },
        [router]
    );

    const handleLogout = useCallback(async () => {
        try {
            // 햅틱 피드백
            if (typeof window !== "undefined" && window.navigator.vibrate) {
                window.navigator.vibrate([50, 100, 50]);
            }

            // FCM 토큰 비활성화
            const fcmToken = await getFCMToken();
            if (fcmToken) {
                await fetch("/api/push/token", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: fcmToken }),
                }).catch(() => {});
            }

            // Supabase 세션 종료
            const { error } = await supabase.auth.signOut();

            if (error) {
                alert("로그아웃 중 오류가 발생했습니다.");
                return;
            }

            // 로그인 페이지로 리다이렉트
            router.push("/auth/login");
        } catch {
            alert("로그아웃 처리 중 문제가 발생했습니다.");
        }
    }, [supabase, router]);

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <PageHeader
                title="러닝 계산기"
                iconColor="white"
                borderColor="rh-border"
                backgroundColor="bg-rh-bg-surface"
            />

            {/* 메뉴 리스트 */}
            <div className="overflow-y-auto flex-1 px-4 pt-4 scroll-area-bottom">
                <div className="flex flex-col gap-4">
                    {/* 계산기 메뉴들 */}
                    {menuItems.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => handleItemClick(item)}
                                className="flex items-center gap-4 w-full h-[72px] px-4 rounded-rh-lg bg-rh-bg-surface transition-colors active:opacity-80"
                            >
                                <div
                                    className={`flex justify-center items-center w-11 h-11 rounded-rh-md shrink-0 ${item.iconBg}`}
                                >
                                    <IconComponent
                                        size={22}
                                        className="text-white"
                                    />
                                </div>
                                <div className="flex-1 text-left space-y-0.5">
                                    <div className="text-[15px] font-semibold text-white">
                                        {item.title}
                                    </div>
                                    <div className="text-xs text-rh-text-tertiary">
                                        {item.description}
                                    </div>
                                </div>
                                <ChevronRight
                                    size={18}
                                    className="text-rh-text-muted shrink-0"
                                />
                            </button>
                        );
                    })}

                    {/* 구분선 */}
                    <div className="my-1 border-t border-rh-border"></div>

                    {/* 로그아웃 버튼 */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 w-full h-[72px] px-4 rounded-rh-lg bg-rh-bg-surface transition-colors active:opacity-80"
                    >
                        <div
                            className="flex justify-center items-center w-11 h-11 rounded-rh-md shrink-0 bg-rh-status-error"
                        >
                            <LogOut size={22} className="text-white" />
                        </div>
                        <div className="flex-1 text-left space-y-0.5">
                            <div className="text-[15px] font-semibold text-white">
                                로그아웃
                            </div>
                            <div className="text-xs text-rh-text-tertiary">
                                계정에서 로그아웃
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <BottomNavigation />
        </div>
    );
}
