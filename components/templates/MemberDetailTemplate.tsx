'use client'; // 클라이언트 컴포넌트로 지정

import React from 'react';
import PageHeader from '@/components/organisms/common/PageHeader';
import MemberProfileInfo from '@/components/organisms/manager/memberDetail/MemberProfileInfo';
import MemberContactInfo from '@/components/organisms/manager/memberDetail/MemberContactInfo';
import MemberActivityInfo from '@/components/organisms/manager/memberDetail/MemberActivityInfo';
import WithdrawButton from '@/components/atoms/WithdrawButton';
import ManagerBottomNav from '@/components/organisms/manager/ManagerBottomNav';

interface MemberDetailTemplateProps {
  memberId: string;
}

// 임시 회원 데이터
const dummyMemberData = {
  id: '1',
  name: '홍길동(95)',
  joinDate: '2021/01/01',
  grade: 'Black',
  email: 'test@naver.com',
  phone: '010-1111-2222',
  attendanceCount: 45,
  meetingsCreatedCount: 16,
};

const MemberDetailTemplate: React.FC<MemberDetailTemplateProps> = ({ memberId }) => {
  // TODO: memberId를 사용하여 실제 회원 데이터 Fetch
  const member = dummyMemberData; // 임시 데이터 사용

  const handleWithdraw = () => {
    // TODO: 회원 탈퇴 처리 로직 구현
    alert(`회원 ${member.name} 탈퇴 처리`);
  };

  

  return (
    <div className="min-h-screen bg-white flex flex-col pb-16"> {/* 하단 네비 높이만큼 패딩 추가 */} 
      <div className="p-4 flex-shrink-0">
        <PageHeader title="회원 상세" iconColor="black" backLink="/" borderColor="gray-300" />
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <MemberProfileInfo 
          name={member.name}
          joinDate={member.joinDate}
          grade={member.grade}
        />
        <MemberContactInfo 
          email={member.email}
          phone={member.phone}
        />
        <MemberActivityInfo 
          attendanceCount={member.attendanceCount}
          meetingsCreatedCount={member.meetingsCreatedCount}
        />
        <div className="mt-8 text-right">
          <WithdrawButton onClick={handleWithdraw} />
        </div>
      </div>
    
    </div>
  );
};

export default MemberDetailTemplate; 