"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

export default function YearMonthSelector({
    year,
    month,
}: {
    year: number;
    month: number;
}) {
    const router = useRouter();
    const pathname = usePathname();

    const navigate = (y: number, m: number) => {
        router.push(`${pathname}?year=${y}&month=${m}`);
    };

    return (
        <div className="space-y-3">
            {/* 연도 네비게이터 */}
            <div className="flex items-center justify-center gap-4">
                <button
                    onClick={() => navigate(year - 1, month)}
                    className="p-1 text-rh-text-secondary hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-base font-semibold text-white">
                    {year}년
                </span>
                <button
                    onClick={() => navigate(year + 1, month)}
                    className="p-1 text-rh-text-secondary hover:text-white transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* 월 선택 가로 스크롤 */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {monthOptions.map((m) => (
                    <button
                        key={m}
                        onClick={() => navigate(year, m)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                            month === m
                                ? "bg-rh-accent text-white"
                                : "text-rh-text-secondary hover:text-white"
                        }`}
                    >
                        {m}월
                    </button>
                ))}
            </div>
        </div>
    );
}
