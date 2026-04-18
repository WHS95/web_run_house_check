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

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

/**
 * 최근 4주간 출석 히트맵 (Mon-Sun × 4 rows)
 * 현재 일자 기준 전후 2주씩 표시
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
        thisMonday.setDate(
            today.getDate() + mondayOffset
        );

        // 4주 범위: 2주 전 월요일 ~ 다음주 일요일
        const startMonday = new Date(thisMonday);
        startMonday.setDate(
            thisMonday.getDate() - 14
        );
        const endSunday = new Date(thisMonday);
        endSunday.setDate(
            thisMonday.getDate() + 13
        );

        // 월 라벨 생성
        const startMonth =
            startMonday.getMonth() + 1;
        const endMonth = endSunday.getMonth() + 1;
        const year = today.getFullYear();
        const monthLabel =
            startMonth === endMonth
                ? `${year}년 ${endMonth}월`
                : `${startMonth}월 – ${endMonth}월`;

        // 출석 날짜 Map
        const attendanceSet =
            new Map<string, number>();
        attendanceDays.forEach((d) => {
            attendanceSet.set(d.date, d.count);
        });

        // 4주 배열 생성
        const weeks: Array<
            Array<{
                date: string;
                day: number;
                isToday: boolean;
                isFuture: boolean;
                isMonthStart: boolean;
                monthShort: string;
                count: number;
            }>
        > = [];

        const MONTH_SHORT = [
            '1월', '2월', '3월', '4월', '5월', '6월',
            '7월', '8월', '9월', '10월', '11월', '12월',
        ];

        for (let w = 0; w < 4; w++) {
            const weekStart = new Date(startMonday);
            weekStart.setDate(
                startMonday.getDate() + w * 7
            );
            const week: Array<{
                date: string;
                day: number;
                isToday: boolean;
                isFuture: boolean;
                isMonthStart: boolean;
                monthShort: string;
                count: number;
            }> = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(weekStart);
                d.setDate(
                    weekStart.getDate() + i
                );
                const dateStr =
                    d.getFullYear() +
                    '-' +
                    String(
                        d.getMonth() + 1
                    ).padStart(2, '0') +
                    '-' +
                    String(
                        d.getDate()
                    ).padStart(2, '0');
                const isFuture = d > today;
                week.push({
                    date: dateStr,
                    day: d.getDate(),
                    isToday: dateStr === todayStr,
                    isFuture,
                    isMonthStart: d.getDate() === 1,
                    monthShort: MONTH_SHORT[d.getMonth()],
                    count: isFuture
                        ? 0
                        : attendanceSet.get(
                              dateStr
                          ) ?? 0,
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
                            className="w-10 text-center text-xs
                                font-medium text-rh-text-tertiary"
                        >
                            {day}
                        </span>
                    ))}
                </div>
                <div className="flex flex-col gap-1">
                    {[0, 1, 2, 3].map((wi) => (
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
                <span className="text-xs text-rh-text-tertiary">
                    최근 4주
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

            {/* 4주 히트맵 */}
            <div className="flex flex-col gap-2 pt-2">
                {weeks.map((week, wi) => (
                    <div
                        key={wi}
                        className="flex justify-around"
                    >
                        {week.map((day, di) => {
                            const attended =
                                !day.isToday && day.count > 0;
                            const isDim =
                                !day.isToday &&
                                day.count === 0;

                            return (
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
                                    className="relative flex h-10 w-10
                                        items-center justify-center"
                                >
                                    {/* 월 시작 칩 */}
                                    {day.isMonthStart && (
                                        <span
                                            className="absolute -top-3
                                                left-1/2 -translate-x-1/2
                                                rounded-full
                                                bg-rh-bg-muted
                                                px-1.5 py-0.5
                                                text-[10px]
                                                font-semibold
                                                text-white
                                                leading-none"
                                        >
                                            {day.monthShort}
                                        </span>
                                    )}

                                    {/* 참여한 날: 손으로 그린 체크 마크 */}
                                    {attended && (
                                        <svg
                                            viewBox="0 0 40 40"
                                            className="absolute
                                                inset-0 h-full w-full
                                                text-rh-accent"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M8 22 Q13 27, 17 30 Q22 22, 33 10" />
                                        </svg>
                                    )}

                                    {/* 오늘: 솔리드 원 */}
                                    {day.isToday && (
                                        <span
                                            className="absolute inset-1
                                                rounded-full
                                                bg-rh-accent"
                                        />
                                    )}

                                    {/* 날짜 숫자 */}
                                    <span
                                        className={`relative text-xs
                                            font-semibold
                                            ${
                                                day.isToday
                                                    ? 'text-white'
                                                    : attended
                                                      ? 'text-white'
                                                      : isDim &&
                                                          day.isFuture
                                                        ? 'text-rh-text-muted'
                                                        : 'text-rh-text-tertiary'
                                            }`}
                                    >
                                        {day.day}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
});

WeeklyAttendanceHeatmap.displayName = 'WeeklyAttendanceHeatmap';

export default WeeklyAttendanceHeatmap;
