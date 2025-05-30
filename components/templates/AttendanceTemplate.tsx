'use client'; // 클라이언트 컴포넌트로 지정

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/organisms/common/PageHeader';
import AttendanceForm from '@/components/organisms/attendance/AttendanceForm';
import AttendanceButton from '@/components/atoms/AttendanceButton';
import PopupNotification, { NotificationType } from '@/components/molecules/common/PopupNotification';

interface AttendanceTemplateProps {
  currentUser: {
    id: string; // 사용자 ID
    name: string | null; // 사용자 이름
  } | null; // 로그인 안된 경우 등 고려
  crewInfo: {
    id: string; // 크루 ID
    name: string | null; // 크루 이름
  } | null;
  fetchedLocationOptions: Array<{ value: string; label: string }>; // 서버에서 가져온 장소 옵션 (value는 location ID)
  fetchedExerciseOptions: Array<{ value: string; label: string }>; // 서버에서 가져온 운동 옵션 (value는 exercise_type ID)
}

const AttendanceTemplate: React.FC<AttendanceTemplateProps> = ({
  currentUser,
  crewInfo,
  fetchedLocationOptions,
  fetchedExerciseOptions,
}) => {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<NotificationType | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  // currentUser나 crewInfo가 없으면 로딩 또는 에러 처리 (page.tsx에서 리다이렉트 하므로 이론상 null이 오면 안됨)
  if (!currentUser || !crewInfo) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <PageHeader title="출석 체크" iconColor="black" borderColor="border-[#EAEAF3]" />
        <p className='mt-4'>사용자 또는 크루 정보를 불러오는 중이거나, 접근 권한이 없습니다.</p>
      </div>
    );
  }
  
  // initialData는 AttendanceForm에 전달하기 전에 한 번만 설정되도록 useEffect나 useMemo 사용 고려 가능
  // 여기서는 props 변경 시 리렌더링되면서 initialData도 업데이트됨
  const today = new Date(); // 사용자 브라우저 기준 오늘 날짜 (KST 사용자는 KST 기준)
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0'); // 월은 0부터 시작하므로 +1
  const day = today.getDate().toString().padStart(2, '0');
  const todayKST_YYYYMMDD = `${year}-${month}-${day}`;

  const initialAttendanceData = {
    name: currentUser.name || "사용자",
    // age 필드는 AttendanceForm에서 사용하지 않거나, birthYear를 전달하는 방식으로 변경 필요
    date: todayKST_YYYYMMDD, // "YYYY-MM-DD" 형식으로 변경
    location: fetchedLocationOptions.length > 0 ? fetchedLocationOptions[0].value : "",
    exerciseType: fetchedExerciseOptions.length > 0 ? fetchedExerciseOptions[0].value : "",
    isHost: "아니오",
  };
  
  const handleAttendanceSubmit = async (formData: any) => {
    console.log('출석 정보 제출 시도:', formData);
    if (!currentUser.id || !crewInfo?.id) {
      setNotificationType("error");
      setNotificationMessage("사용자 또는 크루 정보를 가져올 수 없습니다.");
      setShowNotification(true);
      return;
    }

    const submissionData = {
      userId: currentUser.id,
      crewId: crewInfo.id,
      locationId: formData.location, // AttendanceForm의 location 필드 value가 ID여야 함
      exerciseTypeId: formData.exerciseType, // AttendanceForm의 exerciseType 필드 value가 ID여야 함
      isHost: formData.isHost === '예', // '예'/'아니오' 문자열을 boolean으로
      attendanceTimestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/attendance', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setNotificationType("success");
        setNotificationMessage("출석이 완료되었습니다!");
      } else {
        setNotificationType("error");
        setNotificationMessage(result.message || "출석 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Attendance submission error:", error);
      setNotificationType("error");
      setNotificationMessage("출석 처리 중 네트워크 오류가 발생했습니다.");
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
          locationOptions={fetchedLocationOptions} // 서버에서 받은 옵션 사용
          exerciseOptions={fetchedExerciseOptions} // 서버에서 받은 옵션 사용
          showHostField={true} // 벙주(호스트) 여부 필드 표시
          onSubmit={handleAttendanceSubmit}
        />
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-[#EAEAF3] bg-white shadow-md">
        <AttendanceButton onClick={() => {
          // AttendanceForm 내부의 submit 버튼을 직접 클릭하도록 유도하거나, form id를 통해 submit
          const form = document.querySelector('form'); // 가장 첫번째 form을 대상으로 함 (더 구체적인 selector 필요할 수 있음)
          if (form) {
            // form.submit(); // HTML 기본 submit (페이지 새로고침 발생 가능성)
            form.requestSubmit(); // 권장: onSubmit 핸들러 트리거 (연결된 경우)
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
            if (notificationType === "success") {
              window.location.href = "/";
            }
          }}
        />
      )}
    </div>
  );
};

export default AttendanceTemplate; 