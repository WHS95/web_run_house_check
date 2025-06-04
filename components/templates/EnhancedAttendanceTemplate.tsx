'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/organisms/common/PageHeader';
import AttendanceForm from '@/components/organisms/attendance/AttendanceForm';
import AttendanceButton from '@/components/atoms/AttendanceButton';
import PopupNotification, { NotificationType } from '@/components/molecules/common/PopupNotification';
import PullToRefresh from '@/components/molecules/PullToRefresh';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { haptic } from '@/lib/haptic';

interface EnhancedAttendanceTemplateProps {
  currentUser: {
    id: string;
    name: string | null;
  } | null;
  crewInfo: {
    id: string;
    name: string | null;
  } | null;
  fetchedLocationOptions: Array<{ value: string; label: string }>;
  fetchedExerciseOptions: Array<{ value: string; label: string }>;
}

// 로딩 스피너 컴포넌트
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-basic-blue border-t-transparent"></div>
  </div>
);

// 제출 로딩 오버레이 컴포넌트
const SubmissionLoadingOverlay: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 flex flex-col items-center space-y-3 native-card">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-basic-blue border-t-transparent"></div>
        <p className="text-gray-700 text-sm font-medium">출석 처리 중...</p>
      </div>
    </div>
  );
};

const EnhancedAttendanceTemplate: React.FC<EnhancedAttendanceTemplateProps> = ({
  currentUser,
  crewInfo,
  fetchedLocationOptions,
  fetchedExerciseOptions,
}) => {
  const router = useRouter();
  
  // 상태 관리
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<NotificationType | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // currentUser나 crewInfo가 없으면 로딩 또는 에러 처리
  if (!currentUser || !crewInfo) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center native-scroll">
        <div className="pt-safe">
          <PageHeader title="출석 체크" iconColor="black" borderColor="border-[#EAEAF3]" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner />
            <p className='mt-4 text-gray-600'>사용자 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // 현재 시간을 10분 단위로 가장 가까운 시간으로 설정
  const getCurrentTime = () => {
    const now = new Date();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();
    
    const remainder = currentMinutes % 10;
    
    let adjustedMinutes;
    let adjustedHours = now.getHours();
    
    if (remainder >= 5 || (remainder === 4 && currentSeconds >= 30)) {
      adjustedMinutes = currentMinutes + (10 - remainder);
    } else {
      adjustedMinutes = currentMinutes - remainder;
    }
    
    if (adjustedMinutes >= 60) {
      adjustedHours = (adjustedHours + 1) % 24;
      adjustedMinutes = 0;
    }
    
    return `${adjustedHours.toString().padStart(2, '0')}:${adjustedMinutes.toString().padStart(2, '0')}`;
  };
  
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const todayKST_YYYYMMDD = `${year}-${month}-${day}`;

  const initialAttendanceData = {
    name: currentUser.name || "사용자",
    date: todayKST_YYYYMMDD,
    time: getCurrentTime(),
    location: fetchedLocationOptions.length > 0 ? fetchedLocationOptions[0].value : "",
    exerciseType: fetchedExerciseOptions.length > 0 ? fetchedExerciseOptions[0].value : "",
    isHost: "아니오",
  };

  // 새로고침 함수
  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
  };

  // 홈으로 이동
  const handleSwipeToHome = () => {
    haptic.medium();
    router.push('/');
  };

  // 랭킹으로 이동
  const handleSwipeToRanking = () => {
    haptic.medium();
    router.push('/ranking');
  };

  // 풀 투 리프레시 기능
  const {
    containerRef,
    isRefreshing,
    pullDistance,
    isTriggered,
    refreshIndicatorStyle,
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 100,
    disabled: isSubmitting,
  });

  // 스와이프 제스처 기능
  const swipeRef = useSwipeGesture({
    onSwipeRight: handleSwipeToHome,
    onSwipeLeft: handleSwipeToRanking,
    threshold: 80,
    hapticFeedback: true,
  });
  
  const handleAttendanceSubmit = async (formData: any) => {
    console.log('출석 정보 제출 시도:', formData);
    
    if (!currentUser.id || !crewInfo?.id) {
      haptic.error();
      setNotificationType("error");
      setNotificationMessage("사용자 또는 크루 정보를 가져올 수 없습니다.");
      setShowNotification(true);
      return;
    }

    setIsSubmitting(true);
    haptic.medium(); // 제출 시작 햅틱

    // 날짜와 시간을 합쳐서 ISO 문자열로 변환
    const attendanceDateTime = new Date(`${formData.date}T${formData.time}:00`);
    const currentDateTime = new Date();

    // 참여 일시가 현재 시간보다 빠른지 검증
    if (attendanceDateTime > currentDateTime) {
      haptic.error();
      setNotificationType("error");
      setNotificationMessage("참여 일시를 확인해 주세요.");
      setShowNotification(true);
      setIsSubmitting(false);
      return;
    }

    const submissionData = {
      userId: currentUser.id,
      crewId: crewInfo.id,
      locationId: formData.location,
      exerciseTypeId: formData.exerciseType,
      isHost: formData.isHost === '예',
      attendanceTimestamp: attendanceDateTime.toISOString(),
    };

    try {
      const response = await fetch('/api/attendance', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        haptic.success(); // 성공 햅틱
        setNotificationType("success");
        setNotificationMessage("출석이 완료되었습니다!");
      } else {
        haptic.error(); // 에러 햅틱
        setNotificationType("error");
        setNotificationMessage(result.message || "출석 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Attendance submission error:", error);
      haptic.error(); // 네트워크 에러 햅틱
      setNotificationType("error");
      setNotificationMessage("출석 처리 중 네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
    
    setShowNotification(true);
  };

  const handleAttendanceButtonClick = () => {
    if (isSubmitting) return;
    
    haptic.light(); // 버튼 클릭 햅틱
    
    const form = document.querySelector('form');
    if (form) {
      form.requestSubmit();
    }
  };

  return (
    <div 
      ref={(el) => {
        if (el) {
          containerRef.current = el;
          swipeRef.current = el;
        }
      }}
      className="min-h-screen bg-white flex flex-col native-scroll relative"
    >
      {/* 제출 로딩 오버레이 */}
      <SubmissionLoadingOverlay isVisible={isSubmitting} />

      {/* 풀 투 리프레시 인디케이터 */}
      <PullToRefresh
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        isTriggered={isTriggered}
        style={refreshIndicatorStyle}
      />
      
      {/* 헤더 - 안전 영역 고려 */}
      <div className="flex-shrink-0 pt-safe">
        <div className="mb-4">
          <PageHeader title="출석 체크" iconColor="black" borderColor="border-[#EAEAF3]" />
        </div>
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 native-scroll">
        <AttendanceForm 
          initialData={initialAttendanceData} 
          locationOptions={fetchedLocationOptions}
          exerciseOptions={fetchedExerciseOptions}
          showHostField={true}
          onSubmit={handleAttendanceSubmit}
        />
      </div>
      
      {/* 하단 고정 버튼 - 안전 영역 고려 */}
      <div className="fixed bottom-0 left-0 right-0 p-4  border-t border-[#EAEAF3] bg-white shadow-lg z-40 pb-safe">
        <div className="native-card mx-2">
          <button
            onClick={handleAttendanceButtonClick}
            disabled={isSubmitting}
            className={`w-full h-14 rounded-2xl font-semibold text-white transition-all duration-200 active:scale-95 native-shadow ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-basic-blue hover:bg-blue-600'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <LoadingSpinner />
                <span>처리 중...</span>
              </div>
            ) : (
              "출석 체크"
            )}
          </button>
        </div>
      </div>

      {/* 스와이프 힌트 */}
      <div className="absolute bottom-20 left-4 right-4 z-30 opacity-50 pb-safe">
        <div className="flex justify-between text-gray-400 text-xs">
          <div className="flex items-center space-x-1">
            <span>←</span>
            <span>홈</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>랭킹</span>
            <span>→</span>
          </div>
        </div>
      </div>

      {/* 알림 팝업 */}
      {notificationType && (
        <PopupNotification 
          isVisible={showNotification} 
          message={notificationMessage}
          type={notificationType}
          duration={1500}
          onClose={() => {
            setShowNotification(false);
            if (notificationType === "success") {
              // 성공 시 랭킹 페이지로 이동
              setTimeout(() => {
                router.push("/ranking");
              }, 100);
            }
          }}
        />
      )}
    </div>
  );
};

export default EnhancedAttendanceTemplate; 