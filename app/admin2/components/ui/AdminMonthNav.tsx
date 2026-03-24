"use client";
import { memo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { haptic } from "@/lib/haptic";

interface AdminMonthNavProps {
    year: number;
    month: number;
    onPrev: () => void;
    onNext: () => void;
}

const AdminMonthNav = memo(function AdminMonthNav({
    year,
    month,
    onPrev,
    onNext,
}: AdminMonthNavProps) {
    const handlePrev = useCallback(() => {
        haptic.light();
        onPrev();
    }, [onPrev]);

    const handleNext = useCallback(() => {
        haptic.light();
        onNext();
    }, [onNext]);

    return (
        <div className="flex items-center justify-center gap-5 h-10">
            <button onClick={handlePrev}>
                <ChevronLeft
                    size={20}
                    className="text-rh-text-secondary"
                />
            </button>
            <span className="text-base font-semibold text-white">
                {year}년 {month}월
            </span>
            <button onClick={handleNext}>
                <ChevronRight
                    size={20}
                    className="text-rh-text-secondary"
                />
            </button>
        </div>
    );
});

export default AdminMonthNav;
