'use client'; // 클라이언트 컴포넌트로 지정

import React, { useState } from 'react';
import PageHeader from '@/components/organisms/common/PageHeader'; // 공통 헤더 사용
import AttendanceForm from '@/components/organisms/attendance/AttendanceForm';
import AttendanceButton from '@/components/atoms/AttendanceButton';
import PopupNotification, { NotificationType } from '@/components/molecules/common/PopupNotification';

const AttendanceTemplate: React.FC = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<NotificationType | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  const initialAttendanceData = {
    name: "홍길동",
    age: "1993",
    date: "2024.2.22",
    location: "반포 한강 공원",
    exerciseType: "러닝",
    isHost: "아니오",
  };
  
  const locationOptions = [
    { value: "반포 한강 공원", label: "반포 한강 공원" },
    { value: "여의도 한강 공원", label: "여의도 한강 공원" },
    { value: "잠실 한강 공원", label: "잠실 한강 공원" },
    { value: "뚝섬 한강 공원", label: "뚝섬 한강 공원" },
    { value: "난지 한강 공원", label: "난지 한강 공원" },
    { value: "강서 한강 공원", label: "강서 한강 공원" },
    { value: "망원 한강 공원", label: "망원 한강 공원" },
    { value: "광나루 한강 공원", label: "광나루 한강 공원" },
    { value: "이촌 한강 공원", label: "이촌 한강 공원" },
    { value: "양화 한강 공원", label: "양화 한강 공원" },
    { value: "북서울 꿈의 숲", label: "북서울 꿈의 숲" },
    { value: "서울숲", label: "서울숲" },
    { value: "올림픽 공원", label: "올림픽 공원" },
    { value: "인천 송도 센트럴파크", label: "인천 송도 센트럴파크" },
    { value: "부산 해운대", label: "부산 해운대" },
    { value: "제주 올레길", label: "제주 올레길" },
    { value: "북한산 국립공원", label: "북한산 국립공원" },
    { value: "관악산", label: "관악산" },
    { value: "청계산", label: "청계산" },
    { value: "한라산", label: "한라산" },
  ];
  
  const exerciseOptions = [
    { value: "러닝", label: "러닝" },
    { value: "등산", label: "등산" },
    { value: "자전거", label: "자전거" },
    { value: "걷기", label: "걷기" },
    { value: "수영", label: "수영" },
    { value: "기타", label: "기타" },
  ];
  
  const handleAttendanceSubmit = async (data: any) => {
    console.log('출석 정보 제출 시도:', data);
    const submissionSuccessful = Math.random() > 0.5; // 50% 확률로 성공 또는 실패

    if (submissionSuccessful) {
      setNotificationType("success");
      setNotificationMessage("출석 성공");
    } else {
      setNotificationType("error");
      setNotificationMessage("출석 처리 실패");
    }
    setShowNotification(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-shrink-0">
        <div className="mb-4">
          <PageHeader title="출석 체크" iconColor="black" borderColor="border-[#EAEAF3]" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        <AttendanceForm 
          initialData={initialAttendanceData} 
          locationOptions={locationOptions}
          exerciseOptions={exerciseOptions}
          showHostField={true}
          onSubmit={handleAttendanceSubmit}
        />
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-[#EAEAF3] bg-white shadow-md">
        <AttendanceButton onClick={() => {
          const form = document.querySelector('form');
          if (form) {
            form.requestSubmit();
          }
        }} />
      </div>
      {notificationType && (
        <PopupNotification 
          isVisible={showNotification} 
          message={notificationMessage}
          type={notificationType}
          duration={3000}
          onClose={() => {
            setShowNotification(false);
          }}
        />
      )}
    </div>
  );
};

export default AttendanceTemplate; 