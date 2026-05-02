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
import { createClient } from "@/lib/supabase/server";
import * as 마스터정책 from "@/lib/domain/master/policies";

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

export const dynamic = "force-dynamic";

async function 마스터_권한_보유여부() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: roleCheck } = await supabase
        .schema("attendance")
        .from("user_roles")
        .select("role_id")
        .eq("user_id", user.id)
        .maybeSingle();

    return 마스터정책.마스터_권한인가(roleCheck);
}

export default async function MenuPage() {
    const isMaster = await 마스터_권한_보유여부();

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <PageHeader
                title="러닝 계산기"
                iconColor="white"
                borderColor="rh-border"
                backgroundColor="bg-rh-bg-primary"
                rightAction={
                    isMaster ? (
                        <Link
                            href="/master"
                            aria-label="마스터 관리 페이지로 이동"
                            className="text-[14px] font-medium text-rh-accent px-3 py-1.5"
                        >
                            관리
                        </Link>
                    ) : undefined
                }
            />

            <div className="overflow-y-auto flex-1 px-4 pt-4 pb-4">
                <div className="flex flex-col gap-4">
                    {menuItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-4 w-full h-[72px] px-4 rounded-xl bg-rh-bg-surface transition-colors active:opacity-80"
                            >
                                <div
                                    className={`flex justify-center items-center w-11 h-11 rounded-lg shrink-0 ${item.iconBg}`}
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
                                    <div className="text-xs mt-0.5 text-rh-text-tertiary">
                                        {item.description}
                                    </div>
                                </div>
                                <ChevronRight
                                    size={18}
                                    className="shrink-0 text-rh-text-muted"
                                />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
