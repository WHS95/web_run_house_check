'use client'; // 클라이언트 컴포넌트로 지정

import React from 'react';
import PageHeader from '@/components/organisms/common/PageHeader';
import MemberProfileInfo from '@/components/organisms/manager/memberDetail/MemberProfileInfo';
import MemberContactInfo from '@/components/organisms/manager/memberDetail/MemberContactInfo';
import MemberActivityInfo from '@/components/organisms/manager/memberDetail/MemberActivityInfo';
import WithdrawButton from '@/components/atoms/WithdrawButton';
// import ManagerBottomNav from '@/components/organisms/manager/ManagerBottomNav'; // MyPage에서는 ManagerBottomNav 제외 가능성

// MyPage에서 사용할 사용자 프로필 정보 타입
interface UserProfileForMyPage {
  firstName: string | null;
  birthYear: number | null;
  joinDate: string | null; // YYYY/MM/DD 형식으로 가정
  rankName: string | null;
  email: string | null;
  phone: string | null;
  profileImageUrl?: string | null;
  // 필요하다면 추가 활동 정보
  // attendanceCount?: number;
  // meetingsCreatedCount?: number;
}

interface MemberDetailTemplateProps {
  userProfile: UserProfileForMyPage | null;
}

const MemberDetailTemplate: React.FC<MemberDetailTemplateProps> = ({ userProfile }) => {

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-shrink-0">
          <PageHeader title="내 정보" iconColor="black" backLink="/" borderColor="gray-300" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">사용자 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  // 이름과 생년을 조합 (예: 홍길동(95))
  const displayName = userProfile.firstName ? 
    `${userProfile.firstName}${userProfile.birthYear ? ` (${String(userProfile.birthYear).slice(-2)})` : ''}` 
    : '사용자';

  const handleWithdraw = () => {
    // TODO: 회원 탈퇴 처리 로직 구현 (실제 ID 기반으로)
    alert(`회원 ${displayName} 탈퇴 처리 요청 (구현 필요)`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-16"> {/* 하단 네비 있을 경우 고려한 패딩, 지금은 제거해도 무방 */}
      <div className="flex-shrink-0">
        {/* MyPage의 경우 backLink를 홈(/) 또는 설정 페이지 등으로 변경 가능 */}
        <PageHeader title="내 정보" iconColor="black" backLink="/" borderColor="gray-300" />
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 p-4">
        <MemberProfileInfo 
          name={displayName} // 조합된 이름 사용
          joinDate={userProfile.joinDate || '-'}
          grade={userProfile.rankName || '-'}
          // profileImageUrl={userProfile.profileImageUrl} // 이 부분은 이미 주석 처리되어 있거나, MemberProfileInfo가 받지 않을 수 있음.
                                                            // 명시적으로 제거하여 혼란을 방지합니다.
        />
        <MemberContactInfo 
          email={userProfile.email || '-'}
          phone={userProfile.phone || '-'}
        />
        {/* MemberActivityInfo는 필요에 따라 활성화 */}
        {/* <MemberActivityInfo \n          attendanceCount={userProfile.attendanceCount || 0}\n          meetingsCreatedCount={userProfile.meetingsCreatedCount || 0}\n        /> */}
        <div className="mt-8 text-right">
          <WithdrawButton onClick={handleWithdraw} />
        </div>
      </div>
      {/* MyPage에서는 ManagerBottomNav 제외 가능성 */}
      {/* <ManagerBottomNav /> */}
    </div>
  );
};

export default MemberDetailTemplate; 