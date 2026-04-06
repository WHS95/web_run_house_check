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

            {/* ── 축소 모드 (1줄) ── */}
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
                        "flex items-center gap-1.5"
                        + " bg-rh-bg-surface"
                        + " rounded-[12px]"
                        + " h-9 p-1"
                    }
                >
                    {/* 연도 < > */}
                    <button
                        onClick={() =>
                            navigate(year - 1, month)
                        }
                        className={
                            "shrink-0 p-0.5"
                            + " text-rh-text-tertiary"
                        }
                    >
                        <ChevronLeft
                            className="w-4 h-4"
                        />
                    </button>
                    <span
                        className={
                            "shrink-0 text-[13px]"
                            + " font-bold text-white"
                            + " min-w-[32px]"
                            + " text-center"
                        }
                    >
                        {year}
                    </span>
                    <button
                        onClick={() =>
                            navigate(year + 1, month)
                        }
                        className={
                            "shrink-0 p-0.5"
                            + " text-rh-text-tertiary"
                        }
                    >
                        <ChevronRight
                            className="w-4 h-4"
                        />
                    </button>

                    {/* 구분선 */}
                    <div
                        className={
                            "w-px h-5 shrink-0"
                            + " bg-rh-border"
                        }
                    />

                    {/* 월 선택 */}
                    <div
                        className={
                            "flex flex-1"
                            + " gap-0.5"
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
                                    + " rounded-md"
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
            </div>
        </>
    );
}
