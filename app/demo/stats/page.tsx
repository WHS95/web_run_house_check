"use client";

import { ChevronLeft, ChevronRight, TrendingUp, Trophy } from "lucide-react";
import {
    DEMO_DAY_STATS,
    DEMO_PLACE_STATS,
    DEMO_OVERALL,
    DEMO_RANKINGS,
} from "@/lib/demo/fixtures";

export default function DemoStatsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <header className="sticky top-0 z-50 bg-rh-bg-surface border-b border-rh-border">
                <div className="flex h-14 items-center px-4 pt-safe">
                    <h1 className="text-[18px] font-semibold text-white">통계 분석</h1>
                </div>
            </header>

            <div className="bg-rh-bg-surface px-4 pb-3">
                <div className="flex items-center justify-between rounded-lg bg-rh-bg-primary/50 px-2 py-1.5">
                    <button
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/5"
                        aria-label="이전 달"
                    >
                        <ChevronLeft className="h-4 w-4 text-rh-text-tertiary" />
                    </button>
                    <span className="text-[14px] font-semibold text-white">2026년 4월</span>
                    <button
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/5"
                        aria-label="다음 달"
                    >
                        <ChevronRight className="h-4 w-4 text-rh-text-tertiary" />
                    </button>
                </div>
            </div>

            <div className="flex-1 px-4 py-4 space-y-4">
                <OverallCard />
                <DayChart />
                <PlaceChart />
                <RankingCard />
            </div>
        </div>
    );
}

function OverallCard() {
    const { totalMembers, attendedMembers, attendanceRate } = DEMO_OVERALL;
    return (
        <div className="rounded-xl bg-rh-bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-rh-accent" />
                <h3 className="text-[15px] font-semibold text-white">전체 출석 현황</h3>
            </div>
            <div className="flex gap-2">
                <StatBox label="전체" value={`${totalMembers}명`} />
                <StatBox label="참여" value={`${attendedMembers}명`} />
                <StatBox label="참여율" value={`${attendanceRate}%`} accent />
            </div>
            <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-rh-bg-muted/40">
                    <div
                        className="h-full rounded-full bg-rh-accent"
                        style={{ width: `${attendanceRate}%` }}
                    />
                </div>
                <p className="mt-2 text-[11px] text-rh-text-tertiary">
                    이번 달 한 번 이상 출석한 멤버 비율
                </p>
            </div>
        </div>
    );
}

function StatBox({
    label,
    value,
    accent = false,
}: {
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div className="flex-1 rounded-lg bg-rh-bg-primary/40 p-3 text-center">
            <p className="text-[10px] text-rh-text-tertiary">{label}</p>
            <p
                className={`mt-1 text-[16px] font-bold ${
                    accent ? "text-rh-accent" : "text-white"
                }`}
            >
                {value}
            </p>
        </div>
    );
}

function DayChart() {
    const max = Math.max(...DEMO_DAY_STATS.map((d) => d.rate), 1);
    return (
        <div className="rounded-xl bg-rh-bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-white">요일별 참여율</h3>
                <span className="text-[11px] text-rh-text-tertiary">상세 →</span>
            </div>
            <div className="flex h-[120px] items-end gap-1.5">
                {DEMO_DAY_STATS.map((d) => {
                    const h = max > 0 ? Math.max((d.rate / max) * 108, 4) : 4;
                    const ratio = d.rate / max;
                    const color =
                        ratio >= 0.8
                            ? "bg-rh-accent"
                            : ratio >= 0.5
                            ? "bg-rh-status-success"
                            : ratio >= 0.3
                            ? "bg-rh-status-warning"
                            : "bg-rh-status-error";
                    return (
                        <div
                            key={d.shortName}
                            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                        >
                            <span className="text-[9px] text-rh-text-tertiary">{d.rate}%</span>
                            <div
                                className={`w-full rounded-t ${color}`}
                                style={{ height: h }}
                            />
                            <span className="text-[10px] text-rh-text-tertiary">{d.shortName}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PlaceChart() {
    const max = Math.max(...DEMO_PLACE_STATS.map((p) => p.rate), 1);
    return (
        <div className="rounded-xl bg-rh-bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-white">장소별 참여율</h3>
                <span className="text-[11px] text-rh-text-tertiary">상세 →</span>
            </div>
            <div className="space-y-2.5">
                {DEMO_PLACE_STATS.map((p) => (
                    <div key={p.name} className="space-y-1">
                        <div className="flex items-center justify-between text-[12px]">
                            <span className="text-white">{p.name}</span>
                            <span className="text-rh-text-secondary">{p.rate}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-rh-bg-muted/40">
                            <div
                                className="h-full rounded-full bg-rh-accent"
                                style={{ width: `${(p.rate / max) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RankingCard() {
    const top = DEMO_RANKINGS.slice(0, 5);
    return (
        <div className="rounded-xl bg-rh-bg-surface p-4 space-y-3">
            <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-rh-accent" />
                <h3 className="text-[15px] font-semibold text-white">출석 랭킹 TOP 5</h3>
            </div>
            <div className="space-y-2">
                {top.map(({ rank, member, count }) => (
                    <div key={member.id} className="flex items-center gap-3">
                        <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                                rank === 1
                                    ? "bg-rh-accent text-white"
                                    : rank === 2
                                    ? "bg-rh-status-success/30 text-white"
                                    : rank === 3
                                    ? "bg-rh-status-warning/30 text-white"
                                    : "bg-rh-bg-muted/30 text-rh-text-secondary"
                            }`}
                        >
                            {rank}
                        </span>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rh-bg-muted text-[12px] font-medium text-white">
                            {member.initial}
                        </div>
                        <span className="flex-1 text-[13px] text-white">{member.name}</span>
                        <span className="text-[13px] font-semibold text-rh-accent">
                            {count}회
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
