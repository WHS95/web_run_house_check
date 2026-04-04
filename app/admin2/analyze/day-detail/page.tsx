import { Suspense } from "react";
import { getAdminAuth } from "@/lib/admin2/auth";
import {
    getAnalyticsDetailData,
    type AnalyticsDetailRecord,
} from "@/lib/admin2/queries";
import PageHeader
    from "@/components/organisms/common/PageHeader";
import FadeIn from "@/components/atoms/FadeIn";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import {
    AdminBadge,
    AdminDivider,
} from "@/app/admin2/components/ui";
import AdminProgressBar
    from "@/app/admin2/components/ui/AdminProgressBar";

/* ── 요일 상수 ── */
const DAY_NAMES = [
    "일", "월", "화", "수", "목", "금", "토",
];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/* ── 멤버 참여 정보 ── */
interface MemberStat {
    userId: string;
    name: string;
    attendCount: number;
    hostCount: number;
}

/* ── 요일별 통계 ── */
interface DayStat {
    dayIndex: number;
    dayName: string;
    count: number;
    rate: number;
    members: MemberStat[];
}

/* ── 요약 정보 ── */
interface DaySummary {
    bestDay: string;
    bestAvg: number;
    worstDay: string;
    worstAvg: number;
    overallAvg: number;
}

/* ── 서버 사이드 데이터 계산 ── */
function computeDayDetail(
    records: AnalyticsDetailRecord[],
    totalMembers: number,
): {
    days: DayStat[];
    summary: DaySummary;
    maxRate: number;
} {
    // 요일별 레코드 그룹핑 (KST)
    const dayRecords: Record<
        number,
        AnalyticsDetailRecord[]
    > = {};
    DAY_ORDER.forEach((i) => {
        dayRecords[i] = [];
    });

    records.forEach((r) => {
        const utc = new Date(
            r.attendance_timestamp,
        );
        const kst = new Date(
            utc.getTime() + 9 * 60 * 60 * 1000,
        );
        const day = kst.getUTCDay();
        if (!dayRecords[day]) dayRecords[day] = [];
        dayRecords[day].push(r);
    });

    // 고유 날짜 수 계산 (전체 평균용)
    const uniqueDates = new Set(
        records.map((r) => {
            const utc = new Date(
                r.attendance_timestamp,
            );
            const kst = new Date(
                utc.getTime() + 9 * 60 * 60 * 1000,
            );
            return kst.toISOString().slice(0, 10);
        }),
    );

    // 요일별 통계 생성
    const total = records.length;
    const days: DayStat[] = DAY_ORDER.map((i) => {
        const recs = dayRecords[i] || [];
        const count = recs.length;
        const rate =
            total > 0
                ? Math.round(
                    (count / total) * 100,
                )
                : 0;

        // 멤버별 참여/개설 횟수
        const memberMap: Record<
            string,
            MemberStat
        > = {};
        recs.forEach((r) => {
            if (!memberMap[r.user_id]) {
                memberMap[r.user_id] = {
                    userId: r.user_id,
                    name: r.user_name,
                    attendCount: 0,
                    hostCount: 0,
                };
            }
            memberMap[r.user_id].attendCount++;
            if (r.is_host) {
                memberMap[r.user_id].hostCount++;
            }
        });

        // 참여 횟수 내림차순 정렬
        const members = Object.values(memberMap)
            .sort(
                (a, b) =>
                    b.attendCount - a.attendCount,
            );

        return {
            dayIndex: i,
            dayName: DAY_NAMES[i] + "요일",
            count,
            rate,
            members,
        };
    });

    // 참여율 내림차순 정렬
    days.sort((a, b) => b.rate - a.rate);

    const maxRate =
        days.length > 0 ? days[0].rate : 0;

    // 참여율 > 0인 항목 중 최고/최저
    const activeDays = days.filter(
        (d) => d.rate > 0,
    );
    const bestDay =
        activeDays.length > 0
            ? activeDays[0]
            : days[0];
    const worstDay =
        activeDays.length > 0
            ? activeDays[activeDays.length - 1]
            : days[days.length - 1];

    // 요일별 고유 날짜 수로 평균 계산
    const dayUniqueDates: Record<number, Set<string>> =
        {};
    DAY_ORDER.forEach((i) => {
        dayUniqueDates[i] = new Set();
    });
    records.forEach((r) => {
        const utc = new Date(
            r.attendance_timestamp,
        );
        const kst = new Date(
            utc.getTime() + 9 * 60 * 60 * 1000,
        );
        const day = kst.getUTCDay();
        const dateStr = kst
            .toISOString()
            .slice(0, 10);
        if (!dayUniqueDates[day]) {
            dayUniqueDates[day] = new Set();
        }
        dayUniqueDates[day].add(dateStr);
    });

    // 최다/최저 요일 평균 인원
    const bestDayDates =
        dayUniqueDates[bestDay.dayIndex]?.size || 1;
    const worstDayDates =
        dayUniqueDates[worstDay.dayIndex]?.size
        || 1;

    const bestAvg = Math.round(
        bestDay.count / bestDayDates,
    );
    const worstAvg = Math.round(
        worstDay.count / worstDayDates,
    );

    // 전체 평균 (총 레코드 / 고유 날짜 수)
    const totalDates =
        uniqueDates.size > 0
            ? uniqueDates.size
            : 1;
    const overallAvg = Math.round(
        total / totalDates,
    );

    return {
        days,
        summary: {
            bestDay: bestDay.dayName,
            bestAvg,
            worstDay: worstDay.dayName,
            worstAvg,
            overallAvg,
        },
        maxRate,
    };
}

/* ── 메인 페이지 ── */
export default async function DayDetailPage({
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

    const backLink =
        `/admin2/analyze?year=${year}`
        + `&month=${month}`;

    return (
        <>
            <div
                className={
                    "sticky top-0 z-50"
                    + " bg-rh-bg-primary pt-safe"
                }
            >
                <PageHeader
                    title="요일별 참여율 상세"
                    backLink={backLink}
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
                {/* 월 라벨 */}
                <div
                    className={
                        "flex items-center"
                        + " justify-center h-8"
                    }
                >
                    <span
                        className={
                            "text-sm font-semibold"
                            + " text-rh-text-secondary"
                        }
                    >
                        {year}년 {month}월
                    </span>
                </div>

                <Suspense
                    fallback={
                        <DayDetailSkeleton />
                    }
                >
                    <DayDetailServer
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
async function DayDetailServer({
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
    const { days, summary, maxRate } =
        computeDayDetail(
            data.records,
            data.totalMembers,
        );

    return (
        <FadeIn>
            <div className="space-y-5">
                {/* 요약 카드 */}
                <SummaryCard
                    summary={summary}
                />
                {/* 요일별 리스트 */}
                <AnimatedList
                    className="space-y-2.5"
                >
                    {days.map((day, idx) => (
                        <AnimatedItem
                            key={day.dayIndex}
                        >
                            <DayCard
                                day={day}
                                isBest={
                                    idx === 0
                                    && day.rate > 0
                                }
                                maxRate={maxRate}
                            />
                        </AnimatedItem>
                    ))}
                </AnimatedList>
            </div>
        </FadeIn>
    );
}

/* ── 요약 카드 ── */
function SummaryCard({
    summary,
}: {
    summary: DaySummary;
}) {
    return (
        <div
            className={
                "bg-rh-bg-surface"
                + " rounded-xl p-3.5"
            }
        >
            <div className="grid grid-cols-3 gap-2">
                {/* 최다 참여 */}
                <div className="text-center">
                    <p
                        className={
                            "text-[11px]"
                            + " text-rh-text-tertiary"
                            + " mb-1"
                        }
                    >
                        최다 참여
                    </p>
                    <p
                        className={
                            "text-sm font-bold"
                            + " text-rh-accent"
                        }
                    >
                        {summary.bestDay}
                    </p>
                    <p
                        className={
                            "text-[11px]"
                            + " text-rh-text-muted"
                        }
                    >
                        평균 {summary.bestAvg}명
                    </p>
                </div>
                {/* 최저 참여 */}
                <div className="text-center">
                    <p
                        className={
                            "text-[11px]"
                            + " text-rh-text-tertiary"
                            + " mb-1"
                        }
                    >
                        최저 참여
                    </p>
                    <p
                        className={
                            "text-sm font-bold"
                            + " text-rh-text-secondary"
                        }
                    >
                        {summary.worstDay}
                    </p>
                    <p
                        className={
                            "text-[11px]"
                            + " text-rh-text-muted"
                        }
                    >
                        평균 {summary.worstAvg}명
                    </p>
                </div>
                {/* 전체 평균 */}
                <div className="text-center">
                    <p
                        className={
                            "text-[11px]"
                            + " text-rh-text-tertiary"
                            + " mb-1"
                        }
                    >
                        전체 평균
                    </p>
                    <p
                        className={
                            "text-sm font-bold"
                            + " text-white"
                        }
                    >
                        {summary.overallAvg}명
                    </p>
                    <p
                        className={
                            "text-[11px]"
                            + " text-rh-text-muted"
                        }
                    >
                        /일
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ── 요일 카드 ── */
function DayCard({
    day,
    isBest,
    maxRate,
}: {
    day: DayStat;
    isBest: boolean;
    maxRate: number;
}) {
    // 상위 멤버 표시 수
    const showCount = isBest ? 3 : 2;
    const topMembers = day.members.slice(
        0,
        showCount,
    );
    const remaining =
        day.members.length - showCount;

    // 프로그레스 바 퍼센트 (최대값 대비)
    const barPercent =
        maxRate > 0
            ? Math.round(
                (day.rate / maxRate) * 100,
            )
            : 0;

    return (
        <div
            className={
                "bg-rh-bg-surface rounded-xl"
                + " p-3.5 space-y-2.5"
                + (isBest
                    ? " ring-1 ring-rh-accent"
                    : "")
            }
        >
            {/* 헤더 행 */}
            <div
                className={
                    "flex items-center"
                    + " justify-between"
                }
            >
                <div
                    className={
                        "flex items-center gap-2"
                    }
                >
                    <span
                        className={
                            "text-sm font-semibold"
                            + (isBest
                                ? " text-rh-accent"
                                : " text-white")
                        }
                    >
                        {day.dayName}
                    </span>
                    {isBest ? (
                        <AdminBadge
                            variant="accent"
                        >
                            최다
                        </AdminBadge>
                    ) : (
                        <AdminBadge
                            variant="muted"
                        >
                            {day.count}명
                        </AdminBadge>
                    )}
                </div>
                <span
                    className={
                        "text-sm font-semibold"
                        + " text-rh-accent"
                    }
                >
                    {day.rate}%
                </span>
            </div>

            {/* 프로그레스 바 */}
            <AdminProgressBar
                percent={barPercent}
            />

            {/* 멤버 목록 */}
            {topMembers.length > 0 && (
                <div className="space-y-1.5">
                    {topMembers.map((m) => (
                        <div
                            key={m.userId}
                            className={
                                "flex items-center"
                                + " justify-between"
                            }
                        >
                            <span
                                className={
                                    "text-xs"
                                    + " text-rh-text"
                                    + "-secondary"
                                }
                            >
                                {m.name}
                            </span>
                            <span
                                className={
                                    "text-xs"
                                    + " text-rh-text"
                                    + "-tertiary"
                                }
                            >
                                {m.attendCount}회
                                참여
                                {m.hostCount > 0
                                    && ` · 개설 ${m.hostCount}회`}
                            </span>
                        </div>
                    ))}
                    {remaining > 0 && (
                        <>
                            <AdminDivider />
                            <p
                                className={
                                    "text-[11px]"
                                    + " text-rh-text"
                                    + "-muted"
                                    + " text-center"
                                }
                            >
                                외 {remaining}명
                                참여
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── 스켈레톤 (정적) ── */
function DayDetailSkeleton() {
    return (
        <div className="space-y-5">
            <div
                className={
                    "bg-rh-bg-surface"
                    + " rounded-xl h-[90px]"
                }
            />
            {[1, 2, 3, 4, 5].map((i) => (
                <div
                    key={i}
                    className={
                        "bg-rh-bg-surface"
                        + " rounded-xl h-[120px]"
                    }
                />
            ))}
        </div>
    );
}
