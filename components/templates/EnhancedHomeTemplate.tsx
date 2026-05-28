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

// contour SVG 배경 (Hero CTA 데코 — sc-home 사양: 8개 라인, multiply blend)
const ContourBg = memo(function ContourBg() {
    const lines = Array.from({ length: 8 }, (_, i) => 10 + i * 22);
    return (
        <div
            className="rh-contour"
            aria-hidden
            style={{ opacity: 0.2, mixBlendMode: "multiply" }}
        >
            <svg viewBox="0 0 240 160" preserveAspectRatio="none">
                {lines.map((y) => (
                    <path
                        key={y}
                        d={`M 0 ${y} Q 60 ${y - 15} 120 ${y} T 240 ${y}`}
                        style={{ stroke: "#000" }}
                    />
                ))}
            </svg>
        </div>
    );
});

// "5월 12일 17:20" → "17:20" 추출 (실패 시 원문 반환)
function extractTimeFromLabel(label: string): string {
    const m = label.match(/(\d{1,2}:\d{2})\s*$/);
    return m ? m[1] : label;
}

const EnhancedHomeTemplate = memo<EnhancedHomeTemplateProps>(
    ({
        // username/rankName/noticeText는 외부 시그니처 보존 차원에서 받지만
        // sc-home 사양상 본문에서 사용하지 않는다.
        username: _username,
        rankName: _rankName,
        noticeText: _noticeText,
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
                {/* ── Header (sc-home 사양: 라임 워드마크 + crew sub) ── */}
                <header className="sticky top-0 z-50 bg-rh-bg-primary pt-safe border-b border-rh-border">
                    <div className="flex items-center justify-between px-4 h-14">
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span
                                    aria-hidden
                                    className="h-3.5 w-3.5 rounded-[3px] bg-rh-accent"
                                />
                                <span className="text-[13px] font-semibold text-rh-text-primary leading-none">
                                    RunHouse
                                </span>
                            </div>
                            <span className="text-rh-caption text-rh-text-tertiary truncate">
                                {crewName ?? "러닝 크루"}
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
                    {/* Hero CTA — lime + contour (sc-home 사양) */}
                    <button
                        type="button"
                        onClick={() =>
                            handleNavigate("/attendance")
                        }
                        className="relative overflow-hidden rounded-rh-lg bg-rh-accent text-left active:opacity-90 transition-opacity"
                    >
                        <ContourBg />
                        <div className="relative z-[2] flex flex-col gap-1.5 px-3.5 py-3.5">
                            {activeMeet ? (
                                <>
                                    {/* 상단 row: 시간 · 장소 */}
                                    <div className="flex items-center justify-between">
                                        <span className="rh-eye text-rh-text-inverted">
                                            오늘{" "}
                                            {extractTimeFromLabel(
                                                activeMeet.meetingStartedLabel
                                            )}
                                        </span>
                                        <span className="text-[12px] text-rh-text-inverted">
                                            {activeMeet.location}
                                        </span>
                                    </div>
                                    {/* 큰 타이틀: 장소 + 모임명 (2줄) */}
                                    <div className="text-[22px] font-bold leading-[1.05] tracking-[-0.02em] text-rh-text-inverted">
                                        {activeMeet.location}
                                        <br />
                                        오늘의 모임
                                    </div>
                                    {/* 하단 row: 부가 정보 · pill 버튼 */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] text-rh-text-inverted">
                                            {activeMeet.attendeeCount}명
                                            출석 중
                                        </span>
                                        <span className="rounded-full bg-rh-bg-primary px-2.5 py-1 text-[12px] font-semibold text-rh-accent">
                                            출석하기 →
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* 상단 row: 안내 라벨 */}
                                    <div className="flex items-center justify-between">
                                        <span className="rh-eye text-rh-text-inverted">
                                            TODAY
                                        </span>
                                        <span className="text-[12px] text-rh-text-inverted">
                                            오늘의 러닝
                                        </span>
                                    </div>
                                    {/* 큰 타이틀: fallback 카피 */}
                                    <div className="text-[22px] font-bold leading-[1.05] tracking-[-0.02em] text-rh-text-inverted">
                                        오늘 출석하기
                                    </div>
                                    {/* 하단 row: 안내 · pill 버튼 */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] text-rh-text-inverted">
                                            1분이면 충분해요
                                        </span>
                                        <span className="rounded-full bg-rh-bg-primary px-2.5 py-1 text-[12px] font-semibold text-rh-accent">
                                            출석하기 →
                                        </span>
                                    </div>
                                </>
                            )}
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
