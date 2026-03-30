"use client";

import { memo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import FadeIn from "@/components/atoms/FadeIn";
import AdminMonthNav from "./ui/AdminMonthNav";
import AdminStatCard from "./ui/AdminStatCard";

interface DashboardContentProps {
    year: number;
    month: number;
    totalMembers: number;
    monthlyParticipationCount: number;
    monthlyHostCount: number;
}

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
                        label="총 개설"
                    />
                </div>
            </FadeIn>
        </>
    );
});

export default DashboardContent;
