"use client";

import React, {
    memo,
    useCallback,
    useMemo,
    useState,
    useEffect,
} from "react";
import { useRouter } from "next/navigation";
import nextDynamic from "next/dynamic";
import {
    Bell,
    Megaphone,
    ChevronRight,
    CloudUpload,
} from "lucide-react";
import PushPermissionBanner from "../molecules/PushPermissionBanner";
import Toast from "../molecules/Toast";
import ActiveMeetBanner from "../molecules/ActiveMeetBanner";
import { usePushNotification } from "@/hooks/usePushNotification";
import { useOfflineAttendance } from "@/hooks/useOfflineAttendance";
import type { ActiveMeetBannerVM } from "@/lib/domain/attendance/policies";

// 바텀시트는 열릴 때만 로드 (framer-motion 번들 분리)
const NoticeBottomSheet = nextDynamic(
    () => import("../molecules/NoticeBottomSheet"),
    { ssr: false }
);

interface ActiveNotice {
    id: string;
    title: string;
}

interface MyRanking {
    attendanceRank: number | null;
    hostingRank: number | null;
}

interface AttendanceDay {
    date: string;
    count: number;
}

interface EnhancedHomeTemplateProps {
    username: string | null;
    crewId: string | null;
    rankName: string | null;
    crewName: string | null;
    noticeText: string | null;
    myAttendanceDays?: AttendanceDay[];
    activeNotice?: ActiveNotice | null;
    myRanking?: MyRanking | null;
    activeMeet?: ActiveMeetBannerVM | null;
}

// localStorage 키 상수
const NOTICE_READ_KEY = "rh_read_notice_id";

// 28일 히트맵 셀 정의
interface HeatCell {
    dateKey: string;
    level: 0 | 1 | 2 | 3 | 4;
}

function countToLevel(count: number): 0 | 1 | 2 | 3 | 4 {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    return 4;
}

function toDateKey(date: Date): string {
    return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
    );
}

// contour SVG 배경 (Hero CTA 데코)
const ContourBg = memo(function ContourBg() {
    return (
        <div
            className="rh-contour text-rh-text-inverted"
            aria-hidden
        >
            <svg
                viewBox="0 0 320 160"
                preserveAspectRatio="none"
            >
                <path d="M-10,30 Q60,10 130,40 T280,30 T420,50" />
                <path d="M-10,60 Q60,40 130,70 T280,60 T420,80" />
                <path d="M-10,90 Q60,70 130,100 T280,90 T420,110" />
                <path d="M-10,120 Q60,100 130,130 T280,120 T420,140" />
                <path d="M-10,150 Q60,130 130,160 T280,150 T420,170" />
            </svg>
        </div>
    );
});

const EnhancedHomeTemplate = memo<EnhancedHomeTemplateProps>(
    ({
        username,
        crewId,
        crewName,
        myAttendanceDays = [],
        activeNotice = null,
        myRanking = null,
        activeMeet = null,
    }) => {
        const router = useRouter();
        const {
            shouldShowBanner,
            requestPermission,
            dismissBanner,
            toast,
            dismissToast,
        } = usePushNotification({ crewId });
        const { queueCount, isOnline, isFlushing } =
            useOfflineAttendance();

        const [isNoticeSheetOpen, setIsNoticeSheetOpen] =
            useState(false);

        // 공지 읽음 여부 (mounted 후 localStorage 확인)
        const [mounted, setMounted] = useState(false);
        const [isNoticeRead, setIsNoticeRead] =
            useState(false);

        useEffect(() => {
            setMounted(true);
            if (activeNotice?.id) {
                const readId = localStorage.getItem(
                    NOTICE_READ_KEY
                );
                setIsNoticeRead(
                    readId === activeNotice.id
                );
            }
        }, [activeNotice?.id]);

        // 공지 카드 표시: 활성 공지가 있고, 아직 읽지 않은 경우
        const showNotice = useMemo(() => {
            if (!mounted) return !!activeNotice;
            return !!activeNotice && !isNoticeRead;
        }, [mounted, activeNotice, isNoticeRead]);

        // 28일 heatmap 셀 (오늘 포함 과거 28일, 옛날 → 오늘 순)
        const heatCells = useMemo<HeatCell[]>(() => {
            if (!mounted) return [];
            const countMap = new Map<string, number>();
            for (const d of myAttendanceDays) {
                countMap.set(
                    d.date,
                    (countMap.get(d.date) ?? 0) + d.count
                );
            }
            const cells: HeatCell[] = [];
            const today = new Date();
            for (let i = 27; i >= 0; i--) {
                const day = new Date(today);
                day.setDate(today.getDate() - i);
                const key = toDateKey(day);
                cells.push({
                    dateKey: key,
                    level: countToLevel(
                        countMap.get(key) ?? 0
                    ),
                });
            }
            return cells;
        }, [mounted, myAttendanceDays]);

        // 이번달 출석횟수 (히트맵 데이터 기반)
        const monthlyCount = useMemo(() => {
            if (!mounted) return 0;
            const today = new Date();
            const ym =
                today.getFullYear() +
                "-" +
                String(today.getMonth() + 1).padStart(
                    2,
                    "0"
                );
            return myAttendanceDays
                .filter((d) => d.date.startsWith(ym))
                .reduce((sum, d) => sum + d.count, 0);
        }, [mounted, myAttendanceDays]);

        // 공지 탭 → 읽음 처리 후 notifications로 이동
        const handleNoticeTap = useCallback(() => {
            if (activeNotice?.id) {
                localStorage.setItem(
                    NOTICE_READ_KEY,
                    activeNotice.id
                );
                setIsNoticeRead(true);
            }
            router.push("/notifications");
        }, [activeNotice?.id, router]);

        const handleNavigate = useCallback(
            (path: string) => {
                router.push(path);
            },
            [router]
        );

        const handleCloseSheet = useCallback(() => {
            setIsNoticeSheetOpen(false);
        }, []);

        return (
            <div className="flex flex-col min-h-screen bg-rh-bg-primary">
                {/* ── Header ── */}
                <header className="sticky top-0 z-50 bg-rh-bg-primary pt-safe border-b border-rh-border">
                    <div className="flex items-center justify-between px-4 h-14">
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-rh-body font-semibold text-rh-text-primary truncate">
                                {crewName ?? "RunHouse Crew"}
                            </span>
                            <span className="text-rh-caption text-rh-text-tertiary truncate">
                                안녕하세요, {username ?? "사용자"}님
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                router.push("/notifications")
                            }
                            aria-label="공지사항"
                            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-rh-md active:opacity-80"
                        >
                            <Bell className="h-5 w-5 text-rh-text-secondary" />
                        </button>
                    </div>
                </header>

                {/* ── 알림 권한 유도 ── */}
                <PushPermissionBanner
                    show={shouldShowBanner}
                    onAllow={requestPermission}
                    onDismiss={dismissBanner}
                />

                {/* ── 활성 모임 배너 ── */}
                <ActiveMeetBanner meet={activeMeet} />

                {/* ── 오프라인 출석 대기 ── */}
                {queueCount > 0 && (
                    <div className="px-4 pt-2">
                        <div className="flex items-center gap-3 rounded-rh-lg bg-rh-bg-surface p-3 border border-rh-border">
                            <CloudUpload className="h-5 w-5 text-rh-accent" />
                            <div>
                                <p className="text-rh-body text-rh-text-primary">
                                    오프라인 출석{" "}
                                    {queueCount}건 대기 중
                                </p>
                                <p className="text-rh-caption text-rh-text-tertiary">
                                    {isOnline
                                        ? isFlushing
                                            ? "전송 중..."
                                            : "곧 자동 전송됩니다"
                                        : "네트워크 연결 시 자동 전송"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 메인 콘텐츠 ── */}
                <div className="overflow-y-auto flex-1 px-4 pt-4 pb-6 flex flex-col gap-4">
                    {/* Hero CTA — lime + contour */}
                    <button
                        type="button"
                        onClick={() =>
                            handleNavigate("/attendance")
                        }
                        className="relative overflow-hidden rounded-rh-lg bg-rh-accent text-left active:opacity-90 transition-opacity"
                    >
                        <ContourBg />
                        <div className="relative px-5 py-6 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="rh-eye text-rh-text-inverted/70">
                                    TODAY
                                </div>
                                <div className="rh-display text-[28px] text-rh-text-inverted mt-1">
                                    오늘 출석하기
                                </div>
                                <div className="text-rh-caption text-rh-text-inverted/80 mt-1.5">
                                    러닝 시작 전 1분이면 충분해요
                                </div>
                            </div>
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rh-text-inverted/15 text-rh-text-inverted">
                                <ChevronRight className="h-6 w-6" />
                            </div>
                        </div>
                    </button>

                    {/* 공지 box */}
                    {showNotice && activeNotice && (
                        <button
                            type="button"
                            onClick={handleNoticeTap}
                            className="rh-box rh-box-tight text-left active:opacity-80"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="rh-chip"
                                    data-on="true"
                                >
                                    <Megaphone className="h-3 w-3" />
                                    공지
                                </span>
                                <span className="rh-eye">
                                    NOTICE
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="flex-1 text-rh-body font-medium text-rh-text-primary truncate">
                                    {activeNotice.title}
                                </p>
                                <ChevronRight className="h-4 w-4 shrink-0 text-rh-text-muted" />
                            </div>
                        </button>
                    )}

                    {/* 2열 통계 — 출석 / 개설 순위 */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                handleNavigate("/ranking")
                            }
                            className="rh-box rh-box-tight text-left active:opacity-80"
                        >
                            <div className="rh-eye">
                                MONTHLY RANK
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="rh-display rh-mono text-[28px] text-rh-text-primary">
                                    {myRanking?.attendanceRank ??
                                        "—"}
                                </span>
                                {myRanking?.attendanceRank !=
                                    null && (
                                    <span className="text-rh-caption text-rh-text-tertiary">
                                        위
                                    </span>
                                )}
                            </div>
                            <div className="text-rh-caption text-rh-text-tertiary">
                                이번달 출석 순위
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                handleNavigate("/ranking")
                            }
                            className="rh-box rh-box-tight rh-box-alt text-left active:opacity-80"
                        >
                            <div className="rh-eye">
                                THIS MONTH
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="rh-display rh-mono text-[28px] text-rh-text-primary">
                                    {mounted ? monthlyCount : 0}
                                </span>
                                <span className="text-rh-caption text-rh-text-tertiary">
                                    회
                                </span>
                            </div>
                            <div className="text-rh-caption text-rh-text-tertiary">
                                이번달 출석 횟수
                            </div>
                        </button>
                    </div>

                    {/* 28일 heatmap (14열 x 2행) */}
                    <div className="rh-box rh-box-tight">
                        <div className="flex items-center justify-between">
                            <div className="rh-eye">
                                LAST 28 DAYS
                            </div>
                            <div className="rh-live">참여</div>
                        </div>
                        <div
                            className="rh-heat"
                            style={{
                                gridTemplateColumns:
                                    "repeat(14, 1fr)",
                            }}
                            role="img"
                            aria-label="최근 28일 출석 히트맵"
                        >
                            {mounted
                                ? heatCells.map((cell) => (
                                      <div
                                          key={cell.dateKey}
                                          className={
                                              "rh-heat-cell" +
                                              (cell.level > 0
                                                  ? " l" +
                                                    cell.level
                                                  : "")
                                          }
                                      />
                                  ))
                                : Array.from({
                                      length: 28,
                                  }).map((_, i) => (
                                      <div
                                          key={i}
                                          className="rh-heat-cell"
                                      />
                                  ))}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-rh-text-muted">
                                less
                            </span>
                            <div className="flex items-center gap-1">
                                <span className="rh-heat-cell h-2.5 w-2.5" />
                                <span className="rh-heat-cell l1 h-2.5 w-2.5" />
                                <span className="rh-heat-cell l2 h-2.5 w-2.5" />
                                <span className="rh-heat-cell l3 h-2.5 w-2.5" />
                                <span className="rh-heat-cell l4 h-2.5 w-2.5" />
                            </div>
                            <span className="text-[10px] text-rh-text-muted">
                                more
                            </span>
                        </div>
                    </div>
                </div>

                {/* 바텀시트 — dynamic import */}
                {isNoticeSheetOpen && (
                    <NoticeBottomSheet
                        isOpen={isNoticeSheetOpen}
                        onClose={handleCloseSheet}
                        crewId={crewId}
                    />
                )}

                <Toast
                    open={!!toast}
                    message={toast?.message ?? null}
                    tone={toast?.tone}
                    onClose={dismissToast}
                />
            </div>
        );
    }
);

EnhancedHomeTemplate.displayName = "EnhancedHomeTemplate";

export default EnhancedHomeTemplate;
