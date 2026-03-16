'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    Megaphone,
    CircleCheck,
    Trophy,
    Calculator,
    X,
    BellOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuickActionButton from '../atoms/QuickActionButton';
import ActivityListItem from '../molecules/ActivityListItem';
import SectionLabel from '../atoms/SectionLabel';
import PushPermissionBanner from '../molecules/PushPermissionBanner';
import NoticeListSheet from '../molecules/NoticeListSheet';
import BottomNavigation from '../organisms/BottomNavigation';
import { usePushNotification } from '@/hooks/usePushNotification';
import { useOfflineAttendance } from '@/hooks/useOfflineAttendance';
import { CloudUpload } from 'lucide-react';

interface Notice {
    id: string;
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

interface EnhancedHomeTemplateProps {
    username: string | null;
    crewId: string | null;
    rankName: string | null;
    crewName: string | null;
    noticeText: string | null;
    recentActivities?: RecentActivity[];
}

const EnhancedHomeTemplate: React.FC<EnhancedHomeTemplateProps> = ({
    username,
    crewId,
    crewName,
    noticeText,
    recentActivities = [],
}) => {
    const router = useRouter();
    const { shouldShowBanner, requestPermission, dismissBanner } =
        usePushNotification({ crewId });
    const { queueCount, isOnline, isFlushing } = useOfflineAttendance();

    const [isNoticeSheetOpen, setIsNoticeSheetOpen] = useState(false);
    const [isNoticeListOpen, setIsNoticeListOpen] = useState(false);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [noticesLoading, setNoticesLoading] = useState(false);

    const handleNavigate = useCallback(
        (path: string) => {
            router.push(path);
        },
        [router]
    );

    useEffect(() => {
        if (!isNoticeSheetOpen || !crewId) return;
        setNoticesLoading(true);
        fetch(`/api/admin/notices?crewId=${crewId}`)
            .then((res) => res.json())
            .then((json) => {
                if (json.success) setNotices(json.data ?? []);
            })
            .catch(() => {})
            .finally(() => setNoticesLoading(false));
    }, [isNoticeSheetOpen, crewId]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const hours = d.getHours().toString().padStart(2, '0');
        const mins = d.getMinutes().toString().padStart(2, '0');
        return `${month}/${day} ${hours}:${mins}`;
    };

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            {/* ── Header: 인사말 + 알림 버튼 ── */}
            <header className="flex items-center justify-between px-4 h-14 pt-safe">
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-rh-accent">
                        {crewName ?? 'RunHouse Crew'}
                    </span>
                    <span className="text-lg font-semibold text-white">
                        안녕하세요, {username ?? '사용자'}님
                    </span>
                </div>
                <button
                    onClick={() => setIsNoticeSheetOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-rh-md bg-rh-bg-surface"
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
            <div className="flex-1 overflow-y-auto px-4 pt-4 scroll-area-bottom space-y-5">
                {/* 공지 카드 */}
                {noticeText && (
                    <button
                        onClick={() => setIsNoticeListOpen(true)}
                        className="flex w-full items-center gap-2.5 rounded-rh-lg bg-rh-bg-surface px-4 h-12 text-left"
                    >
                        <Megaphone className="h-4 w-4 shrink-0 text-rh-accent" />
                        <p className="text-[13px] text-white truncate">
                            {noticeText}
                        </p>
                    </button>
                )}

                {/* 빠른 액션 3개 */}
                <div className="flex gap-3">
                    <QuickActionButton
                        icon={CircleCheck}
                        label="출석체크"
                        onClick={() => handleNavigate('/attendance')}
                    />
                    <QuickActionButton
                        icon={Trophy}
                        label="랭킹"
                        onClick={() => handleNavigate('/ranking')}
                    />
                    <QuickActionButton
                        icon={Calculator}
                        label="계산기"
                        onClick={() => handleNavigate('/calculator')}
                    />
                </div>

                {/* 최근 활동 */}
                <SectionLabel>최근 활동</SectionLabel>

                <div className="space-y-2">
                    {recentActivities.length > 0 ? (
                        recentActivities.map((a) => (
                            <ActivityListItem
                                key={a.id}
                                name={a.userName}
                                meta={`${a.location} · ${a.exerciseType} · ${a.time}`}
                            />
                        ))
                    ) : (
                        <div className="flex items-center justify-center rounded-rh-md bg-rh-bg-surface py-10">
                            <p className="text-sm text-rh-text-tertiary">
                                아직 최근 활동이 없습니다
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── BottomNav ── */}
            <BottomNavigation />

            <AnimatePresence>
                {isNoticeSheetOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-50 bg-rh-bg-primary/60"
                            onClick={() => setIsNoticeSheetOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{
                                type: 'spring',
                                damping: 28,
                                stiffness: 300,
                            }}
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.1}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 100)
                                    setIsNoticeSheetOpen(false);
                            }}
                            className="fixed bottom-0 left-0 right-0 z-50 max-h-[75vh] rounded-t-[20px] bg-rh-bg-surface pb-safe"
                        >
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="h-1 w-10 rounded-full bg-rh-bg-muted" />
                            </div>

                            <div className="flex items-center justify-between px-5 pb-3">
                                <h2 className="text-lg font-semibold text-white">
                                    알림 내역
                                </h2>
                                <button
                                    onClick={() =>
                                        setIsNoticeSheetOpen(false)
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-rh-bg-muted"
                                >
                                    <X className="h-4 w-4 text-rh-text-secondary" />
                                </button>
                            </div>

                            <div className="border-t border-rh-border" />

                            <div className="overflow-y-auto px-5 py-4 max-h-[calc(75vh-80px)] space-y-3">
                                {noticesLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-rh-accent border-t-transparent" />
                                    </div>
                                ) : notices.length > 0 ? (
                                    notices.map((notice) => (
                                        <div
                                            key={notice.id}
                                            className="rounded-rh-lg bg-rh-bg-primary p-4 space-y-1.5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-rh-accent">
                                                    {notice.author
                                                        ?.first_name ??
                                                        '관리자'}
                                                </span>
                                                <span className="text-xs text-rh-text-tertiary">
                                                    {formatDate(
                                                        notice.created_at
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-sm leading-relaxed text-white">
                                                {notice.content}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                                        <BellOff className="h-10 w-10 text-rh-text-muted" />
                                        <p className="text-sm text-rh-text-tertiary">
                                            알림 내역이 없습니다
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* 공지사항 리스트 바텀시트 */}
            {crewId && (
                <NoticeListSheet
                    isOpen={isNoticeListOpen}
                    onClose={() => setIsNoticeListOpen(false)}
                    crewId={crewId}
                />
            )}
        </div>
    );
};

export default EnhancedHomeTemplate;
