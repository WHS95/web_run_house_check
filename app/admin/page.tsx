"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminContext } from "./AdminContextProvider";
import { getAdminStatsOptimized } from "@/lib/admin-stats";
import PageHeader from "@/components/organisms/common/PageHeader";
import MonthNavigator from "@/components/molecules/MonthNavigator";
import SectionLabel from "@/components/atoms/SectionLabel";
import MenuListItem from "@/components/molecules/MenuListItem";
import BottomNavigation from "@/components/organisms/BottomNavigation";

// 스켈레톤 로딩 컴포넌트
function AdminDashboardSkeleton() {
    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <div className="shrink-0 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="관리자 대시보드"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <div className="flex-1 px-4 pt-4 space-y-5">
                <div className="h-10 flex items-center justify-center">
                    <div className="w-32 h-5 bg-rh-bg-muted rounded animate-pulse" />
                </div>
                <div className="flex gap-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="flex-1 h-[90px] bg-rh-bg-surface rounded-rh-md animate-pulse"
                        />
                    ))}
                </div>
                <div className="w-16 h-3 bg-rh-bg-muted rounded animate-pulse" />
                <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="h-14 bg-rh-bg-surface rounded-rh-md animate-pulse"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function AdminPage() {
    const { crewId } = useAdminContext();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(
        currentDate.getFullYear()
    );
    const [selectedMonth, setSelectedMonth] = useState(
        currentDate.getMonth() + 1
    );

    useEffect(() => {
        async function fetchStats() {
            try {
                setIsLoading(true);
                const data = await getAdminStatsOptimized(
                    crewId,
                    selectedYear,
                    selectedMonth
                );
                setStats(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "알 수 없는 오류가 발생했습니다."
                );
            } finally {
                setIsLoading(false);
            }
        }

        if (crewId) {
            fetchStats();
        }
    }, [crewId, selectedYear, selectedMonth]);

    const handlePrevMonth = useCallback(() => {
        setSelectedMonth((prev) => {
            if (prev <= 1) {
                setSelectedYear((y) => y - 1);
                return 12;
            }
            return prev - 1;
        });
    }, []);

    const handleNextMonth = useCallback(() => {
        setSelectedMonth((prev) => {
            if (prev >= 12) {
                setSelectedYear((y) => y + 1);
                return 1;
            }
            return prev + 1;
        });
    }, []);

    if (isLoading) return <AdminDashboardSkeleton />;

    if (error) {
        return (
            <div className="flex flex-col min-h-screen bg-rh-bg-primary">
                <div className="shrink-0 bg-rh-bg-surface pt-safe">
                    <PageHeader
                        title="관리자 대시보드"
                        iconColor="white"
                        backgroundColor="bg-rh-bg-surface"
                    />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-rh-text-secondary">{error}</p>
                </div>
            </div>
        );
    }

    if (!stats) return <AdminDashboardSkeleton />;

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            {/* Header */}
            <div className="shrink-0 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="관리자 대시보드"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-5">
                {/* Month Navigator */}
                <MonthNavigator
                    year={selectedYear}
                    month={selectedMonth}
                    onPrev={handlePrevMonth}
                    onNext={handleNextMonth}
                />

                {/* 3 Stat Cards */}
                <div className="flex gap-3">
                    <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-rh-md bg-rh-bg-surface h-[90px]">
                        <span className="text-2xl font-bold text-rh-accent">
                            {stats.totalMembers}
                        </span>
                        <span className="text-[11px] text-rh-text-tertiary">
                            전체 멤버
                        </span>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-rh-md bg-rh-bg-surface h-[90px]">
                        <span className="text-2xl font-bold text-rh-accent">
                            {stats.monthlyParticipationCount}
                        </span>
                        <span className="text-[11px] text-rh-text-tertiary">
                            총 출석
                        </span>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-rh-md bg-rh-bg-surface h-[90px]">
                        <span className="text-2xl font-bold text-rh-accent">
                            {stats.monthlyHostCount}
                        </span>
                        <span className="text-[11px] text-rh-text-tertiary">
                            총 개설
                        </span>
                    </div>
                </div>

                {/* Menu Section */}
                <SectionLabel>관리 메뉴</SectionLabel>

                <div className="space-y-2">
                    <MenuListItem
                        title="회원 관리"
                        subtitle={`${stats.totalMembers}명 · 활성 ${stats.totalMembers}명`}
                        onClick={() => router.push("/admin/user")}
                    />
                    <MenuListItem
                        title="출석 관리"
                        subtitle={`이번 달 ${stats.monthlyParticipationCount}건`}
                        onClick={() => router.push("/admin/attendance")}
                    />
                    <MenuListItem
                        title="통계 분석"
                        subtitle="요일별 · 장소별 참여율"
                        onClick={() => router.push("/admin/analyze")}
                    />
                    <MenuListItem
                        title="설정"
                        subtitle="장소 · 운영진 · 초대코드"
                        onClick={() => router.push("/admin/settings")}
                    />
                </div>
            </div>

            {/* BottomNav */}
            <BottomNavigation />
        </div>
    );
}
