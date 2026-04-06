'use client';

import React, { memo, useCallback, useState, useEffect } from 'react';
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
import ActivityListItem from '../molecules/ActivityListItem';
import SectionLabel from '../atoms/SectionLabel';
import { AnimatedList, AnimatedItem } from '../atoms/AnimatedList';
import PushPermissionBanner from '../molecules/PushPermissionBanner';
import WeeklyAttendanceHeatmap from '../molecules/WeeklyAttendanceHeatmap';
import { usePushNotification } from '@/hooks/usePushNotification';
import { useOfflineAttendance } from '@/hooks/useOfflineAttendance';

// 바텀시트는 열릴 때만 로드 (framer-motion 번들 분리)
const NoticeBottomSheet = nextDynamic(
    () => import('../molecules/NoticeBottomSheet'),
    { ssr: false }
);

interface Notice {
    id: string;
    title?: string | null;
    content: string;
    created_at: string;
    is_active: boolean;
    author?: { first_name: string } | null;
}

interface RecentActivity {
    id: string;
    userName: string;
    location: string;
    exerciseType: string;
    time: string;
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
    recentActivities?: RecentActivity[];
    myAttendanceDays?: AttendanceDay[];
}

const EnhancedHomeTemplate = memo<EnhancedHomeTemplateProps>(({
    username,
    crewId,
    crewName,
    noticeText,
    recentActivities = [],
    myAttendanceDays = [],
}) => {
    const router = useRouter();
    const { shouldShowBanner, requestPermission, dismissBanner } =
        usePushNotification({ crewId });
    const { queueCount, isOnline, isFlushing } =
        useOfflineAttendance();

    const [isNoticeSheetOpen, setIsNoticeSheetOpen] =
        useState(false);
    const [noticeTitle, setNoticeTitle] =
        useState<string | null>(null);

    // 활성 공지 제목 조회 (홈 상단 공지 카드에 표시)
    useEffect(() => {
        if (!crewId) return;
        let cancelled = false;
        fetch(`/api/admin/notices?crewId=${crewId}`)
            .then((res) => res.json())
            .then((json) => {
                if (cancelled || !json.success) return;
                const list = (json.data ?? []) as Notice[];
                const active =
                    list.find((n) => n.is_active) ?? list[0];
                if (active?.title) setNoticeTitle(active.title);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [crewId]);

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
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 pt-safe bg-rh-bg-primary">
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-rh-accent">
                        {crewName ?? 'RunHouse Crew'}
                    </span>
                    <span className="text-lg font-semibold text-white">
                        안녕하세요, {username ?? '사용자'}님
                    </span>
                </div>
                <button
                    onClick={() => router.push('/notifications')}
                    className="relative flex h-10 w-10 items-center justify-center rounded-rh-md bg-rh-bg-surface"
                >
                    <Bell className="h-5 w-5 text-rh-text-secondary" />
                </button>
            </header>

            {/* ── 알림 유도 배너 ── */}
            <PushPermissionBanner
                show={shouldShowBanner}
                onAllow={requestPermission}
                onDismiss={dismissBanner}
            />

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
                {/* 공지 카드 (제목만 노출) */}
                {noticeTitle && (
                    <button
                        onClick={() =>
                            router.push('/notifications')
                        }
                        className="flex w-full items-center gap-2.5 rounded-rh-lg bg-rh-bg-surface px-4 h-12 text-left"
                    >
                        <Megaphone className="h-4 w-4 shrink-0 text-rh-accent" />
                        <p className="text-[13px] text-white truncate">
                            {noticeTitle}
                        </p>
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

                {/* 나의 최근 활동 — 주간 히트맵 */}
                <SectionLabel>나의 최근 활동</SectionLabel>
                <WeeklyAttendanceHeatmap
                    attendanceDays={myAttendanceDays}
                />

                {/* 최근 크루 활동 */}
                <SectionLabel>최근 크루 활동</SectionLabel>

                {recentActivities.length > 0 ? (
                    <AnimatedList className="space-y-2">
                        {recentActivities.map((a) => (
                            <AnimatedItem key={a.id}>
                                <ActivityListItem
                                    name={a.userName}
                                    meta={`${a.location} · ${a.exerciseType} · ${a.time}`}
                                />
                            </AnimatedItem>
                        ))}
                    </AnimatedList>
                ) : (
                    <div className="flex items-center justify-center rounded-rh-md bg-rh-bg-surface py-10">
                        <p className="text-sm text-rh-text-tertiary">
                            아직 최근 활동이 없습니다
                        </p>
                    </div>
                )}
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
