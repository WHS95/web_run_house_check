import React from 'react';
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

const MemberDetailTemplate: React.FC<MemberDetailTemplateProps> = ({ userProfile, activityData }) => {
    if (!userProfile) {
        return (
            <div className="h-screen bg-white flex flex-col">
                <div className="flex-shrink-0">
                    <PageHeader title="내 정보" iconColor="black" backLink="/" borderColor="gray-300" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-600">사용자 정보를 불러올 수 없습니다.</p>
                </div>
            </div>
        );
    }

    const displayName = userProfile.firstName ? 
        `${userProfile.firstName}${userProfile.birthYear ? ` (${String(userProfile.birthYear)})` : ''}` 
        : '사용자';

    // 관리자 권한이 있는 경우 크루관리 버튼 생성
    const adminButton = userProfile.isAdmin ? (
        <Link 
            href="/admin" 
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title="크루관리"
        >
            <FiSettings size={18} color="black" />
        </Link>
    ) : null;

    return (
        <div className="flex flex-col h-screen">
            {/* 고정된 헤더 */}
            <div className="sticky top-0 z-10">
                <PageHeader 
                    title="내 정보" 
                    iconColor="black" 
                    backLink="/" 
                    borderColor="gray-300"
                    rightAction={adminButton}
                />
            </div>
            
            {/* 스크롤 가능한 전체 콘텐츠 영역 */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                <MemberProfileInfo 
                    name={displayName}
                    joinDate={userProfile.joinDate || '-'}
                    grade={userProfile.rankName || '-'}
                />
                <ActivityContributionGraph 
                    activities={activityData.activities}
                />
                <MemberActivityHistory 
                    activities={activityData.activities}
                />
            </div>
        </div>
    );
};

export default MemberDetailTemplate; 