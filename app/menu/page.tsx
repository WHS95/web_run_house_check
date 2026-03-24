"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Gauge,
    Timer,
    Split,
    HeartPulse,
    CircleDot,
    ChevronRight,
} from "lucide-react";
import PageHeader from "@/components/organisms/common/PageHeader";

const menuItems = [
    {
        icon: Gauge,
        title: "페이스 계산기",
        description: "거리와 시간으로 페이스 계산",
        href: "/calculator/pace",
        iconBg: "#669FF2",
    },
    {
        icon: Timer,
        title: "완주 시간 예측기",
        description: "기록 기반 완주 시간 예측",
        href: "/calculator/prediction",
        iconBg: "#8BB5F5",
    },
    {
        icon: Split,
        title: "스플릿 타임 계산기",
        description: "구간별 스플릿 타임 계산",
        href: "/calculator/split-time",
        iconBg: "#5580C0",
    },
    {
        icon: HeartPulse,
        title: "심박수 존 계산기",
        description: "최대 심박수 기반 존 계산",
        href: "/calculator/heart-rate",
        iconBg: "#3E6496",
    },
    {
        icon: CircleDot,
        title: "트랙 페이스 계산기",
        description: "트랙 거리별 페이스 변환",
        href: "/calculator/track-pace",
        iconBg: "#4C525E",
    },
];

export default function MenuPage() {
    const router = useRouter();

    const handleItemClick = useCallback(
        (href: string) => {
            if (typeof window !== "undefined" && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
            router.push(href);
        },
        [router]
    );

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <PageHeader
                title="러닝 계산기"
                iconColor="white"
                borderColor="rh-border"
                backgroundColor="bg-rh-bg-surface"
            />

            <div className="overflow-y-auto flex-1 px-4 pt-4 pb-4">
                <div className="flex flex-col gap-4">
                    {menuItems.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => handleItemClick(item.href)}
                                className="flex items-center gap-4 w-full h-[72px] px-4 rounded-xl transition-colors active:opacity-80"
                                style={{ backgroundColor: "#2B3644" }}
                            >
                                <div
                                    className="flex justify-center items-center w-11 h-11 rounded-lg shrink-0"
                                    style={{ backgroundColor: item.iconBg }}
                                >
                                    <IconComponent
                                        size={22}
                                        className="text-white"
                                    />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-[15px] font-semibold text-white">
                                        {item.title}
                                    </div>
                                    <div
                                        className="text-xs mt-0.5"
                                        style={{ color: "#64748B" }}
                                    >
                                        {item.description}
                                    </div>
                                </div>
                                <ChevronRight
                                    size={18}
                                    className="shrink-0"
                                    style={{ color: "#475569" }}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
