import React from "react";
import Link from "next/link";
import {
    Gauge,
    Timer,
    Split,
    HeartPulse,
    CircleDot,
    ChevronRight,
    Shield,
} from "lucide-react";
import PageHeader from "@/components/organisms/common/PageHeader";
import { createClient } from "@/lib/supabase/server";
import * as 마스터정책 from "@/lib/domain/master/policies";

type MenuItem = {
    icon: typeof Gauge;
    title: string;
    description: string;
    href: string;
    accent?: boolean;
};

// Service Map sc-menu 사양: 첫 항목만 lime, 나머지는 surface 통일
const calculatorItems: MenuItem[] = [
    {
        icon: Gauge,
        title: "페이스 계산기",
        description: "페이스 / 거리 / 시간",
        href: "/calculator/pace",
        accent: true,
    },
    {
        icon: HeartPulse,
        title: "심박수 존",
        description: "Zone 1 ~ 5",
        href: "/calculator/heart-rate",
    },
    {
        icon: Timer,
        title: "완주 시간 예측",
        description: "5K → 10K / Half / Full",
        href: "/calculator/prediction",
    },
    {
        icon: Split,
        title: "스플릿 타임",
        description: "구간별 페이스",
        href: "/calculator/split-time",
    },
    {
        icon: CircleDot,
        title: "트랙 페이스",
        description: "1·2레인 랩타임",
        href: "/calculator/track-pace",
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

    const renderRow = (item: MenuItem) => {
        const Icon = item.icon;
        const iconClasses = item.accent
            ? "bg-rh-accent text-rh-text-inverted"
            : "bg-rh-bg-surface text-rh-text-secondary";
        return (
            <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 py-2.5 active:opacity-80"
            >
                <div
                    className={`flex justify-center items-center w-9 h-9 rounded-rh-md shrink-0 ${iconClasses}`}
                >
                    <Icon size={18} strokeWidth={1.6} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-rh-body font-semibold text-rh-text-primary leading-tight">
                        {item.title}
                    </div>
                    <div className="text-rh-caption text-rh-text-tertiary mt-0.5">
                        {item.description}
                    </div>
                </div>
                <ChevronRight
                    size={16}
                    className="shrink-0 text-rh-text-muted"
                />
            </Link>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <PageHeader
                title="메뉴"
                iconColor="white"
                borderColor="rh-border"
                backgroundColor="bg-rh-bg-primary"
            />

            <div className="overflow-y-auto flex-1 px-4 pt-3 pb-4 flex flex-col gap-3">
                <div className="rh-eye">러닝 계산기</div>
                <div className="flex flex-col divide-y divide-rh-border/60">
                    {calculatorItems.map(renderRow)}
                </div>

                {isMaster ? (
                    <>
                        <div className="rh-eye mt-2">기타</div>
                        <div className="flex flex-col divide-y divide-rh-border/60">
                            {renderRow({
                                icon: Shield,
                                title: "관리자 (마스터)",
                                description: "마스터 페이지로 이동",
                                href: "/master",
                            })}
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}
