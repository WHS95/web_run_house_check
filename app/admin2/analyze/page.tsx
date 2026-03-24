import { Suspense } from "react";
import { getAdminAuth } from "@/lib/admin2/auth";
import { getAnalyticsData } from "@/lib/admin2/queries";
import PageHeader from "@/components/organisms/common/PageHeader";
import ChartWithAxis from "@/components/molecules/ChartWithAxis";
import LocationChart from "@/components/molecules/LocationChart";
import MemberAttendanceStatusChart from "@/components/molecules/MemberAttendanceStatusChart";
import YearMonthSelector from "./components/YearMonthSelector";
import Link from "next/link";

// 참여율에 따른 블루 그래디언트 색상
function getParticipationColor(rate: number, allRates: number[]): string {
    const max = Math.max(...allRates, 1);
    const ratio = rate / max;
    const colors = [
        "#2B5AA8",
        "#3769B5",
        "#4478C2",
        "#5187CF",
        "#5F96DC",
        "#6DA5E8",
        "#7AB4F5",
    ];
    const index = Math.min(
        Math.floor(ratio * (colors.length - 1)),
        colors.length - 1
    );
    return colors[index];
}

// 요일별 참여율 계산 (서버 사이드)
function computeDayStats(
    records: { attendance_timestamp: string; location: string; user_id: string }[]
) {
    const dayNames = [
        "일요일",
        "월요일",
        "화요일",
        "수요일",
        "목요일",
        "금요일",
        "토요일",
    ];
    const dayCounts: Record<number, number> = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
    };
    let total = 0;

    records.forEach((r) => {
        const utcDate = new Date(r.attendance_timestamp);
        const kstDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
        const day = kstDate.getUTCDay();
        dayCounts[day]++;
        total++;
    });

    const rates = Array.from({ length: 7 }, (_, i) =>
        total > 0 ? Math.round((dayCounts[i] / total) * 100) : 0
    );

    return Array.from({ length: 7 }, (_, i) => ({
        dayName: dayNames[i],
        dayIndex: i,
        participationRate: rates[i],
        participantCount: dayCounts[i],
        totalMembers: total,
        color: getParticipationColor(rates[i], rates),
    })).sort((a, b) => b.participationRate - a.participationRate);
}

// 장소별 참여율 계산
function computePlaceStats(
    records: { attendance_timestamp: string; location: string; user_id: string }[]
) {
    const locationCounts: Record<string, number> = {};
    let total = 0;

    records.forEach((r) => {
        const loc = r.location || "기타";
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        total++;
    });

    // 블루 톤 팔레트만 사용 (디자인 시스템 준수)
    const colors = [
        "bg-rh-accent",
        "bg-rh-status-success",
        "bg-rh-status-warning",
        "bg-rh-status-error",
        "bg-blue-400",
        "bg-blue-300",
        "bg-blue-200",
    ];

    return Object.entries(locationCounts)
        .map(([name, count], i) => ({
            locationName: name,
            participationRate:
                total > 0 ? Math.round((count / total) * 100) : 0,
            attendanceCount: count,
            totalAttendance: total,
            color: colors[i % colors.length],
        }))
        .sort((a, b) => b.participationRate - a.participationRate);
}

// 전체 출석 현황 계산
function computeOverallStats(analytics: {
    records: { user_id: string }[];
    totalMembers: number;
    memberIds: string[];
}) {
    const attendedIds = new Set(analytics.records.map((r) => r.user_id));
    const activeMembers = analytics.memberIds.length;
    const attended = analytics.memberIds.filter((id) =>
        attendedIds.has(id)
    ).length;
    const absent = activeMembers - attended;

    return {
        totalActiveMembers: activeMembers,
        attendedMembers: attended,
        attendanceRate:
            activeMembers > 0
                ? Math.round((attended / activeMembers) * 100)
                : 0,
        absentMembers: absent,
        absentRate:
            activeMembers > 0
                ? Math.round((absent / activeMembers) * 100)
                : 0,
    };
}

export default async function Admin2AnalyzePage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string; month?: string }>;
}) {
    const { crewId } = await getAdminAuth();
    const params = await searchParams;
    const now = new Date();
    const year = params.year ? parseInt(params.year) : now.getFullYear();
    const month = params.month ? parseInt(params.month) : now.getMonth() + 1;

    return (
        <>
            <div className="sticky top-0 z-50 bg-rh-bg-primary pt-safe">
                <PageHeader
                    title="통계 분석"
                    backLink="/admin2"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>
            <div className="flex-1 px-4 pt-4 pb-4 space-y-4">
                <YearMonthSelector year={year} month={month} />

                <Suspense fallback={<AnalyticsSkeleton />}>
                    <AnalyticsChartsServer
                        crewId={crewId}
                        year={year}
                        month={month}
                    />
                </Suspense>
            </div>
        </>
    );
}

async function AnalyticsChartsServer({
    crewId,
    year,
    month,
}: {
    crewId: string;
    year: number;
    month: number;
}) {
    const analytics = await getAnalyticsData(crewId, year, month);
    const dayStats = computeDayStats(analytics.records);
    const placeStats = computePlaceStats(analytics.records);
    const overallStats = computeOverallStats(analytics);

    return (
        <div className="space-y-4">
            {/* 요일별 참여율 */}
            <div className="bg-rh-bg-surface rounded-rh-md p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">
                        요일별 참여율
                    </h3>
                    <Link
                        href="/admin/analyze/day-detail"
                        className="text-xs text-rh-accent"
                    >
                        상세
                    </Link>
                </div>
                <ChartWithAxis
                    title=""
                    data={dayStats}
                    year={year}
                    month={month}
                />
            </div>

            {/* 장소별 참여율 */}
            <div className="bg-rh-bg-surface rounded-rh-md p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">
                        장소별 참여율
                    </h3>
                    <Link
                        href="/admin/analyze/place-detail"
                        className="text-xs text-rh-accent"
                    >
                        상세
                    </Link>
                </div>
                <LocationChart
                    title=""
                    data={placeStats}
                    year={year}
                    month={month}
                />
            </div>

            {/* 전체 대비 출석 현황 */}
            <div className="bg-rh-bg-surface rounded-rh-md p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">
                        전체 대비 출석 현황
                    </h3>
                    <Link
                        href="/admin/analyze/overall-detail"
                        className="text-xs text-rh-accent"
                    >
                        상세
                    </Link>
                </div>
                <MemberAttendanceStatusChart
                    title=""
                    data={overallStats}
                    year={year}
                    month={month}
                />
            </div>
        </div>
    );
}

function AnalyticsSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="bg-rh-bg-surface rounded-rh-md p-4 h-[200px]"
                />
            ))}
        </div>
    );
}
