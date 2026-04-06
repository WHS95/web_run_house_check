"use client";

import {
    useRouter,
    usePathname,
} from "next/navigation";
import {
    useRef,
    useState,
    useEffect,
    useCallback,
} from "react";
import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

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
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [isStuck, setIsStuck] = useState(false);

    const navigate = useCallback(
        (y: number, m: number) => {
            router.push(
                `${pathname}?year=${y}&month=${m}`,
            );
        },
        [router, pathname],
    );

    /* 이전/다음 월 이동 */
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

    /* sentinel이 viewport 밖으로 나가면 stuck */
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                setIsStuck(!entry.isIntersecting);
            },
            { threshold: 0 },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <>
            {/* sentinel — sticky 감지용 */}
            <div
                ref={sentinelRef}
                className="h-0 w-full pointer-events-none"
                aria-hidden
            />

            {/* ── 펼침 모드 (2줄) ── */}
            <div
                className={
                    "transition-all duration-300"
                    + " ease-out overflow-hidden"
                }
                style={{
                    maxHeight: isStuck ? 0 : 100,
                    opacity: isStuck ? 0 : 1,
                }}
            >
                <div className="space-y-2">
                    {/* 연도 네비게이터 */}
                    <div
                        className={
                            "flex items-center"
                            + " justify-between h-9"
                        }
                    >
                        <button
                            onClick={() =>
                                navigate(
                                    year - 1,
                                    month,
                                )
                            }
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
                            {year}년
                        </span>
                        <button
                            onClick={() =>
                                navigate(
                                    year + 1,
                                    month,
                                )
                            }
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
                            "flex gap-0.5"
                            + " bg-rh-bg-surface"
                            + " rounded-[12px]"
                            + " h-9 p-1"
                        }
                    >
                        {monthOptions.map((m) => (
                            <button
                                key={m}
                                onClick={() =>
                                    navigate(year, m)
                                }
                                className={
                                    "flex-1 flex"
                                    + " items-center"
                                    + " justify-center"
                                    + " rounded-lg"
                                    + " text-xs"
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
            </div>

            {/* ── 축소 모드 (< 2026년 6월 >) ── */}
            <div
                className={
                    "transition-all duration-300"
                    + " ease-out overflow-hidden"
                }
                style={{
                    maxHeight: isStuck ? 44 : 0,
                    opacity: isStuck ? 1 : 0,
                }}
            >
                <div
                    className={
                        "flex items-center"
                        + " justify-between"
                        + " h-9"
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
                            className="w-5 h-5"
                        />
                    </button>
                </div>
            </div>
        </>
    );
}
