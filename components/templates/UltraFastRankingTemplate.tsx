"use client";

import React, {
    useState,
    useCallback,
    useMemo,
    useEffect,
    memo,
} from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/organisms/common/PageHeader";
import YearMonthSelector from "@/app/admin2/analyze/components/YearMonthSelector";
import RankingTabs, {
    TabItem,
} from "@/components/organisms/ranking/RankingTabs";
import RankingListItem from "@/components/organisms/ranking/RankingListItem";
import {
    AnimatedList,
    AnimatedItem,
} from "@/components/atoms/AnimatedList";
import FadeIn from "@/components/atoms/FadeIn";
import type { NotificationType } from "@/components/molecules/common/PopupNotification";

import { haptic } from "@/lib/haptic";
import { fetchRankingData } from "@/app/ranking/actions";

const PopupNotification = React.lazy(
    () => import("@/components/molecules/common/PopupNotification")
);

export interface RankItem {
    user_id: string;
    rank: number;
    name: string | null;
    profile_image_url: string | null;
    value: number;
    is_current_user?: boolean;
}

export interface RankingData {
    selectedYear: number;
    selectedMonth: number;
    attendanceRanking: RankItem[];
    hostingRanking: RankItem[];
    crewName?: string | null;
    /** 헤더 sub 표시용 활성 멤버 수 (sc-rank 사양: "크루명 · N명") */
    memberCount?: number | null;
}

/* 메달 색은 sc-rank 사양 명시값 — 토큰화하지 않는 디자인 의도 예외 */
const MEDAL_SILVER_HEX = "#C0C0C0"; // 2위 실버
const MEDAL_BRONZE_HEX = "#CD7F32"; // 3위 브론즈

interface UltraFastRankingTemplateProps {
    initialData?: RankingData | null;
}

/* ──────────────────────────────────────────────
 * TOP 3 Podium — 1위 라임 xl, 2/3위 lg surface
 *   순서: 좌측 2위 / 가운데 1위(라임, 가장 큼) / 우측 3위
 *   시상대 느낌으로 1위만 height를 더 키우고 라임 배경.
 * ────────────────────────────────────────────── */
const TopPodium = memo(function TopPodium({
    top3,
    scoreLabel,
}: {
    top3: RankItem[];
    scoreLabel: string;
}) {
    // rank 1, 2, 3 매핑 (없을 수 있음)
    const byRank = new Map<number, RankItem>();
    top3.forEach((r) => byRank.set(r.rank, r));
    const first = byRank.get(1);
    const second = byRank.get(2);
    const third = byRank.get(3);

    if (!first) return null;

    const Avatar = ({
        item,
        size,
        tone,
    }: {
        item: RankItem;
        size: number;
        tone: "lime" | "silver" | "bronze" | "surface";
    }) => {
        // 메달 색은 sc-rank 사양 명시값(인라인 style 예외).
        // 그 외는 토큰 클래스 사용.
        let className =
            "rounded-full flex items-center justify-center font-semibold shrink-0";
        const style: React.CSSProperties = {
            width: size,
            height: size,
            fontSize: size * 0.4,
        };
        if (tone === "lime") {
            className +=
                " bg-rh-text-inverted/15 text-rh-text-inverted";
        } else if (tone === "silver") {
            style.background = MEDAL_SILVER_HEX;
            style.color = "#000";
        } else if (tone === "bronze") {
            style.background = MEDAL_BRONZE_HEX;
            style.color = "#000";
        } else {
            className += " bg-rh-bg-inset text-rh-text-secondary";
        }
        return (
            <div
                className={className}
                style={style}
                aria-hidden
            >
                {(item.name || "?").slice(0, 1)}
            </div>
        );
    };

    const SideCard = ({
        item,
        rank,
    }: {
        item: RankItem | undefined;
        rank: 2 | 3;
    }) => {
        if (!item) {
            return (
                <div
                    className="rh-box rh-box-alt rh-box-tight items-center text-center opacity-50"
                    style={{ minHeight: 140 }}
                >
                    <span className="rh-eye">{rank}위</span>
                    <span className="text-rh-text-muted text-[12px] mt-2">
                        —
                    </span>
                </div>
            );
        }
        return (
            <div
                className={`rh-box rh-box-alt rh-box-tight items-center text-center ${
                    item.is_current_user
                        ? "border-rh-accent/50"
                        : ""
                }`}
                style={{ minHeight: 140 }}
            >
                <span className="rh-eye">{rank}위</span>
                <Avatar
                    item={item}
                    size={44}
                    tone={rank === 2 ? "silver" : "bronze"}
                />
                <div className="flex flex-col items-center min-w-0 gap-0.5">
                    <span className="text-rh-body font-medium text-rh-text-primary truncate max-w-full">
                        {item.name || "—"}
                    </span>
                    {item.is_current_user && (
                        <span
                            className="rh-chip"
                            data-on="true"
                            style={{ padding: "1px 6px", fontSize: 10 }}
                        >
                            YOU
                        </span>
                    )}
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="rh-mono text-[20px] font-semibold text-rh-text-primary">
                        {item.value}
                    </span>
                    <span className="text-[11px] text-rh-text-tertiary">
                        {scoreLabel}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-3 gap-2 items-end">
            {/* 2위 (좌) */}
            <SideCard item={second} rank={2} />

            {/* 1위 (가운데, 라임 xl) */}
            <div
                className="relative rounded-rh-lg p-4 flex flex-col items-center text-center bg-rh-accent overflow-hidden"
                style={{ minHeight: 180 }}
            >
                {/* 등고선 데코 (얇게) */}
                <div
                    className="rh-contour text-rh-text-inverted"
                    aria-hidden
                >
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M0,80 Q25,60 50,75 T100,70"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.5"
                        />
                        <path
                            d="M0,55 Q25,40 50,50 T100,45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.5"
                        />
                        <path
                            d="M0,30 Q25,20 50,25 T100,22"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.5"
                        />
                    </svg>
                </div>
                <div className="relative flex flex-col items-center gap-2">
                    <span className="rh-eye text-rh-text-inverted">
                        1위
                    </span>
                    <Avatar item={first} size={56} tone="lime" />
                    <div className="flex flex-col items-center min-w-0 gap-0.5">
                        <span className="text-[14px] font-semibold text-rh-text-inverted truncate max-w-[120px]">
                            {first.name || "—"}
                        </span>
                        {first.is_current_user && (
                            <span
                                className="inline-flex items-center rounded-full bg-rh-text-inverted/15 text-rh-text-inverted font-semibold"
                                style={{
                                    padding: "1px 7px",
                                    fontSize: 10,
                                }}
                            >
                                YOU
                            </span>
                        )}
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="rh-display rh-mono text-[28px] text-rh-text-inverted">
                            {first.value}
                        </span>
                        <span
                            className="text-[11px] font-medium"
                            style={{
                                color: "var(--rh-text-inverted)",
                                opacity: 0.7,
                            }}
                        >
                            {scoreLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3위 (우) */}
            <SideCard item={third} rank={3} />
        </div>
    );
});

const UltraFastRankingTemplate: React.FC<
    UltraFastRankingTemplateProps
> = ({ initialData }) => {
    const router = useRouter();

    const [currentData, setCurrentData] = useState<RankingData>(() => {
        if (initialData) {
            return {
                selectedYear: initialData.selectedYear,
                selectedMonth: initialData.selectedMonth,
                attendanceRanking: initialData.attendanceRanking || [],
                hostingRanking: initialData.hostingRanking || [],
                crewName: initialData.crewName,
                memberCount: initialData.memberCount ?? null,
            };
        }
        // SSR-safe 기본값 — 클라이언트 마운트 후 보정
        return {
            selectedYear: 0,
            selectedMonth: 0,
            attendanceRanking: [],
            hostingRanking: [],
            crewName: null,
            memberCount: null,
        };
    });

    // hydration 안전: 시간 기반 fallback 보정
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        if (!initialData) {
            const now = new Date();
            setCurrentData((prev) => ({
                ...prev,
                selectedYear: prev.selectedYear || now.getFullYear(),
                selectedMonth: prev.selectedMonth || now.getMonth() + 1,
            }));
        }
    }, [initialData]);

    const [activeTab, setActiveTab] = useState("attendance");
    const [isDataLoading, setIsDataLoading] = useState(!initialData);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationType, setNotificationType] =
        useState<NotificationType | null>(null);
    const [notificationMessage, setNotificationMessage] = useState("");

    const tabs: TabItem[] = useMemo(
        () => [
            { id: "attendance", label: "출석 랭킹" },
            { id: "hosting", label: "개설 랭킹" },
        ],
        []
    );

    const loadMonthData = useCallback(
        async (year: number, month: number) => {
            const result = await fetchRankingData(year, month);
            if (result.redirect) {
                router.push(result.redirect);
                return;
            }
            if (result.error || !result.data) {
                throw new Error(
                    result.error || "데이터를 불러오지 못했습니다"
                );
            }
            setCurrentData({
                selectedYear: result.data.selectedYear,
                selectedMonth: result.data.selectedMonth,
                attendanceRanking:
                    result.data.attendanceRanking || [],
                hostingRanking: result.data.hostingRanking || [],
                crewName: result.data.crewName,
                memberCount: result.data.memberCount ?? null,
            });
        },
        [router]
    );

    const handleMonthChange = useCallback(
        async (newYear: number, newMonth: number) => {
            if (isDataLoading) return;
            if (
                newYear === currentData.selectedYear &&
                newMonth === currentData.selectedMonth
            )
                return;
            haptic.light();
            setIsDataLoading(true);
            try {
                await loadMonthData(newYear, newMonth);
            } catch {
                haptic.error();
                setNotificationType("error");
                setNotificationMessage("데이터를 불러오지 못했습니다");
                setShowNotification(true);
            } finally {
                setIsDataLoading(false);
            }
        },
        [
            isDataLoading,
            currentData.selectedYear,
            currentData.selectedMonth,
            loadMonthData,
        ]
    );

    const handleTabChange = useCallback((tabId: string) => {
        haptic.light();
        setActiveTab(tabId);
    }, []);

    const currentRankingData = useMemo(
        () =>
            activeTab === "attendance"
                ? currentData.attendanceRanking
                : currentData.hostingRanking,
        [
            activeTab,
            currentData.attendanceRanking,
            currentData.hostingRanking,
        ]
    );

    const scoreLabel = activeTab === "hosting" ? "개설" : "출석";

    // 값 0 초과 항목만 노출
    const hasRealData = useMemo(
        () => currentRankingData.some((item) => item.value > 0),
        [currentRankingData]
    );
    const visibleRankingData = useMemo(
        () =>
            hasRealData
                ? currentRankingData.filter((item) => item.value > 0)
                : [],
        [hasRealData, currentRankingData]
    );

    const top3 = useMemo(
        () => visibleRankingData.filter((i) => i.rank <= 3),
        [visibleRankingData]
    );
    const rest = useMemo(
        () => visibleRankingData.filter((i) => i.rank > 3),
        [visibleRankingData]
    );

    const currentUserRank = useMemo(
        () =>
            hasRealData
                ? visibleRankingData.find((item) => item.is_current_user)
                : undefined,
        [hasRealData, visibleRankingData]
    );

    const currentUserAttendance = useMemo(() => {
        const item = currentData.attendanceRanking.find(
            (i) => i.is_current_user
        );
        return item && item.value > 0 ? item : undefined;
    }, [currentData.attendanceRanking]);

    const currentUserHosting = useMemo(() => {
        const item = currentData.hostingRanking.find(
            (i) => i.is_current_user
        );
        return item && item.value > 0 ? item : undefined;
    }, [currentData.hostingRanking]);

    /* ── Scroll-to-top FAB ── */
    const [showScrollTop, setShowScrollTop] = useState(false);
    useEffect(() => {
        const el = document.querySelector(".main-content");
        if (!el) return;
        const onScroll = () => {
            setShowScrollTop(
                (el as HTMLElement).scrollTop > 200
            );
        };
        el.addEventListener("scroll", onScroll, {
            passive: true,
        });
        return () => el.removeEventListener("scroll", onScroll);
    }, []);
    const scrollToTop = useCallback(() => {
        haptic.light();
        const el = document.querySelector(
            ".main-content"
        ) as HTMLElement | null;
        el?.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    // sc-rank 사양: sub = "크루명 · N명"
    // crewName/memberCount 모두 서버 props에서 옴 → SSR/CSR 동일하므로 hydration 안전.
    const headerSub = useMemo(() => {
        const name = currentData.crewName?.trim();
        const cnt = currentData.memberCount;
        if (name && typeof cnt === "number") {
            return `${name} · ${cnt}명`;
        }
        if (name) return name;
        if (typeof cnt === "number") return `${cnt}명`;
        return undefined;
    }, [currentData.crewName, currentData.memberCount]);

    const openMonthPicker = useCallback(() => {
        // YearMonthSelector 가 마운트되어야 picker(AdminModal) 가 표시됨
        if (!mounted || currentData.selectedYear <= 0) return;
        haptic.light();
        setPickerOpen(true);
    }, [mounted, currentData.selectedYear]);

    return (
        <div className="relative flex flex-col min-h-screen bg-rh-bg-primary">
            <PageHeader
                title="랭킹"
                sub={headerSub}
                iconColor="white"
                backgroundColor="bg-rh-bg-primary"
                borderColor="rh-border"
                rightAction={
                    <button
                        type="button"
                        onClick={openMonthPicker}
                        aria-label="월 선택"
                        className="flex items-center justify-center w-9 h-9 rounded-full text-rh-text-secondary hover:text-rh-text-primary active:scale-95 transition"
                    >
                        <Calendar className="w-5 h-5" />
                    </button>
                }
            />

            {/* 월 선택 (sticky collapse) — 월 필터 chip 역할
                pickerOpen 은 헤더 cal 아이콘과 공유되어 외부 트리거 가능. */}
            {mounted && currentData.selectedYear > 0 && (
                <YearMonthSelector
                    year={currentData.selectedYear}
                    month={currentData.selectedMonth}
                    onChange={handleMonthChange}
                    disabled={isDataLoading}
                    pickerOpen={pickerOpen}
                    onPickerOpenChange={setPickerOpen}
                />
            )}

            {/* 랭킹 탭 */}
            <div className="px-4">
                <RankingTabs
                    tabs={tabs}
                    activeTabId={activeTab}
                    onTabChange={handleTabChange}
                />
            </div>

            <div
                className={`flex-1 flex flex-col gap-4 px-4 pt-4 pb-4 transition-opacity ${
                    isDataLoading
                        ? "opacity-50 pointer-events-none"
                        : ""
                }`}
            >
                {visibleRankingData.length > 0 ? (
                    <FadeIn>
                        {/* TOP 3 podium */}
                        {top3.length > 0 && (
                            <div className="mb-4">
                                <TopPodium
                                    top3={top3}
                                    scoreLabel={scoreLabel}
                                />
                            </div>
                        )}

                        {/* 본인 요약 카드 (TOP3 밖일 때만) */}
                        {currentUserRank &&
                            currentUserRank.rank > 3 && (
                                <div className="mb-3 flex items-center gap-3 rounded-[10px] border border-rh-accent/40 bg-rh-accent/10 px-3 py-3">
                                    <div className="flex justify-center items-center w-9 h-9 rounded-full bg-rh-accent text-rh-text-inverted text-[12px] font-semibold rh-mono">
                                        {currentUserRank.rank}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-rh-body font-semibold text-rh-text-primary truncate">
                                                {currentUserRank.name ||
                                                    "알 수 없음"}
                                            </span>
                                            <span
                                                className="rh-chip"
                                                data-on="true"
                                                style={{
                                                    padding:
                                                        "1px 7px",
                                                    fontSize: 10,
                                                }}
                                            >
                                                YOU
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-rh-text-tertiary rh-mono">
                                            출석{" "}
                                            {currentUserAttendance?.value ??
                                                0}{" "}
                                            · 개설{" "}
                                            {currentUserHosting?.value ??
                                                0}{" "}
                                            · 총{" "}
                                            {visibleRankingData.length}
                                            명 중
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="rh-mono text-[18px] font-semibold text-rh-accent">
                                            {currentUserRank.value}
                                        </span>
                                        <span className="ml-1 text-[11px] text-rh-text-tertiary">
                                            {scoreLabel}
                                        </span>
                                    </div>
                                </div>
                            )}

                        {/* 4위~ 리스트 */}
                        {rest.length > 0 && (
                            <AnimatedList
                                className="flex flex-col gap-2"
                                maxStaggerSec={1.2}
                            >
                                {rest.map((item) => (
                                    <AnimatedItem
                                        key={item.user_id}
                                    >
                                        <RankingListItem
                                            rank={item.rank}
                                            name={
                                                item.name ||
                                                "알 수 없음"
                                            }
                                            score={item.value}
                                            isCurrentUser={
                                                item.is_current_user
                                            }
                                            scoreLabel={scoreLabel}
                                        />
                                    </AnimatedItem>
                                ))}
                            </AnimatedList>
                        )}
                    </FadeIn>
                ) : (
                    <FadeIn>
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rh-bg-surface">
                                    <span className="rh-display text-[20px] text-rh-text-muted">
                                        ?
                                    </span>
                                </div>
                                <p className="text-rh-body font-medium text-rh-text-secondary">
                                    해당 월의 데이터가 없습니다
                                </p>
                                <p className="rh-eye mt-2">
                                    다른 월을 확인해보세요
                                </p>
                            </div>
                        </div>
                    </FadeIn>
                )}
            </div>

            {/* Scroll to Top FAB — sticky 패턴 (fixed 금지) */}
            <div className="sticky bottom-4 z-20 flex justify-end px-4 pointer-events-none h-0">
                <AnimatePresence>
                    {showScrollTop && (
                        <motion.button
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.2 }}
                            onClick={scrollToTop}
                            className="pointer-events-auto -translate-y-full w-10 h-10 rounded-full bg-rh-bg-surface/90 backdrop-blur-sm border border-rh-border shadow-lg flex items-center justify-center active:scale-90 transition-transform"
                            aria-label="맨 위로"
                        >
                            <ChevronUp className="w-5 h-5 text-rh-text-secondary" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {notificationType && (
                <React.Suspense fallback={null}>
                    <PopupNotification
                        isVisible={showNotification}
                        message={notificationMessage}
                        type={notificationType}
                        duration={1500}
                        onClose={() => {
                            setShowNotification(false);
                        }}
                    />
                </React.Suspense>
            )}
        </div>
    );
};

export default memo(UltraFastRankingTemplate);
