"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

// 월 라벨: 10월 이상은 숫자만 표시 (.pen 디자인 준수)
function monthLabel(m: number) {
    return m <= 9 ? `${m}월` : `${m}`;
}

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
        <div className="space-y-2">
            {/* 연도 네비게이터 — .pen: justify space_between */}
            <div className="flex items-center justify-between h-9">
                <button
                    onClick={() => navigate(year - 1, month)}
                    className="p-1 text-rh-text-tertiary"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-[17px] font-bold text-white">
                    {year}년
                </span>
                <button
                    onClick={() => navigate(year + 1, month)}
                    className="p-1 text-rh-text-tertiary"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* 월 선택 바 — .pen: bg-surface rounded-[12px] h-9 p-1 */}
            <div className="flex gap-0.5 bg-rh-bg-surface rounded-[12px] h-9 p-1">
                {monthOptions.map((m) => (
                    <button
                        key={m}
                        onClick={() => navigate(year, m)}
                        className={`flex-1 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                            month === m
                                ? "bg-rh-accent text-white font-semibold"
                                : "text-rh-text-tertiary"
                        }`}
                    >
                        {monthLabel(m)}
                    </button>
                ))}
            </div>
        </div>
    );
}
