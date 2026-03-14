"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthNavigatorProps {
    year: number;
    month: number;
    onPrev: () => void;
    onNext: () => void;
    disabled?: boolean;
}

const MonthNavigator: React.FC<MonthNavigatorProps> = ({
    year,
    month,
    onPrev,
    onNext,
    disabled = false,
}) => (
    <div className="flex h-10 items-center justify-center gap-5">
        <button
            onClick={onPrev}
            disabled={disabled}
            className="p-1 text-rh-text-secondary active:scale-90 transition-transform disabled:opacity-40"
            aria-label="이전 달"
        >
            <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-base font-semibold text-white">
            {year}년 {month}월
        </span>
        <button
            onClick={onNext}
            disabled={disabled}
            className="p-1 text-rh-text-secondary active:scale-90 transition-transform disabled:opacity-40"
            aria-label="다음 달"
        >
            <ChevronRight className="h-5 w-5" />
        </button>
    </div>
);

export default MonthNavigator;
