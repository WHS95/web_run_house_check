"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminContext } from "@/app/admin/AdminContextProvider";
import { createClient } from "@/lib/supabase/client";
import PageHeader from "@/components/organisms/common/PageHeader";

interface MemberEntry {
    name: string;
    count: number;
}

interface DayEntry {
    name: string;
    count: number;
    percentage: number;
    members: MemberEntry[];
}

interface DayDetailData {
    dayData: DayEntry[];
    maxDay: DayEntry | null;
    minDay: DayEntry | null;
    avgPerDay: string;
    totalCount: number;
}

export default function DayDetailPage() {
    const { crewId } = useAdminContext();
    const router = useRouter();
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [data, setData] = useState<DayDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedDay, setExpandedDay] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        if (!crewId) return;

        setIsLoading(true);
        try {
            const supabase = createClient();

            // 한국 시간 기준으로 해당 월의 범위 계산
            const startDateStr = `${year}-${String(month).padStart(2, "0")}-01`;
            const lastDayOfMonth = new Date(year, month, 0).getDate();
            const endDateStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;

            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);

            const startUTC = new Date(
                startDate.getTime() - 9 * 60 * 60 * 1000
            );
            const endUTC = new Date(
                endDate.getTime() +
                    24 * 60 * 60 * 1000 -
                    1 -
                    9 * 60 * 60 * 1000
            );

            // 활성 멤버 조회
            const { data: activeMembers } = await supabase
                .schema("attendance")
                .from("user_crews")
                .select("user_id")
                .eq("crew_id", crewId)
                .eq("status", "ACTIVE");

            if (!activeMembers || activeMembers.length === 0) {
                setData(null);
                return;
            }

            const activeMemberIds = activeMembers.map(
                (m: any) => m.user_id
            );

            // 출석 기록 조회 (멤버 이름 포함)
            const { data: records } = await supabase
                .schema("attendance")
                .from("attendance_records")
                .select(
                    "id, attendance_timestamp, user_id, user:user_id(first_name)"
                )
                .eq("crew_id", crewId)
                .in("user_id", activeMemberIds)
                .is("deleted_at", null)
                .gte("attendance_timestamp", startUTC.toISOString())
                .lte("attendance_timestamp", endUTC.toISOString())
                .order("attendance_timestamp", { ascending: true });

            if (records) {
                const dayNames = [
                    "일요일",
                    "월요일",
                    "화요일",
                    "수요일",
                    "목요일",
                    "금요일",
                    "토요일",
                ];
                const grouped: Record<
                    number,
                    {
                        count: number;
                        members: Record<
                            string,
                            { name: string; count: number }
                        >;
                    }
                > = {};

                for (let i = 0; i < 7; i++) {
                    grouped[i] = { count: 0, members: {} };
                }

                let totalCount = 0;

                records.forEach((r: any) => {
                    const utcDate = new Date(r.attendance_timestamp);
                    const koreanDate = new Date(
                        utcDate.getTime() + 9 * 60 * 60 * 1000
                    );
                    const koreanYear = koreanDate.getUTCFullYear();
                    const koreanMonth = koreanDate.getUTCMonth() + 1;

                    if (koreanYear === year && koreanMonth === month) {
                        const day = koreanDate.getUTCDay();
                        grouped[day].count++;
                        totalCount++;
                        const userName =
                            r.user?.first_name ?? "멤버";
                        if (!grouped[day].members[r.user_id]) {
                            grouped[day].members[r.user_id] = {
                                name: userName,
                                count: 0,
                            };
                        }
                        grouped[day].members[r.user_id].count++;
                    }
                });

                const dayData: DayEntry[] = dayNames.map(
                    (name, i) => ({
                        name,
                        count: grouped[i].count,
                        percentage:
                            totalCount > 0
                                ? Math.round(
                                      (grouped[i].count / totalCount) *
                                          100
                                  )
                                : 0,
                        members: Object.values(grouped[i].members).sort(
                            (a, b) => b.count - a.count
                        ),
                    })
                );

                // 최다/최저 참여 요일 계산
                const sorted = [...dayData].sort(
                    (a, b) => b.count - a.count
                );
                const maxDay = sorted[0];
                const activeDays = sorted.filter((d) => d.count > 0);
                const minDay =
                    activeDays.length > 0
                        ? activeDays[activeDays.length - 1]
                        : sorted[sorted.length - 1];
                const avgPerDay =
                    totalCount > 0
                        ? (totalCount / 7).toFixed(1)
                        : "0";

                setData({
                    dayData,
                    maxDay,
                    minDay,
                    avgPerDay,
                    totalCount,
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [crewId, year, month]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-rh-bg-primary">
                <div className="shrink-0 bg-rh-bg-surface pt-safe">
                    <PageHeader
                        title="요일별 참여율 상세"
                        backLink="/admin/analyze"
                        iconColor="white"
                        backgroundColor="bg-rh-bg-surface"
                    />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse text-rh-text-secondary">
                        로딩 중...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <div className="shrink-0 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="요일별 참여율 상세"
                    backLink="/admin/analyze"
                    iconColor="white"
                    backgroundColor="bg-rh-bg-surface"
                />
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-5">
                {/* 기간 표시 */}
                <p className="text-center text-base font-semibold text-white">
                    {year}년 {month}월
                </p>

                {data ? (
                    <>
                        {/* 요약 카드 */}
                        <div className="flex gap-3">
                            <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-rh-bg-surface py-3">
                                <span className="text-[11px] text-rh-text-tertiary">
                                    최다 참여
                                </span>
                                <span className="text-base font-bold text-rh-accent">
                                    {data.maxDay?.name ?? "-"}
                                </span>
                                <span className="text-[11px] text-rh-text-tertiary">
                                    {data.maxDay?.count ?? 0}건
                                </span>
                            </div>
                            <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-rh-bg-surface py-3">
                                <span className="text-[11px] text-rh-text-tertiary">
                                    최저 참여
                                </span>
                                <span className="text-base font-bold text-white">
                                    {data.minDay?.name ?? "-"}
                                </span>
                                <span className="text-[11px] text-rh-text-tertiary">
                                    {data.minDay?.count ?? 0}건
                                </span>
                            </div>
                            <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-rh-bg-surface py-3">
                                <span className="text-[11px] text-rh-text-tertiary">
                                    전체 평균
                                </span>
                                <span className="text-base font-bold text-rh-accent">
                                    {data.avgPerDay}명
                                </span>
                                <span className="text-[11px] text-rh-text-tertiary">
                                    / 일
                                </span>
                            </div>
                        </div>

                        {/* 요일별 상세 섹션 */}
                        <div className="space-y-3">
                            {data.dayData.map(
                                (day: DayEntry, idx: number) => (
                                    <div
                                        key={idx}
                                        className="rounded-xl bg-rh-bg-surface p-4"
                                    >
                                        <button
                                            onClick={() =>
                                                setExpandedDay(
                                                    expandedDay === idx
                                                        ? null
                                                        : idx
                                                )
                                            }
                                            className="w-full"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-white">
                                                        {day.name}
                                                    </span>
                                                    <span className="rounded-full bg-rh-accent/20 px-2 py-0.5 text-[11px] font-medium text-rh-accent">
                                                        {day.count}건
                                                    </span>
                                                </div>
                                                <span className="text-sm text-rh-text-secondary">
                                                    {day.percentage}%
                                                </span>
                                            </div>
                                            {/* 프로그래스 바 */}
                                            <div className="h-1.5 rounded-full bg-rh-bg-primary">
                                                <div
                                                    className="h-full rounded-full bg-rh-accent transition-all"
                                                    style={{
                                                        width: `${day.percentage}%`,
                                                    }}
                                                />
                                            </div>
                                        </button>

                                        {/* 확장된 멤버 목록 */}
                                        {expandedDay === idx &&
                                            day.members.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-rh-border space-y-1.5">
                                                    {day.members.map(
                                                        (
                                                            m: MemberEntry,
                                                            mi: number
                                                        ) => (
                                                            <div
                                                                key={mi}
                                                                className="flex items-center justify-between text-sm"
                                                            >
                                                                <span className="text-rh-text-secondary">
                                                                    {m.name}
                                                                </span>
                                                                <span className="text-xs text-rh-text-tertiary">
                                                                    {m.count}회
                                                                    참여
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                )
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center py-20">
                        <p className="text-rh-text-secondary">
                            데이터가 없습니다.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
