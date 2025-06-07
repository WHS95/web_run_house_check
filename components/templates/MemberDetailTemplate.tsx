'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { FiSettings } from 'react-icons/fi';
import PageHeader from '@/components/organisms/common/PageHeader';
import MemberProfileInfo from '@/components/organisms/manager/memberDetail/MemberProfileInfo';
import MemberActivityHistory from '@/components/organisms/manager/memberDetail/MemberActivityHistory';
import ActivityContributionGraph from '@/components/molecules/ActivityContributionGraph';

interface Activity {
    type: 'attendance' | 'create_meeting';
    date: string;
    location: string;
    exerciseType: string;
}

interface UserProfileForMyPage {
    firstName: string | null;
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
}

const ErrorState = memo(() => (
    <div className="h-screen bg-white flex flex-col">
        <div className="flex-shrink-0">
            <PageHeader title="내 정보" iconColor="black" backLink="/" borderColor="gray-300" />
        </div>
        <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-600">사용자 정보를 불러올 수 없습니다.</p>
        </div>
    </div>
));
ErrorState.displayName = 'ErrorState';

const AdminButton = memo(() => (
    <Link 
        href="/admin" 
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        title="크루관리"
    >
        <FiSettings size={18} color="black" />
    </Link>
));
AdminButton.displayName = 'AdminButton';

const MemberDetailTemplate = memo<MemberDetailTemplateProps>(({ userProfile, activityData }) => {
    const displayName = useMemo(() => {
        if (!userProfile?.firstName) return '사용자';
        return userProfile.birthYear 
            ? `${userProfile.firstName} (${String(userProfile.birthYear)})`
            : userProfile.firstName;
    }, [userProfile?.firstName, userProfile?.birthYear]);

    const adminButton = useMemo(() => {
        return userProfile?.isAdmin ? <AdminButton /> : null;
    }, [userProfile?.isAdmin]);

    const profileProps = useMemo(() => ({
        name: displayName,
        joinDate: userProfile?.joinDate || '-',
        grade: userProfile?.rankName || '-'
    }), [displayName, userProfile?.joinDate, userProfile?.rankName]);

    if (!userProfile) {
        return <ErrorState />;
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            <div className="sticky top-0 z-10">
                <PageHeader 
                    title="내 정보" 
                    iconColor="black" 
                    backLink="/" 
                    borderColor="gray-300"
                    rightAction={adminButton}
                />
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-4">
                <MemberProfileInfo {...profileProps} />
                <ActivityContributionGraph 
                    activities={activityData.activities}
                />
                <MemberActivityHistory 
                    activities={activityData.activities}
                />
            </div>
        </div>
    );
});

MemberDetailTemplate.displayName = 'MemberDetailTemplate';

export default MemberDetailTemplate; 