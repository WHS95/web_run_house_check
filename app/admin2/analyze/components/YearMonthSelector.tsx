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
    const sentinelRef =
        useRef<HTMLDivElement>(null);
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

    /* sticky 감지: main-content를 root로 사용 */
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const root = document.querySelector(
            ".main-content",
        );
        if (!root) return;

        let timer: ReturnType<typeof setTimeout>;
        const obs = new IntersectionObserver(
            ([entry]) => {
                clearTimeout(timer);
                const next =
                    !entry.isIntersecting;
                /* 8ms 디바운스로 떨림 방지 */
                timer = setTimeout(
                    () => setIsStuck(next),
                    8,
                );
            },
            {
                root,
                /* 헤더 56px 아래부터 감지 */
                rootMargin:
                    "-56px 0px 0px 0px",
                threshold: 0,
            },
        );
        obs.observe(el);
        return () => {
            clearTimeout(timer);
            obs.disconnect();
        };
    }, []);

    return (
        <>
            {/* sentinel — sticky 바깥, 일반 흐름 */}
            <div
                ref={sentinelRef}
                className={
                    "h-px w-full"
                    + " pointer-events-none"
                }
                aria-hidden
            />

            {/* sticky 컨테이너 */}
            <div
                className={
                    "sticky top-14 z-40"
                    + " bg-rh-bg-primary"
                    + " px-4 pt-3 pb-4"
                }
            >
                {/* ── 펼침 모드 (2줄) ── */}
                <div
                    className={
                        "transition-all"
                        + " duration-300"
                        + " ease-out"
                        + " overflow-hidden"
                    }
                    style={{
                        maxHeight: isStuck
                            ? 0
                            : 120,
                        opacity: isStuck ? 0 : 1,
                    }}
                >
                    <div className="space-y-2">
                        {/* 연도 네비게이터 */}
                        <div
                            className={
                                "flex items-center"
                                + " justify-between"
                                + " h-9"
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
                                    className={
                                        "w-6 h-6"
                                    }
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
                                    className={
                                        "w-6 h-6"
                                    }
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
                            {monthOptions.map(
                                (m) => (
                                    <button
                                        key={m}
                                        onClick={() =>
                                            navigate(
                                                year,
                                                m,
                                            )
                                        }
                                        className={
                                            "flex-1"
                                            + " min-w-0"
                                            + " flex"
                                            + " items-center"
                                            + " justify-center"
                                            + " rounded-lg"
                                            + " text-[11px]"
                                            + " font-medium"
                                            + " transition-colors"
                                            + (month ===
                                            m
                                                ? " bg-rh-accent"
                                                  + " text-white"
                                                  + " font-semibold"
                                                : " text-rh-text-tertiary")
                                        }
                                    >
                                        {m}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>
                </div>

                {/* ── 축소 모드 ── */}
                <div
                    className={
                        "transition-all"
                        + " duration-300"
                        + " ease-out"
                        + " overflow-hidden"
                    }
                    style={{
                        maxHeight: isStuck
                            ? 44
                            : 0,
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
                                className={
                                    "w-5 h-5"
                                }
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
                                className={
                                    "w-5 h-5"
                                }
                            />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
