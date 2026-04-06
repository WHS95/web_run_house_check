'use client';

import React, { memo, useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AttendanceDay {
    date: string; // YYYY-MM-DD
    count: number; // 출석 횟수
}

interface WeeklyAttendanceHeatmapProps {
    /** 최근 출석 기록 (date + count) */
    attendanceDays: AttendanceDay[];
    className?: string;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * 지난 2주간 출석 히트맵 (Mon-Sun × 2 rows)
 * .pen 디자인: CalendarCard (bg-surface, rounded-xl, pad 12/8)
 */
const WeeklyAttendanceHeatmap = memo<WeeklyAttendanceHeatmapProps>(({
    attendanceDays,
    className = '',
}) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const { weeks, monthLabel } = useMemo(() => {
        if (!mounted) return { weeks: [], monthLabel: '' };
        const today = new Date();
        const todayStr =
            today.getFullYear() +
            '-' +
            String(today.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(today.getDate()).padStart(2, '0');

        // 이번 주 월요일 구하기
        const dayOfWeek = today.getDay(); // 0=Sun
        const mondayOffset =
            dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const thisMonday = new Date(today);
        thisMonday.setDate(today.getDate() + mondayOffset);

        // 지난주 월요일
        const lastMonday = new Date(thisMonday);
        lastMonday.setDate(thisMonday.getDate() - 7);

        // 월 라벨 생성 (지난주~이번주 범위)
        const lastMondayMonth = lastMonday.getMonth() + 1;
        const todayMonth = today.getMonth() + 1;
        const year = today.getFullYear();
        const monthLabel =
            lastMondayMonth === todayMonth
                ? `${year}년 ${todayMonth}월`
                : `${lastMondayMonth}월 – ${todayMonth}월`;

        // 출석 날짜 Set
        const attendanceSet = new Map<string, number>();
        attendanceDays.forEach((d) => {
            attendanceSet.set(d.date, d.count);
        });

        // 2주 배열 생성
        const weeks: Array<
            Array<{
                date: string;
                isToday: boolean;
                count: number;
            }>
        > = [];

        for (
            let weekStart of [lastMonday, thisMonday]
        ) {
            const week: Array<{
                date: string;
                isToday: boolean;
                count: number;
            }> = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(weekStart);
                d.setDate(weekStart.getDate() + i);
                const dateStr =
                    d.getFullYear() +
                    '-' +
                    String(d.getMonth() + 1).padStart(
                        2,
                        '0'
                    ) +
                    '-' +
                    String(d.getDate()).padStart(2, '0');
                const isFuture = d > today;
                week.push({
                    date: dateStr,
                    isToday: dateStr === todayStr,
                    count: isFuture
                        ? 0
                        : attendanceSet.get(dateStr) ?? 0,
                });
            }
            weeks.push(week);
        }

        return { weeks, monthLabel };
    }, [attendanceDays, mounted]);

    // SSR 시 정적 플레이스홀더
    if (!mounted) {
        return (
            <div
                className={`rounded-rh-xl bg-rh-bg-surface p-3 ${className}`}
            >
                <div className="flex justify-around mb-1">
                    {DAY_LABELS.map((day) => (
                        <span
                            key={day}
                            className="w-10 text-center text-[11px]
                                font-medium text-rh-text-tertiary"
                        >
                            {day}
                        </span>
                    ))}
                </div>
                <div className="flex flex-col gap-1">
                    {[0, 1].map((wi) => (
                        <div
                            key={wi}
                            className="flex justify-around"
                        >
                            {Array.from({ length: 7 }).map(
                                (_, di) => (
                                    <div
                                        key={di}
                                        className="h-10 w-10 rounded-rh-md"
                                    />
                                )
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-rh-xl bg-rh-bg-surface p-3 ${className}`}
        >
            {/* 월 라벨 */}
            <div className="flex items-center justify-between mb-2 px-0.5">
                <span className="text-[13px] font-semibold text-white">
                    {monthLabel}
                </span>
                <span className="text-[11px] text-rh-text-tertiary">
                    최근 2주
                </span>
            </div>

            {/* 요일 헤더 */}
            <div className="flex justify-around mb-1">
                {DAY_LABELS.map((day) => (
                    <span
                        key={day}
                        className="w-10 text-center text-[11px]
                            font-medium text-rh-text-tertiary"
                    >
                        {day}
                    </span>
                ))}
            </div>

            {/* 2주 히트맵 */}
            <div className="flex flex-col gap-1">
                {weeks.map((week, wi) => (
                    <div
                        key={wi}
                        className="flex justify-around"
                    >
                        {week.map((day, di) => (
                            <motion.div
                                key={day.date}
                                initial={{
                                    scale: 0,
                                    opacity: 0,
                                }}
                                animate={{
                                    scale: 1,
                                    opacity: 1,
                                }}
                                transition={{
                                    delay:
                                        wi * 0.05 +
                                        di * 0.03,
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 20,
                                }}
                                className={`flex h-10 w-10 items-center
                                    justify-center rounded-rh-md
                                    text-xs font-medium
                                    transition-colors
                                    ${
                                        day.isToday
                                            ? 'bg-rh-accent text-white'
                                            : day.count > 0
                                              ? 'text-rh-text-secondary'
                                              : 'text-rh-text-muted'
                                    }`}
                                style={
                                    !day.isToday &&
                                    day.count > 0
                                        ? {
                                              backgroundColor:
                                                  '#2F3E50',
                                          }
                                        : undefined
                                }
                            >
                                {new Date(
                                    day.date + 'T00:00:00'
                                ).getDate()}
                            </motion.div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
});

WeeklyAttendanceHeatmap.displayName = 'WeeklyAttendanceHeatmap';

export default WeeklyAttendanceHeatmap;
