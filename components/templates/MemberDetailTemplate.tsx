'use client';

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, ChevronRight } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { Switch } from '@/components/ui/switch';
import { getFCMToken } from '@/lib/firebase/client';
import PageHeader from '@/components/organisms/common/PageHeader';
import SectionLabel from '@/components/atoms/SectionLabel';
import MenuListItem from '@/components/molecules/MenuListItem';

import { usePushNotification } from '@/hooks/usePushNotification';

interface Activity {
    type: 'attendance' | 'create_meeting';
    date: string;
    location: string;
    exerciseType: string;
}

interface UserProfileForMyPage {
    firstName: string | null;
    crewId: string | null;
    birthYear: number | null;
    joinDate: string | null;
    rankName: string | null;
    email: string | null;
    phone: string | null;
    profileImageUrl?: string | null;
    isAdmin: boolean;
}

interface ActivityData {
    attendanceCount: number;
    meetingsCreatedCount: number;
    activities: Activity[];
}

interface MemberDetailTemplateProps {
    userProfile: UserProfileForMyPage | null;
    activityData: ActivityData;
    userId?: string;
}

const ErrorState = memo(() => (
    <div className="h-screen bg-rh-bg-primary flex flex-col">
        <div className="flex-shrink-0">
            <PageHeader title="내 정보" iconColor="white" borderColor="rh-border" backgroundColor="bg-rh-bg-surface" />
        </div>
        <div className="flex-1 flex items-center justify-center">
            <p className="text-rh-text-muted">사용자 정보를 불러올 수 없습니다.</p>
        </div>
    </div>
));
ErrorState.displayName = 'ErrorState';

const AdminButton = memo(() => (
    <Link
        href="/admin2"
        className="flex items-center justify-center w-10 h-10 rounded-rh-md bg-rh-bg-primary hover:bg-rh-bg-muted transition-colors"
        title="크루관리"
    >
        <Settings size={20} className="text-rh-text-secondary" />
    </Link>
));
AdminButton.displayName = 'AdminButton';

const MemberDetailTemplate = memo<MemberDetailTemplateProps>(({ userProfile, activityData, userId }) => {
    const router = useRouter();
    const {
        isSupported,
        permission,
        isNotificationEnabled,
        toggleNotification,
    } = usePushNotification({ crewId: userProfile?.crewId ?? null });

    // hydration 안전: 클라이언트 마운트 후에만 isSupported 사용
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const showNotificationToggle = mounted && isSupported;

    const handleLogout = useCallback(async () => {
        try {
            if (typeof window !== "undefined" && window.navigator.vibrate) {
                window.navigator.vibrate([50, 100, 50]);
            }
            const fcmToken = await getFCMToken();
            if (fcmToken) {
                await fetch("/api/push/token", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: fcmToken }),
                }).catch(() => {});
            }
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            const { error } = await supabase.auth.signOut();
            if (error) {
                alert("로그아웃 중 오류가 발생했습니다.");
                return;
            }
            router.push("/auth/login");
        } catch {
            alert("로그아웃 처리 중 문제가 발생했습니다.");
        }
    }, [router]);

    const displayName = useMemo(() => {
        if (!userProfile?.firstName) return '사용자';
        return userProfile.birthYear
            ? `${userProfile.firstName} (${String(userProfile.birthYear)})`
            : userProfile.firstName;
    }, [userProfile?.firstName, userProfile?.birthYear]);

    const adminButton = useMemo(() => {
        return userProfile?.isAdmin ? <AdminButton /> : null;
    }, [userProfile?.isAdmin]);

    const thisMonthCount = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        return activityData.activities.filter(a => {
            const d = new Date(a.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;
    }, [activityData.activities]);

    const formatActivityDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekday = weekdays[d.getDay()];
        return `${month}월 ${day}일 (${weekday})`;
    };

    const formatActivityTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    if (!userProfile) {
        return <ErrorState />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            {/* Header */}
            <div className="sticky top-0 z-50 shrink-0 bg-rh-bg-primary pt-safe">
                <PageHeader
                    title="MY"
                    iconColor="white"
                    borderColor="rh-border"
                    backgroundColor="bg-rh-bg-primary"
                    rightAction={adminButton}
                />
            </div>

            {/* Content */}
            <div className="flex-1 px-4 pt-4 pb-4 space-y-5">
                {/* Profile */}
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rh-accent">
                        <span className="text-2xl font-bold text-white">
                            {userProfile.firstName?.charAt(0) ?? '?'}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xl font-semibold text-white">{displayName}</span>
                        <span className="text-[13px] text-rh-text-secondary">
                            RunHouse Crew · {userProfile.rankName ?? '멤버'}
                        </span>
                    </div>
                </div>

                {/* Stats - 3 cards */}
                <div className="flex gap-3">
                    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-rh-md bg-rh-bg-surface h-[84px]">
                        <span className="text-2xl font-bold text-rh-accent">{activityData.attendanceCount}</span>
                        <span className="text-xs font-medium text-rh-text-secondary">총 출석</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-rh-md bg-rh-bg-surface h-[84px]">
                        <span className="text-2xl font-bold text-rh-accent">{thisMonthCount}</span>
                        <span className="text-xs font-medium text-rh-text-secondary">이번 달</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-rh-md bg-rh-bg-surface h-[84px]">
                        <span className="text-2xl font-bold text-rh-accent">{activityData.meetingsCreatedCount}</span>
                        <span className="text-xs font-medium text-rh-text-secondary">개설 횟수</span>
                    </div>
                </div>

                {/* Section Label */}
                <SectionLabel>활동 기록</SectionLabel>

                {/* Activity History - ListItem style */}
                <div className="space-y-2">
                    {activityData.activities.length > 0 ? (
                        activityData.activities.map((activity, index) => (
                            <MenuListItem
                                key={index}
                                title={formatActivityDate(activity.date)}
                                subtitle={`${activity.location} · ${activity.exerciseType} · ${formatActivityTime(activity.date)}`}
                            />
                        ))
                    ) : (
                        <div className="flex items-center justify-center rounded-rh-md bg-rh-bg-surface py-10">
                            <p className="text-sm text-rh-text-tertiary">활동 기록이 없습니다</p>
                        </div>
                    )}
                </div>

                {/* 설정 */}
                <SectionLabel>설정</SectionLabel>
                <div className="space-y-2">
                    {/* 푸시 알림 토글 */}
                    {showNotificationToggle && (
                        <div className="flex items-center justify-between rounded-rh-lg bg-rh-bg-surface h-[52px] px-4">
                            <span className="text-sm font-medium text-white">
                                푸시 알림
                            </span>
                            <Switch
                                checked={isNotificationEnabled}
                                onCheckedChange={toggleNotification}
                                disabled={permission === "denied"}
                            />
                        </div>
                    )}

                    {/* 내정보 변경 */}
                    <Link
                        href="/mypage/edit"
                        className="flex items-center justify-between rounded-rh-lg bg-rh-bg-surface px-4 py-3"
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-white">
                                내정보 변경
                            </span>
                            <span className="text-xs text-rh-text-tertiary">
                                이름, 연락처 등 개인정보 수정
                            </span>
                        </div>
                        <ChevronRight
                            size={18}
                            className="text-rh-text-muted"
                        />
                    </Link>
                </div>

                {/* 로그아웃 버튼 */}
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-xl transition-colors active:opacity-80"
                    style={{ backgroundColor: "#2B3644" }}
                >
                    <LogOut size={18} style={{ color: "#3E6496" }} />
                    <span
                        className="text-sm font-semibold"
                        style={{ color: "#3E6496" }}
                    >
                        로그아웃
                    </span>
                </button>
            </div>
        </div>
    );
});

MemberDetailTemplate.displayName = 'MemberDetailTemplate';

export default MemberDetailTemplate;
