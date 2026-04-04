import { Suspense } from "react";
import { getAdminAuth }
    from "@/lib/admin2/auth";
import {
    getAnalyticsDetailData,
    type AnalyticsDetailRecord,
} from "@/lib/admin2/queries";
import PageHeader
    from "@/components/organisms/common/PageHeader";
import OverallDetailClient
    from "./components/OverallDetailClient";

/* ── 전체 대비 출석 상세 계산 ── */
function computeOverallDetail(data: {
    records: AnalyticsDetailRecord[];
    memberIds: string[];
    totalMembers: number;
    userMap: Record<string, string>;
}) {
    const { records, memberIds, userMap } = data;

    // 고유 출석일 수 계산 (KST 기준)
    const dateSet = new Set<string>();
    records.forEach((r) => {
        const utc = new Date(
            r.attendance_timestamp,
        );
        const kst = new Date(
            utc.getTime() + 9 * 60 * 60 * 1000,
        );
        const dateStr =
            kst.toISOString().slice(0, 10);
        dateSet.add(dateStr);
    });
    const totalDays = dateSet.size;

    // 멤버별 출석/개설 횟수
    const attendMap = new Map<string, number>();
    const hostMap = new Map<string, number>();
    records.forEach((r) => {
        attendMap.set(
            r.user_id,
            (attendMap.get(r.user_id) || 0) + 1,
        );
        if (r.is_host) {
            hostMap.set(
                r.user_id,
                (hostMap.get(r.user_id) || 0)
                    + 1,
            );
        }
    });

    // 멤버 데이터 생성
    const members = memberIds.map((uid) => {
        const attendCount =
            attendMap.get(uid) || 0;
        const hostCount =
            hostMap.get(uid) || 0;
        const attendanceRate =
            totalDays > 0
                ? (attendCount / totalDays) * 100
                : 0;
        return {
            userId: uid,
            name: userMap[uid] || "이름 없음",
            attendCount,
            hostCount,
            attendanceRate,
            isActive: attendCount > 0,
        };
    });

    // 정렬: 활성 멤버(출석률 내림차순) → 비활성
    members.sort((a, b) => {
        if (a.isActive !== b.isActive) {
            return a.isActive ? -1 : 1;
        }
        return (
            b.attendanceRate - a.attendanceRate
        );
    });

    const attendedCount = members.filter(
        (m) => m.isActive,
    ).length;

    return {
        totalMembers: memberIds.length,
        attendedCount,
        absentCount:
            memberIds.length - attendedCount,
        members,
    };
}

/* ── 메인 페이지 ── */
export default async function OverallDetailPage({
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
                    title="전체 대비 출석 상세"
                    backLink={
                        `/admin2/analyze`
                        + `?year=${year}`
                        + `&month=${month}`
                    }
                    iconColor="white"
                    backgroundColor={
                        "bg-rh-bg-surface"
                    }
                />
            </div>
            <div
                className={
                    "flex-1 px-4 pt-4"
                    + " pb-4"
                }
            >
                <Suspense
                    fallback={
                        <OverallDetailSkeleton />
                    }
                >
                    <OverallDetailServer
                        crewId={crewId}
                        year={year}
                        month={month}
                    />
                </Suspense>
            </div>
        </>
    );
}

/* ── 서버 데이터 페칭 ── */
async function OverallDetailServer({
    crewId,
    year,
    month,
}: {
    crewId: string;
    year: number;
    month: number;
}) {
    const data = await getAnalyticsDetailData(
        crewId,
        year,
        month,
    );
    const computed = computeOverallDetail(data);

    return (
        <OverallDetailClient
            year={year}
            month={month}
            totalMembers={computed.totalMembers}
            attendedCount={computed.attendedCount}
            absentCount={computed.absentCount}
            members={computed.members}
        />
    );
}

/* ── 스켈레톤 (정적, animate-pulse 없음) ── */
function OverallDetailSkeleton() {
    return (
        <div className="space-y-4">
            <div
                className={
                    "h-8 rounded-lg"
                    + " bg-rh-bg-surface"
                    + " w-28 mx-auto"
                }
            />
            <div
                className={
                    "bg-rh-bg-surface"
                    + " rounded-xl h-[72px]"
                }
            />
            <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={
                            "bg-rh-bg-surface"
                            + " rounded-full"
                            + " h-7 w-14"
                        }
                    />
                ))}
            </div>
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className={
                        "bg-rh-bg-surface"
                        + " rounded-xl h-[76px]"
                    }
                />
            ))}
        </div>
    );
}
