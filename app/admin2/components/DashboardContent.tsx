"use client";

import { memo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import FadeIn from "@/components/atoms/FadeIn";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import SectionLabel from "@/components/atoms/SectionLabel";
import AdminMonthNav from "./ui/AdminMonthNav";
import AdminStatCard from "./ui/AdminStatCard";
import AdminListItem from "./ui/AdminListItem";

interface DashboardContentProps {
    year: number;
    month: number;
    totalMembers: number;
    monthlyParticipationCount: number;
    monthlyHostCount: number;
}

const menuItems = [
    {
        title: "회원 관리",
        subtitleFn: (members: number) =>
            `${members}명`,
        href: "/admin2/user",
    },
    {
        title: "출석 관리",
        subtitleFn: (
            _: number,
            attendance: number,
        ) => `이번 달 ${attendance}건`,
        href: "/admin2/attendance",
    },
    {
        title: "통계 분석",
        subtitleFn: () => "요일별 · 장소별 참여율",
        href: "/admin2/analyze",
    },
    {
        title: "설정",
        subtitleFn: () => "장소 · 운영진 · 초대코드",
        href: "/admin2/settings",
    },
];

const DashboardContent = memo(function DashboardContent({
    year,
    month,
    totalMembers,
    monthlyParticipationCount,
    monthlyHostCount,
}: DashboardContentProps) {
    const router = useRouter();
    const pathname = usePathname();

    const navigate = useCallback(
        (y: number, m: number) => {
            router.push(
                `${pathname}?year=${y}&month=${m}`,
            );
        },
        [router, pathname],
    );

    const handlePrev = useCallback(() => {
        if (month <= 1) navigate(year - 1, 12);
        else navigate(year, month - 1);
    }, [year, month, navigate]);

    const handleNext = useCallback(() => {
        if (month >= 12) navigate(year + 1, 1);
        else navigate(year, month + 1);
    }, [year, month, navigate]);

    return (
        <>
            <AdminMonthNav
                year={year}
                month={month}
                onPrev={handlePrev}
                onNext={handleNext}
            />

            {/* 통계 카드 */}
            <FadeIn>
                <div className="flex gap-3">
                    <AdminStatCard
                        value={totalMembers}
                        label="전체 멤버"
                    />
                    <AdminStatCard
                        value={monthlyParticipationCount}
                        label="월 출석"
                    />
                    <AdminStatCard
                        value={monthlyHostCount}
                        label="호스트"
                    />
                </div>
            </FadeIn>

            {/* 관리 메뉴 */}
            <SectionLabel>관리 메뉴</SectionLabel>
            <AnimatedList className="space-y-2">
                {menuItems.map((item) => (
                    <AnimatedItem key={item.href}>
                        <AdminListItem
                            title={item.title}
                            subtitle={item.subtitleFn(
                                totalMembers,
                                monthlyParticipationCount,
                            )}
                            href={item.href}
                        />
                    </AnimatedItem>
                ))}
            </AnimatedList>
        </>
    );
});

export default DashboardContent;
