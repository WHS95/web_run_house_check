"use client";

import React, { memo, useState, useMemo, useCallback } from "react";
import { GitCommit } from "lucide-react";
import MonthNavigator from "@/components/molecules/MonthNavigator";

interface Activity {
    type: "attendance" | "create_meeting";
    date: string;
    location: string;
    exerciseType: string;
}

interface MyActivityHistoryProps {
    activities: Activity[];
    initialYear: number;
    initialMonth: number; // 1-12
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const formatActivityDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekday = WEEKDAYS[d.getDay()];
    return `${month}월 ${day}일 (${weekday})`;
};

const formatActivityTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
};

const MyActivityHistory = memo<MyActivityHistoryProps>(
    ({ activities, initialYear, initialMonth }) => {
        const [year, setYear] = useState(initialYear);
        const [month, setMonth] = useState(initialMonth);

        const handlePrev = useCallback(() => {
            if (month === 1) {
                setYear((y) => y - 1);
                setMonth(12);
            } else {
                setMonth((m) => m - 1);
            }
        }, [month]);

        const handleNext = useCallback(() => {
            if (month === 12) {
                setYear((y) => y + 1);
                setMonth(1);
            } else {
                setMonth((m) => m + 1);
            }
        }, [month]);

        const filteredActivities = useMemo(() => {
            return activities.filter((a) => {
                const d = new Date(a.date);
                return (
                    d.getFullYear() === year && d.getMonth() + 1 === month
                );
            });
        }, [activities, year, month]);

        return (
            <div className='space-y-2'>
                <div className='rounded-rh-md bg-rh-bg-surface'>
                    <MonthNavigator
                        year={year}
                        month={month}
                        onPrev={handlePrev}
                        onNext={handleNext}
                    />
                </div>

                {filteredActivities.length > 0 ? (
                    <div className='space-y-2'>
                        {filteredActivities.map((activity, idx) => (
                            <div
                                key={`${activity.date}-${activity.type}-${idx}`}
                                className='flex items-start justify-between gap-3 rounded-rh-md bg-rh-bg-surface px-4 py-3'
                            >
                                <div className='flex flex-col gap-0.5 min-w-0 flex-1'>
                                    <span className='text-sm font-medium text-white truncate'>
                                        {formatActivityDate(activity.date)}
                                    </span>
                                    <span className='text-xs text-rh-text-tertiary truncate'>
                                        {activity.location} ·{" "}
                                        {activity.exerciseType} ·{" "}
                                        {formatActivityTime(activity.date)}
                                    </span>
                                </div>
                                <span
                                    className={`shrink-0 self-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                        activity.type === "attendance"
                                            ? "bg-rh-accent/20 text-rh-accent"
                                            : "bg-rh-bg-muted text-rh-text-secondary"
                                    }`}
                                >
                                    {activity.type === "attendance"
                                        ? "출석"
                                        : "모임 개설"}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className='flex flex-col items-center justify-center rounded-rh-md bg-rh-bg-surface py-10'>
                        <GitCommit className='w-6 h-6 mb-2 text-rh-text-tertiary' />
                        <p className='text-sm text-rh-text-tertiary'>
                            {year}년 {month}월 활동 기록이 없습니다
                        </p>
                    </div>
                )}
            </div>
        );
    }
);

MyActivityHistory.displayName = "MyActivityHistory";

export default MyActivityHistory;
