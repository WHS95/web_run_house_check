'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Settings, Shield, User as UserIcon, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/organisms/common/PageHeader';
import { AnimatedList, AnimatedItem } from '@/components/atoms/AnimatedList';
import FadeIn from '@/components/atoms/FadeIn';
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
    <div className="flex flex-col h-screen bg-rh-bg-primary">
        <div className="flex-shrink-0">
            <PageHeader
                title="마이페이지"
                iconColor="white"
                borderColor="rh-border"
                backgroundColor="bg-rh-bg-primary"
            />
        </div>
        <div className="flex flex-1 justify-center items-center">
            <p className="text-rh-text-muted">사용자 정보를 불러올 수 없습니다.</p>
        </div>
    </div>
));
ErrorState.displayName = 'ErrorState';

const AdminButton = memo(() => (
    <Link
        href="/admin2"
        className="inline-flex gap-1 items-center px-2.5 h-7 rounded-full transition-colors bg-rh-accent/15 text-rh-accent hover:bg-rh-accent/25 active:opacity-70"
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
        className="flex justify-center items-center w-9 h-9 rounded-full transition-colors text-white/90 hover:bg-rh-bg-surface active:opacity-70"
    >
        <Settings size={20} strokeWidth={2} />
    </Link>
));
SettingsButton.displayName = 'SettingsButton';

interface MenuRowProps {
    icon: React.ReactNode;
    label: string;
    href: string;
}

const MenuRow = memo<MenuRowProps>(({ icon, label, href }) => (
    <Link
        href={href}
        className="flex gap-3 items-center py-2.5 active:opacity-80"
    >
        <div
            className="flex shrink-0 justify-center items-center w-8 h-8 rounded-rh-md bg-rh-bg-surface text-rh-text-secondary"
            aria-hidden
        >
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <div className="font-semibold leading-tight text-rh-body text-rh-text-primary">
                {label}
            </div>
        </div>
        <ChevronRight size={16} className="shrink-0 text-rh-text-muted" />
    </Link>
));
MenuRow.displayName = 'MenuRow';

// sc-my heatmap: 4주 × 7일 = 28셀. 최근 28일 출석 count → l0~l4 강도
const buildHeatCells = (activities: Activity[]): Array<0 | 1 | 2 | 3 | 4> => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const countMap = new Map<string, number>();

    activities.forEach((a) => {
        if (a.type !== 'attendance') return;
        const d = new Date(a.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        countMap.set(key, (countMap.get(key) ?? 0) + 1);
    });

    const cells: Array<0 | 1 | 2 | 3 | 4> = [];
    // 27일 전 ~ 오늘 (28일)
    for (let offset = 27; offset >= 0; offset--) {
        const d = new Date(today);
        d.setDate(today.getDate() - offset);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const count = countMap.get(key) ?? 0;
        const isFuture = key > todayKey;
        if (isFuture || count === 0) cells.push(0);
        else if (count === 1) cells.push(1);
        else if (count === 2) cells.push(2);
        else if (count === 3) cells.push(3);
        else cells.push(4);
    }
    return cells;
};

const MemberDetailTemplate = memo<MemberDetailTemplateProps>(({
    userProfile,
    activityData,
    initialYear,
    initialMonth,
}) => {
    const displayName = useMemo(() => {
        if (!userProfile?.firstName) return '사용자';
        return userProfile.firstName;
    }, [userProfile?.firstName]);

    const initial = useMemo(() => {
        return userProfile?.firstName?.charAt(0) ?? '?';
    }, [userProfile?.firstName]);

    const headerRightAction = useMemo(() => {
        return (
            <div className="flex gap-2 items-center">
                {userProfile?.isAdmin && <AdminButton />}
                <SettingsButton />
            </div>
        );
    }, [userProfile?.isAdmin]);

    const thisMonthCount = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        return activityData.activities.filter((a) => {
            const d = new Date(a.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;
    }, [activityData.activities]);

    // 참여율: 이번 달 출석 / 이번 달 일수 (대략)
    const participationRate = useMemo(() => {
        const now = new Date();
        const daysInMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
        ).getDate();
        if (daysInMonth === 0) return 0;
        return Math.min(100, Math.round((thisMonthCount / daysInMonth) * 100));
    }, [thisMonthCount]);

    const heatCells = useMemo(
        () => buildHeatCells(activityData.activities),
        [activityData.activities]
    );

    if (!userProfile) {
        return <ErrorState />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-rh-bg-primary">
            <PageHeader
                title="마이페이지"
                iconColor="white"
                borderColor="rh-border"
                backgroundColor="bg-rh-bg-primary"
                rightAction={headerRightAction}
            />

            <div className="flex overflow-y-auto flex-col flex-1 gap-4 px-4 pt-3 pb-4">
                <FadeIn>
                    {/* 프로필 row */}
                    <div className="flex gap-3 items-center py-2">
                        {userProfile.profileImageUrl ? (
                            <img
                                src={userProfile.profileImageUrl}
                                alt="프로필"
                                className="object-cover w-16 h-16 rounded-full"
                            />
                        ) : (
                            <div className="flex justify-center items-center w-16 h-16 rounded-full bg-rh-accent">
                                <span className="text-2xl font-bold text-rh-text-inverted">
                                    {initial}
                                </span>
                            </div>
                        )}
                        <div className="flex flex-col flex-1 gap-1.5 min-w-0">
                            <span className="text-[15px] font-semibold text-rh-text-primary truncate">
                                {displayName}
                            </span>
                            <span className="text-rh-caption text-rh-text-secondary truncate">
                                RunHouse Crew · {userProfile.rankName ?? '멤버'}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {userProfile.rankName && (
                                    <span
                                        className="rh-chip"
                                        data-on="true"
                                    >
                                        {userProfile.rankName}
                                    </span>
                                )}
                                {userProfile.birthYear && (
                                    <span className="rh-chip">
                                        {String(userProfile.birthYear).slice(-2)}년
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </FadeIn>

                {/* stat row: 3분할 */}
                <div className="flex gap-2">
                    <div className="flex flex-col flex-1 gap-1 items-center justify-center rh-box rh-box-tight">
                        <span className="rh-display text-[28px] text-rh-accent">
                            {activityData.attendanceCount}
                        </span>
                        <span className="text-rh-caption text-rh-text-tertiary">출석</span>
                    </div>
                    <div className="flex flex-col flex-1 gap-1 items-center justify-center rh-box rh-box-tight">
                        <span className="rh-display text-[28px]">
                            {activityData.meetingsCreatedCount}
                        </span>
                        <span className="text-rh-caption text-rh-text-tertiary">개설</span>
                    </div>
                    <div className="flex flex-col flex-1 gap-1 items-center justify-center rh-box rh-box-tight">
                        <span className="rh-display text-[28px]">
                            {participationRate}%
                        </span>
                        <span className="text-rh-caption text-rh-text-tertiary">참여율</span>
                    </div>
                </div>

                {/* 월별 활동 heat */}
                <div className="flex flex-col gap-3 rh-box rh-box-tight">
                    <div className="rh-eye">월별 활동</div>
                    <div className="rh-heat">
                        {heatCells.map((level, idx) => (
                            <div
                                key={idx}
                                className={`rh-heat-cell${level > 0 ? ` l${level}` : ''}`}
                                aria-hidden
                            />
                        ))}
                    </div>
                </div>

                {/* 메뉴 리스트 */}
                <AnimatedList className="flex flex-col divide-y divide-rh-border/60">
                    <AnimatedItem>
                        <MenuRow
                            icon={<UserIcon size={16} strokeWidth={1.6} />}
                            label="내정보 수정"
                            href="/mypage/edit"
                        />
                    </AnimatedItem>
                    <AnimatedItem>
                        <MenuRow
                            icon={<Settings size={16} strokeWidth={1.6} />}
                            label="설정"
                            href="/mypage/settings"
                        />
                    </AnimatedItem>
                </AnimatedList>

                {/* 활동 기록 (sc-my 외 보존 섹션) */}
                <div className="flex flex-col gap-3 mt-2">
                    <div className="rh-eye">활동 기록</div>
                    <MyActivityHistory
                        activities={activityData.activities}
                        initialYear={initialYear}
                        initialMonth={initialMonth}
                    />
                </div>
            </div>
        </div>
    );
});

MemberDetailTemplate.displayName = 'MemberDetailTemplate';

export default MemberDetailTemplate;
