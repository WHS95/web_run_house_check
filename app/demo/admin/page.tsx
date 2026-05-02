"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Users, CalendarDays, Sparkles } from "lucide-react";
import {
    DEMO_CREW,
    DEMO_OVERALL,
    DEMO_ATTENDANCES,
    DEMO_RANKINGS,
    DEMO_MEMBERS,
} from "@/lib/demo/fixtures";

/** 데모 기준일: 2026-04 */
const DEMO_YEAR = 2026;
const DEMO_MONTH = 4; // 4월

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function DemoAdminPage() {
    const [year, setYear] = useState(DEMO_YEAR);
    const [month, setMonth] = useState(DEMO_MONTH);

    const monthData = useMemo(() => buildMonthData(year, month), [year, month]);

    // SSR/CSR TZ 차이로 인한 hydration mismatch 방지를 위해 모든 시각 연산은 UTC.
    // fixtures의 timestamps도 UTC 기준으로 생성되어 있다.
    const monthlyAttendances = useMemo(() => {
        return DEMO_ATTENDANCES.filter((a) => {
            const d = new Date(a.timestamp);
            return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
        });
    }, [year, month]);

    const monthlySessionDays = useMemo(() => {
        const set = new Set<number>();
        monthlyAttendances.forEach((a) => {
            const d = new Date(a.timestamp);
            if (d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month) {
                set.add(d.getUTCDate());
            }
        });
        return set;
    }, [monthlyAttendances, year, month]);

    const goPrev = () => {
        if (month === 1) {
            setMonth(12);
            setYear((y) => y - 1);
        } else setMonth((m) => m - 1);
    };
    const goNext = () => {
        if (month === 12) {
            setMonth(1);
            setYear((y) => y + 1);
        } else setMonth((m) => m + 1);
    };

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <header className="sticky top-0 z-50 bg-rh-bg-surface border-b border-rh-border">
                <div className="flex h-14 items-center px-4 pt-safe">
                    <h1 className="text-[18px] font-semibold text-white">출석 관리</h1>
                    <span className="ml-2 rounded-full bg-rh-accent/15 px-2 py-0.5 text-[10px] text-rh-accent">
                        운영진
                    </span>
                </div>
            </header>

            <div className="flex-1 px-4 py-4 space-y-4">
                <div>
                    <p className="text-[12px] text-rh-text-tertiary">{DEMO_CREW.name}</p>
                    <h2 className="mt-0.5 text-[16px] font-semibold text-white">
                        이번 달 한눈에
                    </h2>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-rh-bg-surface px-2 py-2">
                    <button
                        onClick={goPrev}
                        className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/5"
                        aria-label="이전 달"
                    >
                        <ChevronLeft className="h-5 w-5 text-rh-text-secondary" />
                    </button>
                    <div className="text-[15px] font-semibold text-white">
                        {year}년 {month}월
                    </div>
                    <button
                        onClick={goNext}
                        className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/5"
                        aria-label="다음 달"
                    >
                        <ChevronRight className="h-5 w-5 text-rh-text-secondary" />
                    </button>
                </div>

                <div className="flex gap-3">
                    <StatCard
                        icon={Users}
                        label="전체 멤버"
                        value={`${DEMO_OVERALL.totalMembers}명`}
                    />
                    <StatCard
                        icon={CalendarDays}
                        label="이달 출석"
                        value={`${monthlyAttendances.length}건`}
                    />
                    <StatCard
                        icon={Sparkles}
                        label="모임 일수"
                        value={`${monthlySessionDays.size}일`}
                    />
                </div>

                <div className="rounded-xl bg-rh-bg-surface p-3">
                    <div className="mb-2 grid grid-cols-7 gap-1 px-1">
                        {WEEKDAY_LABELS.map((d, i) => (
                            <div
                                key={d}
                                className={`text-center text-[10px] ${
                                    i === 0
                                        ? "text-rh-status-error"
                                        : "text-rh-text-tertiary"
                                }`}
                            >
                                {d}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {monthData.cells.map((c, i) => {
                            if (c === null) {
                                return <div key={i} className="aspect-square" />;
                            }
                            const has = monthlySessionDays.has(c);
                            return (
                                <div
                                    key={i}
                                    className={`relative aspect-square rounded-md text-center text-[11px] ${
                                        has
                                            ? "bg-rh-accent/20 text-white"
                                            : "text-rh-text-tertiary"
                                    }`}
                                >
                                    <span className="absolute top-1.5 left-1.5">{c}</span>
                                    {has && (
                                        <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-rh-accent" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <div className="mb-2 flex items-baseline justify-between">
                        <h3 className="text-[14px] font-semibold text-white">멤버별 참여</h3>
                        <p className="text-[11px] text-rh-text-tertiary">최근 30일 기준</p>
                    </div>
                    <div className="space-y-1.5">
                        {DEMO_RANKINGS.slice(0, 6).map(({ rank, member, count }) => {
                            const max = DEMO_RANKINGS[0].count || 1;
                            const pct = Math.round((count / max) * 100);
                            return (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-3 rounded-lg bg-rh-bg-surface px-3 py-2.5"
                                >
                                    <span className="w-6 text-center text-[12px] text-rh-text-tertiary">
                                        {rank}
                                    </span>
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rh-bg-muted text-[12px] font-medium text-white">
                                        {member.initial}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between">
                                            <p className="text-[13px] text-white truncate">
                                                {member.name}
                                            </p>
                                            <p className="text-[12px] font-medium text-rh-accent">
                                                {count}회
                                            </p>
                                        </div>
                                        <div className="mt-1 h-1 w-full rounded-full bg-rh-bg-muted/40">
                                            <div
                                                className="h-full rounded-full bg-rh-accent"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h3 className="mb-2 text-[14px] font-semibold text-white">최근 출석 기록</h3>
                    <div className="space-y-1.5">
                        {monthlyAttendances.slice(0, 5).map((a) => {
                            const d = new Date(a.timestamp);
                            const member = DEMO_MEMBERS.find((m) => m.id === a.userId);
                            return (
                                <div
                                    key={a.id}
                                    className="flex items-center justify-between rounded-lg bg-rh-bg-surface px-3 py-2.5"
                                >
                                    <div>
                                        <p className="text-[13px] text-white">
                                            {member?.name}
                                            {a.isHost && (
                                                <span className="ml-1.5 rounded bg-rh-accent/20 px-1.5 py-0.5 text-[10px] text-rh-accent">
                                                    개설
                                                </span>
                                            )}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-rh-text-tertiary">
                                            {a.locationName}
                                        </p>
                                    </div>
                                    <p className="text-[12px] text-rh-text-secondary">
                                        {`${d.getUTCMonth() + 1}/${d.getUTCDate()} ${d
                                            .getUTCHours()
                                            .toString()
                                            .padStart(2, "0")}:${d
                                            .getUTCMinutes()
                                            .toString()
                                            .padStart(2, "0")}`}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Users;
    label: string;
    value: string;
}) {
    return (
        <div className="flex-1 rounded-xl bg-rh-bg-surface p-3">
            <div className="flex items-center gap-1.5 text-rh-text-tertiary">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[11px]">{label}</span>
            </div>
            <p className="mt-1.5 text-[18px] font-bold text-white">{value}</p>
        </div>
    );
}

function buildMonthData(year: number, month: number) {
    // SSR/CSR TZ 차이로 grid가 어긋나지 않도록 UTC 기준으로 계산.
    const first = new Date(Date.UTC(year, month - 1, 1));
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const startDow = first.getUTCDay();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= lastDay; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return { cells };
}
