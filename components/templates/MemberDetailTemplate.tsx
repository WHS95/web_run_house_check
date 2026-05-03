'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Settings, Shield } from 'lucide-react';
import PageHeader from '@/components/organisms/common/PageHeader';
import SectionLabel from '@/components/atoms/SectionLabel';
import MyActivityHistory from '@/components/organisms/mypage/MyActivityHistory';

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
    initialYear: number;
    initialMonth: number;
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
        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-rh-accent/15 text-rh-accent hover:bg-rh-accent/25 active:opacity-70 transition-colors"
        title="관리자 모드 접근"
    >
        <Shield size={12} strokeWidth={2.5} />
        <span className="text-[12px] font-semibold leading-none">관리자 모드</span>
    </Link>
));
AdminButton.displayName = 'AdminButton';

const SettingsButton = memo(() => (
    <Link
        href="/mypage/settings"
        aria-label="설정"
        className="flex items-center justify-center w-9 h-9 rounded-full text-white/90 hover:bg-rh-bg-surface active:opacity-70 transition-colors"
    >
        <Settings size={20} strokeWidth={2} />
    </Link>
));
SettingsButton.displayName = 'SettingsButton';

const MemberDetailTemplate = memo<MemberDetailTemplateProps>(({ userProfile, activityData, initialYear, initialMonth }) => {
    const displayName = useMemo(() => {
        if (!userProfile?.firstName) return '사용자';
        return userProfile.firstName;
    }, [userProfile?.firstName]);

    const headerRightAction = useMemo(() => {
        return (
            <div className="flex items-center gap-2">
                {userProfile?.isAdmin && <AdminButton />}
                <SettingsButton />
            </div>
        );
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

    if (!userProfile) {
        return <ErrorState />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            {/* Header */}
            <PageHeader
                title="MY"
                iconColor="white"
                borderColor="rh-border"
                backgroundColor="bg-rh-bg-primary"
                rightAction={headerRightAction}
            />

            {/* Content */}
            <div className="flex-1 px-4 pt-4 pb-4 space-y-5">
                {/* Profile */}
                <div className="flex items-center gap-4">
                    {userProfile.profileImageUrl ? (
                        <img
                            src={userProfile.profileImageUrl}
                            alt="프로필"
                            className="h-16 w-16 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rh-accent">
                            <span className="text-2xl font-bold text-white">
                                {userProfile.firstName?.charAt(0) ?? '?'}
                            </span>
                        </div>
                    )}
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

                {/* 활동 기록 */}
                <SectionLabel>활동 기록</SectionLabel>
                <MyActivityHistory
                    activities={activityData.activities}
                    initialYear={initialYear}
                    initialMonth={initialMonth}
                />
            </div>
        </div>
    );
});

MemberDetailTemplate.displayName = 'MemberDetailTemplate';

export default MemberDetailTemplate;
