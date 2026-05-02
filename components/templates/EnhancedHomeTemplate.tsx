'use client';

import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import nextDynamic from 'next/dynamic';
import {
    Bell,
    Megaphone,
    CircleCheck,
    Trophy,
    Calculator,
    MapPin,
    ChevronRight,
    CloudUpload,
} from 'lucide-react';
import QuickActionButton from '../atoms/QuickActionButton';
import SectionLabel from '../atoms/SectionLabel';
import MarqueeTicker from '../atoms/MarqueeTicker';
import PushPermissionBanner from '../molecules/PushPermissionBanner';
import WeeklyAttendanceHeatmap from '../molecules/WeeklyAttendanceHeatmap';
import ActiveMeetBanner from '../molecules/ActiveMeetBanner';
import { usePushNotification } from '@/hooks/usePushNotification';
import { useOfflineAttendance } from '@/hooks/useOfflineAttendance';
import type { ActiveMeetBannerVM } from '@/lib/domain/attendance/policies';

// 바텀시트는 열릴 때만 로드 (framer-motion 번들 분리)
const NoticeBottomSheet = nextDynamic(
    () => import('../molecules/NoticeBottomSheet'),
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
const NOTICE_READ_KEY = 'rh_read_notice_id';

const EnhancedHomeTemplate = memo<EnhancedHomeTemplateProps>(({
    username,
    crewId,
    crewName,
    noticeText,
    myAttendanceDays = [],
    activeNotice = null,
    myRanking = null,
    activeMeet = null,
}) => {
    const router = useRouter();
    const { shouldShowBanner, requestPermission, dismissBanner } =
        usePushNotification({ crewId });
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

    // 공지 카드 표시 여부:
    // 활성 공지가 있고, 아직 읽지 않은 경우
    const showNotice = useMemo(() => {
        if (!mounted) return !!activeNotice;
        return !!activeNotice && !isNoticeRead;
    }, [mounted, activeNotice, isNoticeRead]);

    // 나의 순위 카드 표시 여부:
    // 공지가 숨겨졌거나 공지가 없을 때
    const showMyRanking = useMemo(() => {
        if (!mounted) return false;
        return !showNotice && myRanking !== null && (
            myRanking.attendanceRank !== null ||
            myRanking.hostingRank !== null
        );
    }, [mounted, showNotice, myRanking]);

    // 공지 탭 → 읽음 처리 후 notifications로 이동
    const handleNoticeTap = useCallback(() => {
        if (activeNotice?.id) {
            localStorage.setItem(
                NOTICE_READ_KEY,
                activeNotice.id
            );
            setIsNoticeRead(true);
        }
        router.push('/notifications');
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
            {/* ── Header: 인사말 + 알림 버튼 ── */}
            <header className="sticky top-0 z-50 bg-rh-bg-primary pt-safe">
                <div className="flex items-center justify-between px-4 h-14">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-lg font-bold text-white truncate">
                            {crewName ?? 'RunHouse Crew'}
                        </span>
                        <span className="text-xs text-rh-text-secondary">
                            안녕하세요, {username ?? '사용자'}님
                        </span>
                    </div>
                    <button
                        onClick={() => router.push('/notifications')}
                        className="relative flex h-10 w-10 items-center justify-center rounded-rh-md"
                    >
                        <Bell className="h-5 w-5 text-rh-text-secondary" />
                    </button>
                </div>
            </header>

            {/* ── 크루명 마르퀴 티커 ── */}
            {crewName && (
                <div className="py-2.5 overflow-hidden" style={{ backgroundColor: 'var(--rh-accent)' }}>
                    <MarqueeTicker text={crewName} />
                </div>
            )}

            {/* ── 알림 유도 배너 ── */}
            <PushPermissionBanner
                show={shouldShowBanner}
                onAllow={requestPermission}
                onDismiss={dismissBanner}
            />

            {/* ── 지금 출석 중인 모임 배너 ── */}
            <ActiveMeetBanner meet={activeMeet} />

            {/* ── 오프라인 출석 대기 배너 ── */}
            {queueCount > 0 && (
                <div className="px-4 pt-2">
                    <div className="flex items-center gap-3 rounded-rh-lg bg-rh-bg-surface p-3 border border-rh-border">
                        <CloudUpload className="h-5 w-5 text-rh-accent" />
                        <div>
                            <p className="text-sm text-white">
                                오프라인 출석 {queueCount}건 대기 중
                            </p>
                            <p className="text-xs text-rh-text-tertiary">
                                {isOnline
                                    ? isFlushing
                                        ? '전송 중...'
                                        : '곧 자동 전송됩니다'
                                    : '네트워크 연결 시 자동 전송'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ScrollContent ── */}
            <div className="flex-1 px-4 pt-4 pb-6 space-y-5">
                {/* 공지 카드 (서버에서 미리 로드) */}
                {showNotice && activeNotice && (
                    <button
                        onClick={handleNoticeTap}
                        className="flex w-full items-center gap-2.5 rounded-rh-lg bg-rh-bg-surface px-4 h-12 text-left"
                    >
                        <Megaphone className="h-4 w-4 shrink-0 text-rh-accent" />
                        <p className="flex-1 text-[13px] text-white truncate">
                            {activeNotice.title}
                        </p>
                        <ChevronRight className="h-4 w-4 shrink-0 text-rh-text-muted" />
                    </button>
                )}

                {/* 나의 이번달 순위 카드 */}
                {showMyRanking && myRanking && (
                    <button
                        onClick={() =>
                            handleNavigate('/ranking')
                        }
                        className="flex w-full items-center gap-2.5 rounded-rh-lg bg-rh-bg-surface px-4 h-12 text-left"
                    >
                        <Trophy className="h-4 w-4 shrink-0 text-rh-accent" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white">
                                나의 이번달 순위
                            </p>
                            <p className="text-xs text-rh-text-secondary">
                                {myRanking.attendanceRank
                                    ? `출석 ${myRanking.attendanceRank}위`
                                    : '출석 기록 없음'}
                                {' · '}
                                {myRanking.hostingRank
                                    ? `개설 ${myRanking.hostingRank}위`
                                    : '개설 기록 없음'}
                            </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-rh-text-muted" />
                    </button>
                )}

                {/* 빠른 액션 3개 */}
                <div className="flex gap-3">
                    <QuickActionButton
                        icon={CircleCheck}
                        label="출석체크"
                        onClick={() =>
                            handleNavigate('/attendance')
                        }
                    />
                    <QuickActionButton
                        icon={Trophy}
                        label="랭킹"
                        onClick={() =>
                            handleNavigate('/ranking')
                        }
                    />
                    <QuickActionButton
                        icon={Calculator}
                        label="계산기"
                        onClick={() =>
                            handleNavigate('/calculator')
                        }
                    />
                </div>

                {/* 러닝 장소 카드 */}
                <button
                    onClick={() => handleNavigate('/map')}
                    className="flex w-full items-center gap-3 rounded-rh-lg bg-rh-bg-surface px-4 py-3.5 text-left active:opacity-80 transition-opacity"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rh-accent/15">
                        <MapPin className="h-5 w-5 text-rh-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-white">
                            러닝 장소
                        </p>
                        <p className="text-xs text-rh-text-tertiary mt-0.5">
                            크루 러닝 장소를 확인하세요
                        </p>
                    </div>
                    <ChevronRight className="h-4.5 w-4.5 shrink-0 text-rh-text-muted" />
                </button>

                {/* 최근 참여일 — 주간 히트맵 */}
                <SectionLabel>최근 참여일</SectionLabel>
                <WeeklyAttendanceHeatmap
                    attendanceDays={myAttendanceDays}
                />

            </div>

            {/* 바텀시트 — dynamic import (framer-motion 분리) */}
            {isNoticeSheetOpen && (
                <NoticeBottomSheet
                    isOpen={isNoticeSheetOpen}
                    onClose={handleCloseSheet}
                    crewId={crewId}
                />
            )}
        </div>
    );
});

EnhancedHomeTemplate.displayName = 'EnhancedHomeTemplate';

export default EnhancedHomeTemplate;
