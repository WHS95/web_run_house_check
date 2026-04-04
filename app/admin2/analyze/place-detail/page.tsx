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
import { AdminBadge } from "@/app/admin2/components/ui";
import AdminProgressBar
    from "@/app/admin2/components/ui/AdminProgressBar";
import AdminStatBox
    from "@/app/admin2/components/ui/AdminStatBox";

/* KST 요일 이름 */
const DAY_NAMES = [
    "일", "월", "화", "수", "목", "금", "토",
];

/* ── 장소별 상세 통계 계산 ── */
interface PlaceDetail {
    location: string;
    count: number;
    rate: number;
    uniqueMembers: number;
    mainDay: string;
    top3: { name: string; count: number }[];
}

function computePlaceDetails(
    records: AnalyticsDetailRecord[],
    totalMembers: number,
): PlaceDetail[] {
    // 장소별 그룹핑
    const grouped: Record<
        string,
        AnalyticsDetailRecord[]
    > = {};
    records.forEach((r) => {
        const loc = r.location || "기타";
        if (!grouped[loc]) grouped[loc] = [];
        grouped[loc].push(r);
    });

    const total = records.length;

    return Object.entries(grouped)
        .map(([location, recs]) => {
            const count = recs.length;
            const rate =
                total > 0
                    ? Math.round(
                        (count / total) * 100,
                    )
                    : 0;

            // 고유 참여 인원
            const memberSet = new Set(
                recs.map((r) => r.user_id),
            );

            // 주 이용 요일 (KST 기준)
            const dayCounts: Record<number, number> =
                {};
            recs.forEach((r) => {
                const utc = new Date(
                    r.attendance_timestamp,
                );
                const kst = new Date(
                    utc.getTime()
                    + 9 * 60 * 60 * 1000,
                );
                const day = kst.getUTCDay();
                dayCounts[day] =
                    (dayCounts[day] || 0) + 1;
            });
            const maxDay = Object.entries(dayCounts)
                .sort(
                    ([, a], [, b]) =>
                        (b as number)
                        - (a as number),
                )[0];
            const mainDay = maxDay
                ? DAY_NAMES[Number(maxDay[0])]
                    + "요일"
                : "-";

            // TOP 3 참여자
            const memberCounts: Record<
                string,
                { name: string; count: number }
            > = {};
            recs.forEach((r) => {
                if (!memberCounts[r.user_id]) {
                    memberCounts[r.user_id] = {
                        name: r.user_name,
                        count: 0,
                    };
                }
                memberCounts[r.user_id].count++;
            });
            const top3 = Object.values(memberCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);

            return {
                location,
                count,
                rate,
                uniqueMembers: memberSet.size,
                mainDay,
                top3,
            };
        })
        .sort((a, b) => b.rate - a.rate);
}

/* ── 메인 페이지 ── */
export default async function PlaceDetailPage({
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

    const backUrl =
        `/admin2/analyze?year=${year}&month=${month}`;

    return (
        <>
            <div
                className={
                    "sticky top-0 z-50"
                    + " bg-rh-bg-primary pt-safe"
                }
            >
                <PageHeader
                    title="장소별 참여율 상세"
                    backLink={backUrl}
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
                        <PlaceDetailSkeleton />
                    }
                >
                    <PlaceDetailServer
                        crewId={crewId}
                        year={year}
                        month={month}
                    />
                </Suspense>
            </div>
        </>
    );
}

/* ── 서버 데이터 페칭 + 렌더 ── */
async function PlaceDetailServer({
    crewId,
    year,
    month,
}: {
    crewId: string;
    year: number;
    month: number;
}) {
    const analytics = await getAnalyticsDetailData(
        crewId,
        year,
        month,
    );
    const places = computePlaceDetails(
        analytics.records,
        analytics.totalMembers,
    );

    // 요약 데이터
    const activeLocations = places.length;
    const topLocation = places[0]?.location || "-";
    const totalAttendance = analytics.records.length;
    const maxRate = places[0]?.rate || 1;

    return (
        <FadeIn>
            <div className="space-y-5">
                {/* 요약 카드 */}
                <div
                    className={
                        "bg-rh-bg-surface"
                        + " rounded-xl p-3.5"
                    }
                >
                    <div
                        className={
                            "grid grid-cols-3"
                            + " gap-2"
                        }
                    >
                        <SummaryCol
                            label="활성 장소"
                            value={
                                `${activeLocations}곳`
                            }
                        />
                        <SummaryCol
                            label="최다 이용"
                            value={topLocation}
                            accent
                        />
                        <SummaryCol
                            label="총 출석"
                            value={
                                `${totalAttendance}회`
                            }
                        />
                    </div>
                </div>

                {/* 장소 리스트 */}
                <AnimatedList
                    className="space-y-2.5"
                >
                    {places.map((place, idx) => (
                        <AnimatedItem
                            key={place.location}
                        >
                            <PlaceCard
                                place={place}
                                rank={idx + 1}
                                maxRate={maxRate}
                            />
                        </AnimatedItem>
                    ))}
                </AnimatedList>
            </div>
        </FadeIn>
    );
}

/* ── 요약 카드 컬럼 ── */
function SummaryCol({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div
            className={
                "flex flex-col items-center gap-1"
            }
        >
            <span
                className={
                    "text-[11px]"
                    + " text-rh-text-tertiary"
                }
            >
                {label}
            </span>
            <span
                className={
                    "text-sm font-bold"
                    + (accent
                        ? " text-rh-accent"
                        : " text-white")
                }
            >
                {value}
            </span>
        </div>
    );
}

/* ── 장소 카드 ── */
function PlaceCard({
    place,
    rank,
    maxRate,
}: {
    place: PlaceDetail;
    rank: number;
    maxRate: number;
}) {
    const isFirst = rank === 1;
    // 프로그레스 바: maxRate 대비 비율
    const barPercent =
        maxRate > 0
            ? Math.round(
                (place.rate / maxRate) * 100,
            )
            : 0;

    return (
        <div
            className={
                "bg-rh-bg-surface rounded-xl"
                + " p-3.5 space-y-3"
                + (isFirst
                    ? " ring-1 ring-rh-accent"
                    : "")
            }
        >
            {/* 헤더: 장소명 + 배지 | 퍼센트 */}
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
                            + (isFirst
                                ? " text-rh-accent"
                                : " text-white")
                        }
                    >
                        {place.location}
                    </span>
                    {isFirst && (
                        <AdminBadge
                            variant="accent"
                        >
                            1위
                        </AdminBadge>
                    )}
                </div>
                <span
                    className={
                        "text-sm"
                        + (isFirst
                            ? " font-bold"
                                + " text-rh-accent"
                            : " font-semibold"
                                + " text-rh-text"
                                + "-secondary")
                    }
                >
                    {place.rate}%
                </span>
            </div>

            {/* 프로그레스 바 */}
            <AdminProgressBar
                percent={barPercent}
            />

            {/* 통계 행 */}
            <div className="flex gap-2">
                <AdminStatBox
                    label="총출석"
                    value={`${place.count}회`}
                />
                <AdminStatBox
                    label="참여인원"
                    value={
                        `${place.uniqueMembers}명`
                    }
                />
                <AdminStatBox
                    label="주이용요일"
                    value={place.mainDay}
                    valueColor={
                        isFirst
                            ? "text-rh-accent"
                            : "text-rh-text"
                                + "-secondary"
                    }
                />
            </div>

            {/* TOP 3 참여자 (1위 장소만) */}
            {isFirst && place.top3.length > 0 && (
                <div className="space-y-1.5">
                    <span
                        className={
                            "text-[11px]"
                            + " font-semibold"
                            + " text-rh-text"
                            + "-tertiary"
                        }
                    >
                        참여자 TOP 3
                    </span>
                    {place.top3.map((m, i) => (
                        <div
                            key={m.name + i}
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
                                {i + 1}. {m.name}
                            </span>
                            <span
                                className={
                                    "text-xs"
                                    + (i === 0
                                        ? " font-bold"
                                            + " text-rh"
                                            + "-accent"
                                        : " text-rh"
                                            + "-text"
                                            + "-tertiary")
                                }
                            >
                                {m.count}회
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── 스켈레톤 (정적, animate-pulse 없음) ── */
function PlaceDetailSkeleton() {
    return (
        <div className="space-y-5">
            <div
                className={
                    "bg-rh-bg-surface"
                    + " rounded-xl h-[72px]"
                }
            />
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className={
                        "bg-rh-bg-surface"
                        + " rounded-xl h-[180px]"
                    }
                />
            ))}
        </div>
    );
}
