"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Timer, Clock, BarChart3, Heart, CircleDot } from "lucide-react";
import BottomNavigation from "@/components/organisms/BottomNavigation";

const PageHeader = dynamic(
    () => import("@/components/organisms/common/PageHeader"),
    {
        ssr: true,
    }
);

const calculatorItems = [
    {
        title: "페이스 계산기",
        description: "거리와 시간으로 페이스 계산",
        href: "/calculator/pace",
        icon: Timer,
    },
    {
        title: "완주 시간 예측기",
        description: "기록 기반 완주 시간 예측",
        href: "/calculator/prediction",
        icon: Clock,
    },
    {
        title: "스플릿 타임 계산기",
        description: "구간별 스플릿 타임 계산",
        href: "/calculator/split-time",
        icon: BarChart3,
    },
    {
        title: "심박수 존 계산기",
        description: "최대 심박수 기반 존 계산",
        href: "/calculator/heart-rate",
        icon: Heart,
    },
    {
        title: "트랙 페이스 계산기",
        description: "트랙 거리별 페이스 변환",
        href: "/calculator/track-pace",
        icon: CircleDot,
    },
];

export default function CalculatorPage() {
    const router = useRouter();

    // 모든 계산기 페이지들을 미리 prefetch
    useEffect(() => {
        const calculatorRoutes = [
            "/calculator/pace",
            "/calculator/prediction",
            "/calculator/split-time",
            "/calculator/heart-rate",
            "/calculator/track-pace",
        ];

        calculatorRoutes.forEach((route, index) => {
            setTimeout(() => {
                router.prefetch(route);
            }, index * 100);
        });
    }, [router]);

    return (
        <div className='flex flex-col h-screen bg-rh-bg-primary main-content'>
            <div className='fixed top-0 left-0 right-0 z-10 bg-rh-bg-surface'>
                <PageHeader
                    title='러닝 계산기'
                    iconColor='white'
                    borderColor='border-rh-border'
                />
            </div>

            <div className='flex-1 overflow-y-auto px-4 py-4 pt-[80px] pb-24'>
                <div className='space-y-3'>
                    {calculatorItems.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => router.push(item.href)}
                                onMouseEnter={() => router.prefetch(item.href)}
                                onFocus={() => router.prefetch(item.href)}
                                className='flex items-center w-full bg-rh-bg-surface rounded-rh-md px-4 py-3 transition-colors hover:bg-rh-bg-surface/80 active:bg-rh-bg-muted'
                            >
                                <div className='flex-shrink-0 w-11 h-11 bg-rh-accent rounded-rh-md flex items-center justify-center'>
                                    <IconComponent className='w-5 h-5 text-white' />
                                </div>
                                <div className='ml-3 text-left'>
                                    <div className='text-white font-medium text-sm'>
                                        {item.title}
                                    </div>
                                    <div className='text-xs text-rh-text-secondary mt-0.5'>
                                        {item.description}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <BottomNavigation />
        </div>
    );
}
