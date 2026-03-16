'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Bell, BellOff } from 'lucide-react';
import PageHeader from '@/components/organisms/common/PageHeader';
import SectionLabel from '@/components/atoms/SectionLabel';
import MenuListItem from '@/components/molecules/MenuListItem';
import BottomNavigation from '@/components/organisms/BottomNavigation';
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
        href="/admin"
        className="flex items-center justify-center w-10 h-10 rounded-rh-md bg-rh-bg-surface hover:bg-rh-bg-muted transition-colors"
        title="크루관리"
    >
        <Settings size={20} className="text-rh-text-secondary" />
    </Link>
));
AdminButton.displayName = 'AdminButton';

const MemberDetailTemplate = memo<MemberDetailTemplateProps>(({ userProfile, activityData, userId }) => {
    const { isSupported, permission, requestPermission } =
        usePushNotification({ crewId: userProfile?.crewId ?? null });

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
            <div className="shrink-0 bg-rh-bg-surface pt-safe">
                <PageHeader
                    title="마이페이지"
                    iconColor="white"
                    borderColor="rh-border"
                    backgroundColor="bg-rh-bg-surface"
                    rightAction={adminButton}
                />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 pt-4 scroll-area-bottom space-y-5">
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

                {/* 알림 설정 */}
                {isSupported && (
                    <div className="rounded-rh-md bg-rh-bg-surface p-4">
                        <h3 className="text-rh-title3 font-semibold text-white mb-3">알림 설정</h3>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {permission === "granted" ? (
                                    <Bell className="h-5 w-5 text-rh-accent" />
                                ) : (
                                    <BellOff className="h-5 w-5 text-rh-text-tertiary" />
                                )}
                                <div>
                                    <p className="text-rh-body text-white">푸시 알림</p>
                                    <p className="text-rh-caption text-rh-text-secondary">
                                        {permission === "granted"
                                            ? "알림이 켜져 있습니다"
                                            : permission === "denied"
                                            ? "브라우저 설정에서 알림을 허용해주세요"
                                            : "출석·공지 알림을 받을 수 있어요"}
                                    </p>
                                </div>
                            </div>
                            {permission !== "granted" && permission !== "denied" && (
                                <button
                                    onClick={requestPermission}
                                    className="rounded-rh-md bg-rh-accent px-4 py-2 text-rh-caption font-semibold text-white"
                                >
                                    알림 켜기
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* BottomNav */}
            <BottomNavigation />
        </div>
    );
});

MemberDetailTemplate.displayName = 'MemberDetailTemplate';

export default MemberDetailTemplate;
