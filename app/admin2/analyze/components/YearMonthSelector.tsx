"use client";

import {
    useRouter,
    usePathname,
} from "next/navigation";
import { useCallback } from "react";
import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import StickyCollapseHeader
    from "@/components/atoms/StickyCollapseHeader";

const monthOptions = Array.from(
    { length: 12 },
    (_, i) => i + 1,
);

export default function YearMonthSelector({
    year,
    month,
}: {
    year: number;
    month: number;
}) {
    const router = useRouter();
    const pathname = usePathname();

    const navigate = useCallback(
        (y: number, m: number) => {
            router.push(
                `${pathname}?year=${y}&month=${m}`,
            );
        },
        [router, pathname],
    );

    const goPrevMonth = useCallback(() => {
        if (month === 1) {
            navigate(year - 1, 12);
        } else {
            navigate(year, month - 1);
        }
    }, [year, month, navigate]);

    const goNextMonth = useCallback(() => {
        if (month === 12) {
            navigate(year + 1, 1);
        } else {
            navigate(year, month + 1);
        }
    }, [year, month, navigate]);

    /* ── 펼침 모드 (2줄) ── */
    const expandedUI = (
        <div className="space-y-2">
            {/* 월 네비게이터 */}
            <div
                className={
                    "flex items-center"
                    + " justify-between h-9"
                }
            >
                <button
                    onClick={goPrevMonth}
                    className={
                        "p-1"
                        + " text-rh-text-tertiary"
                    }
                >
                    <ChevronLeft
                        className="w-6 h-6"
                    />
                </button>
                <span
                    className={
                        "text-[17px]"
                        + " font-bold"
                        + " text-white"
                    }
                >
                    {year}년 {month}월
                </span>
                <button
                    onClick={goNextMonth}
                    className={
                        "p-1"
                        + " text-rh-text-tertiary"
                    }
                >
                    <ChevronRight
                        className="w-6 h-6"
                    />
                </button>
            </div>

            {/* 월 선택 바 */}
            <div
                className={
                    "flex gap-0"
                    + " bg-rh-bg-surface"
                    + " rounded-[12px]"
                    + " h-9 p-0.5"
                }
            >
                {monthOptions.map((m) => (
                    <button
                        key={m}
                        onClick={() =>
                            navigate(year, m)
                        }
                        className={
                            "flex-1 min-w-0"
                            + " flex items-center"
                            + " justify-center"
                            + " rounded-lg"
                            + " text-[11px]"
                            + " font-medium"
                            + " transition-colors"
                            + (month === m
                                ? " bg-rh-accent"
                                  + " text-white"
                                  + " font-semibold"
                                : " text-rh-text-tertiary")
                        }
                    >
                        {m}
                    </button>
                ))}
            </div>
        </div>
    );

    /* ── 축소 모드 (< 2026년 4월 >) ── */
    const collapsedUI = (
        <div
            className={
                "flex items-center"
                + " justify-between h-9"
            }
        >
            <button
                onClick={goPrevMonth}
                className={
                    "p-1"
                    + " text-rh-text-tertiary"
                }
            >
                <ChevronLeft
                    className="w-5 h-5"
                />
            </button>
            <span
                className={
                    "text-[15px]"
                    + " font-bold text-white"
                }
            >
                {year}년 {month}월
            </span>
            <button
                onClick={goNextMonth}
                className={
                    "p-1"
                    + " text-rh-text-tertiary"
                }
            >
                <ChevronRight
                    className="w-5 h-5"
                />
            </button>
        </div>
    );

    return (
        <StickyCollapseHeader
            expanded={expandedUI}
            collapsed={collapsedUI}
        />
    );
}
