'use client'; // 클라이언트 컴포넌트로 지정

import React from 'react';
import PageHeader from '@/components/organisms/common/PageHeader'; // 공통 헤더 사용
import AttendanceForm from '@/components/organisms/attendance/AttendanceForm';
import AttendanceButton from '@/components/atoms/AttendanceButton';

const AttendanceTemplate: React.FC = () => {
  
  const handleAttendanceSubmit = () => {
    // TODO: 출석 정보 제출 로직 구현
    console.log('출석 정보 제출!');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-2 flex-shrink-0">
        <div className="mb-4">
          <PageHeader title="출석 체크" iconColor="black" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AttendanceForm />
      </div>
      
      <div className="p-4 border-t border-[#EAEAF3] flex-shrink-0">
        <AttendanceButton onClick={handleAttendanceSubmit} />
      </div>
    </div>
  );
};

export default AttendanceTemplate; 