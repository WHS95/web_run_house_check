import { Suspense } from "react";
import { getAdminAuth } from "@/lib/admin2/auth";
import {
    getAnalyticsData,
} from "@/lib/admin2/queries";
import PageHeader
    from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import YearMonthSelector
    from "./components/YearMonthSelector";
import DayBarChart
    from "./components/DayBarChart";
import PlaceBarChart
    from "./components/PlaceBarChart";
import OverallCard
    from "./components/OverallCard";

/* 요일 이름 매핑 */
const DAY_NAMES = [
    "일", "월", "화", "수", "목", "금", "토",
];
/* 월~토~일 순서로 표시 */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/* ── 요일별 참여율 계산 ── */
function computeDayStats(
    records: {
        attendance_timestamp: string;
    }[],
) {
    const dayCounts: Record<number, number> = {
        0: 0, 1: 0, 2: 0,
        3: 0, 4: 0, 5: 0, 6: 0,
    };
    let total = 0;
    records.forEach((r) => {
        const utc = new Date(
            r.attendance_timestamp,
        );
        const kst = new Date(
            utc.getTime() + 9 * 60 * 60 * 1000,
        );
        dayCounts[kst.getUTCDay()]++;
        total++;
    });
    return DAY_ORDER.map((i) => ({
        dayName: DAY_NAMES[i] + "요일",
        shortName: DAY_NAMES[i],
        participationRate:
            total > 0
                ? Math.round(
                    (dayCounts[i] / total) * 100,
                )
                : 0,
    }));
}

/* ── 장소별 참여율 계산 ── */
function computePlaceStats(
    records: { location: string }[],
) {
    const counts: Record<string, number> = {};
    let total = 0;
    records.forEach((r) => {
        const loc = r.location || "기타";
        counts[loc] = (counts[loc] || 0) + 1;
        total++;
    });
    return Object.entries(counts)
        .map(([name, count]) => ({
            locationName: name,
            participationRate:
                total > 0
                    ? Math.round(
                        (count / total) * 100,
                    )
                    : 0,
        }))
        .sort(
            (a, b) =>
                b.participationRate
                - a.participationRate,
        );
}

/* ── 전체 출석 현황 계산 ── */
function computeOverallStats(analytics: {
    records: { user_id: string }[];
    totalMembers: number;
    memberIds: string[];
}) {
    const attendedIds = new Set(
        analytics.records.map((r) => r.user_id),
    );
    const total = analytics.memberIds.length;
    const attended = analytics.memberIds.filter(
        (id) => attendedIds.has(id),
    ).length;
    return {
        totalMembers: total,
        attendedMembers: attended,
        attendanceRate:
            total > 0
                ? Math.round(
                    (attended / total) * 100,
                )
                : 0,
    };
}

/* ── 메인 페이지 ── */
export default async function Admin2AnalyzePage({
    searchParams,
}: {
    searchParams: Promise<{
        year?: string;
        month?: string;
    }>;
}) {
    const { crewId } = await getAdminAuth();
    const params = await searchParams;
    const now = new Date();
    const year = params.year
        ? parseInt(params.year)
        : now.getFullYear();
    const month = params.month
        ? parseInt(params.month)
        : now.getMonth() + 1;

    return (
        <>
            <div
                className={
                    "sticky top-0 z-50"
                    + " bg-rh-bg-primary pt-safe"
                }
            >
                <PageHeader
                    title="통계 분석"
                    backLink="/admin2"
                    iconColor="white"
                    backgroundColor={
                        "bg-rh-bg-surface"
                    }
                />
            </div>
            <div
                className={
                    "flex-1 px-4 pt-4"
                    + " pb-4 space-y-5"
                }
            >
                <YearMonthSelector
                    year={year}
                    month={month}
                />
                <Suspense
                    fallback={
                        <AnalyticsSkeleton />
                    }
                >
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

/* ── 서버 데이터 페칭 + 차트 렌더 ── */
async function AnalyticsChartsServer({
    crewId,
    year,
    month,
}: {
    crewId: string;
    year: number;
    month: number;
}) {
    const analytics = await getAnalyticsData(
        crewId,
        year,
        month,
    );
    const dayStats = computeDayStats(
        analytics.records,
    );
    const placeStats = computePlaceStats(
        analytics.records,
    );
    const overall = computeOverallStats(analytics);

    return (
        <FadeIn>
            <div className="space-y-5">
                <DayBarChart
                    data={dayStats}
                    year={year}
                    month={month}
                />
                <PlaceBarChart
                    data={placeStats}
                    year={year}
                    month={month}
                />
                <OverallCard
                    totalMembers={
                        overall.totalMembers
                    }
                    attendedMembers={
                        overall.attendedMembers
                    }
                    attendanceRate={
                        overall.attendanceRate
                    }
                    year={year}
                    month={month}
                />
            </div>
        </FadeIn>
    );
}

/* ── 스켈레톤 (정적, animate-pulse 없음) ── */
function AnalyticsSkeleton() {
    return (
        <div className="space-y-5">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className={
                        "bg-rh-bg-surface"
                        + " rounded-xl p-4"
                        + " h-[200px]"
                    }
                />
            ))}
        </div>
    );
}
