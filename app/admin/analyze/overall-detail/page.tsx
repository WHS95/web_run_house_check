"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminContext } from "@/app/admin/AdminContextProvider";
import { createClient } from "@/lib/supabase/client";
import PageHeader from "@/components/organisms/common/PageHeader";

type FilterType = "all" | "attended" | "absent";

interface MemberStat {
    userId: string;
    name: string;
    attendanceCount: number;
    hostCount: number;
    percentage: number;
}

interface OverallDetailData {
    totalMembers: number;
    attendedMembers: number;
    absentMembers: number;
    memberStats: MemberStat[];
    totalAttendanceDays: number;
}

export default function OverallDetailPage() {
    const { crewId } = useAdminContext();
    const router = useRouter();
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [data, setData] = useState<OverallDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");

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

            // 활성 멤버 조회 (이름 포함)
            const { data: activeMembers } = await supabase
                .schema("attendance")
                .from("user_crews")
                .select("user_id, user:user_id(first_name)")
                .eq("crew_id", crewId)
                .eq("status", "ACTIVE");

            if (!activeMembers || activeMembers.length === 0) {
                setData(null);
                return;
            }

            const activeMemberIds = activeMembers.map(
                (m: any) => m.user_id
            );

            // 출석 기록 조회
            const { data: records } = await supabase
                .schema("attendance")
                .from("attendance_records")
                .select(
                    "id, attendance_timestamp, user_id, is_host"
                )
                .eq("crew_id", crewId)
                .in("user_id", activeMemberIds)
                .is("deleted_at", null)
                .gte("attendance_timestamp", startUTC.toISOString())
                .lte("attendance_timestamp", endUTC.toISOString());

            // 월의 고유 출석 날짜 수 계산 (총 활동일)
            const uniqueDates = new Set<string>();
            const memberAttendance: Record<
                string,
                { count: number; hostCount: number }
            > = {};

            records?.forEach((r: any) => {
                const utcDate = new Date(r.attendance_timestamp);
                const koreanDate = new Date(
                    utcDate.getTime() + 9 * 60 * 60 * 1000
                );
                const koreanYear = koreanDate.getUTCFullYear();
                const koreanMonth = koreanDate.getUTCMonth() + 1;

                if (koreanYear === year && koreanMonth === month) {
                    const dateKey = `${koreanDate.getUTCFullYear()}-${koreanDate.getUTCMonth()}-${koreanDate.getUTCDate()}`;
                    uniqueDates.add(dateKey);

                    if (!memberAttendance[r.user_id]) {
                        memberAttendance[r.user_id] = {
                            count: 0,
                            hostCount: 0,
                        };
                    }
                    memberAttendance[r.user_id].count++;
                    if (r.is_host) {
                        memberAttendance[r.user_id].hostCount++;
                    }
                }
            });

            const totalAttendanceDays = uniqueDates.size || 1;

            // 멤버별 통계 생성
            const memberStats: MemberStat[] = activeMembers.map(
                (m: any) => {
                    const stats = memberAttendance[m.user_id] || {
                        count: 0,
                        hostCount: 0,
                    };
                    return {
                        userId: m.user_id,
                        name: m.user?.first_name ?? "멤버",
                        attendanceCount: stats.count,
                        hostCount: stats.hostCount,
                        percentage:
                            totalAttendanceDays > 0
                                ? Math.round(
                                      (stats.count /
                                          totalAttendanceDays) *
                                          100
                                  )
                                : 0,
                    };
                }
            );

            // 출석 횟수로 정렬
            memberStats.sort(
                (a, b) => b.attendanceCount - a.attendanceCount
            );

            const attendedCount = memberStats.filter(
                (m) => m.attendanceCount > 0
            ).length;

            setData({
                totalMembers: activeMembers.length,
                attendedMembers: attendedCount,
                absentMembers: activeMembers.length - attendedCount,
                memberStats,
                totalAttendanceDays,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [crewId, year, month]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 필터링된 멤버 목록
    const filteredMembers = data
        ? data.memberStats.filter((m) => {
              if (filter === "attended")
                  return m.attendanceCount > 0;
              if (filter === "absent")
                  return m.attendanceCount === 0;
              return true;
          })
        : [];

    // 이니셜 아바타 생성
    const getInitial = (name: string) => {
        return name.charAt(0);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-rh-bg-primary">
                <div className="shrink-0 bg-rh-bg-surface pt-safe">
                    <PageHeader
                        title="전체 대비 출석 상세"
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

    const filterTabs: { key: FilterType; label: string }[] = [
        { key: "all", label: "전체" },
        { key: "attended", label: "참여" },
        { key: "absent", label: "미참여" },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <div className="shrink-0 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="전체 대비 출석 상세"
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
                                    전체 인원
                                </span>
                                <span className="text-base font-bold text-white">
                                    {data.totalMembers}명
                                </span>
                            </div>
                            <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-rh-bg-surface py-3">
                                <span className="text-[11px] text-rh-text-tertiary">
                                    참여 인원
                                </span>
                                <span className="text-base font-bold text-rh-accent">
                                    {data.attendedMembers}명
                                </span>
                            </div>
                            <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-rh-bg-surface py-3">
                                <span className="text-[11px] text-rh-text-tertiary">
                                    미참여
                                </span>
                                <span className="text-base font-bold text-rh-status-error">
                                    {data.absentMembers}명
                                </span>
                            </div>
                        </div>

                        {/* 필터 탭 */}
                        <div className="flex gap-2">
                            {filterTabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() =>
                                        setFilter(tab.key)
                                    }
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                                        filter === tab.key
                                            ? "bg-rh-accent text-white"
                                            : "bg-rh-bg-surface text-rh-text-secondary"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* 멤버 목록 */}
                        <div className="space-y-3">
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map(
                                    (member, idx) => (
                                        <div
                                            key={member.userId}
                                            className="rounded-xl bg-rh-bg-surface p-4"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                {/* 아바타 */}
                                                <div className="w-8 h-8 rounded-full bg-rh-accent/20 flex items-center justify-center shrink-0">
                                                    <span className="text-sm font-medium text-rh-accent">
                                                        {getInitial(
                                                            member.name
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-white truncate">
                                                            {
                                                                member.name
                                                            }
                                                        </span>
                                                        <span className="text-sm font-semibold text-rh-accent ml-2">
                                                            {
                                                                member.percentage
                                                            }
                                                            %
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-rh-text-tertiary mt-0.5">
                                                        {
                                                            member.attendanceCount
                                                        }
                                                        회
                                                        {member.hostCount >
                                                            0 &&
                                                            ` · 개설 ${member.hostCount}회`}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* 프로그래스 바 */}
                                            <div className="h-1.5 rounded-full bg-rh-bg-primary">
                                                <div
                                                    className="h-full rounded-full bg-rh-accent transition-all"
                                                    style={{
                                                        width: `${Math.min(member.percentage, 100)}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                )
                            ) : (
                                <div className="flex items-center justify-center py-10">
                                    <p className="text-rh-text-secondary text-sm">
                                        해당 조건의 멤버가
                                        없습니다.
                                    </p>
                                </div>
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
