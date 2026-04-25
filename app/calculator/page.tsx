import React from "react";
import Link from "next/link";
import {
    Gauge,
    Timer,
    Split,
    HeartPulse,
    CircleDot,
    ChevronRight,
} from "lucide-react";
import PageHeader from "@/components/organisms/common/PageHeader";

const calculatorItems = [
    {
        title: "페이스 계산기",
        description: "거리와 시간으로 페이스 계산",
        href: "/calculator/pace",
        icon: Gauge,
        iconBg: "bg-rh-accent",
    },
    {
        title: "완주 시간 예측기",
        description: "기록 기반 완주 시간 예측",
        href: "/calculator/prediction",
        icon: Timer,
        iconBg: "bg-rh-status-success",
    },
    {
        title: "스플릿 타임 계산기",
        description: "구간별 스플릿 타임 계산",
        href: "/calculator/split-time",
        icon: Split,
        iconBg: "bg-rh-status-warning",
    },
    {
        title: "심박수 존 계산기",
        description: "최대 심박수 기반 존 계산",
        href: "/calculator/heart-rate",
        icon: HeartPulse,
        iconBg: "bg-rh-status-error",
    },
    {
        title: "트랙 페이스 계산기",
        description: "트랙 거리별 페이스 변환",
        href: "/calculator/track-pace",
        icon: CircleDot,
        iconBg: "bg-rh-bg-muted",
    },
];

// 서버 컴포넌트로 변환 — "use client" 제거, 번들 크기 감소
// Link 사용으로 자동 prefetch + 즉시 네비게이션
export default function CalculatorPage() {
    return (
        <div className="flex flex-col h-screen bg-rh-bg-primary main-content">
            <PageHeader
                title="러닝 계산기"
                iconColor="white"
                borderColor="border-rh-border"
            />

            <div className="flex-1 px-4 pt-4 space-y-3">
                {calculatorItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center w-full bg-rh-bg-surface rounded-rh-lg px-4 h-[72px] gap-4 transition-colors active:bg-rh-bg-muted"
                        >
                            <div
                                className={`flex-shrink-0 w-11 h-11 ${item.iconBg} rounded-rh-md flex items-center justify-center`}
                            >
                                <IconComponent className="w-[22px] h-[22px] text-white" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-[15px] font-semibold text-white">
                                    {item.title}
                                </div>
                                <div className="text-xs text-rh-text-tertiary mt-0.5">
                                    {item.description}
                                </div>
                            </div>
                            <ChevronRight className="w-[18px] h-[18px] text-rh-text-muted flex-shrink-0" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
