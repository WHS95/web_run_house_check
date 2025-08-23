'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/organisms/common/PageHeader';
import PopupNotification, { NotificationType } from '@/components/molecules/common/PopupNotification';
import { haptic } from '@/lib/haptic';
import { AiOutlineCalendar } from "react-icons/ai";
import { IoChevronDown } from "react-icons/io5";
import LoadingSpinner from '../atoms/LoadingSpinner';

const HOST_OPTIONS = [
  { value: '예', label: '예' },
  { value: '아니오', label: '아니오' },
];

// 현재 시간 계산 함수들
const getCurrentTime = () => {
  const now = new Date();
  const currentMinutes = now.getMinutes();
  const remainder = currentMinutes % 10;
  let adjustedMinutes;
  let adjustedHours = now.getHours();
  
  if (remainder >= 5) {
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

const getTodayString = () => {
  const now = new Date();
  const koreaOffset = 9 * 60;
  const localTime = new Date(now.getTime() + (koreaOffset - now.getTimezoneOffset()) * 60000);
  return localTime.toISOString().split('T')[0];
};

const isFutureDateTime = (date: string, time: string) => {
  const selectedDateTime = new Date(`${date}T${time}:00`);
  const now = new Date();
  return selectedDateTime > now;
};

const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) => 
  ['00', '10', '20', '30', '40', '50'].map(m => ({
    value: `${h.toString().padStart(2, '0')}:${m}`,
    label: `${h.toString().padStart(2, '0')}:${m}`
  }))
).flat();

const getAvailableTimeOptions = (selectedDate: string) => {
  const today = getTodayString();
  if (selectedDate !== today) {
    return TIME_OPTIONS;
  }
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return TIME_OPTIONS.filter(option => option.value <= currentTime);
};

interface ClientAttendancePageProps {
  initialFormData?: {
    userName: string;
    crewInfo: any;
    locationOptions: any[];
    exerciseOptions: any[];
  };
  userStatus?: any;
  userId?: string;
  error?: string;
}

const ClientAttendancePage: React.FC<ClientAttendancePageProps> = ({
  initialFormData,
  userStatus,
  userId,
  error
}) => {
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<NotificationType | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // 초기 폼 데이터
  const [formData, setFormData] = useState(() => {
    if (initialFormData) {
      return {
        name: initialFormData.userName,
        date: getTodayString(),
        time: getCurrentTime(),
        location: initialFormData.locationOptions[0]?.value || '',
        exerciseType: initialFormData.exerciseOptions[0]?.value || '',
        isHost: '아니오',
      };
    }
    return {
      name: '',
      date: getTodayString(),
      time: getCurrentTime(),
      location: '',
      exerciseType: '',
      isHost: '아니오',
    };
  });

  const handleFormChange = useCallback((field: string, value: string) => {
    if (field === 'date') {
      setFormData(prev => {
        const newData = { ...prev, [field]: value };
        
        if (value === getTodayString()) {
          const availableOptions = getAvailableTimeOptions(value);
          if (availableOptions.length > 0 && !availableOptions.find(opt => opt.value === prev.time)) {
            newData.time = availableOptions[availableOptions.length - 1].value;
          }
        }
        
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !userId) return;

    // 사용자 상태 확인
    if (userStatus && !userStatus.isActive) {
      haptic.error();
      setNotificationType('error');
      setNotificationMessage(`${userStatus.statusMessage}\n\n${userStatus.suspensionReason}`);
      setShowNotification(true);
      return;
    }

    // 미래 시간 차단
    if (isFutureDateTime(formData.date, formData.time)) {
      haptic.error();
      setNotificationType('error');
      setNotificationMessage('현재 시간보다 이후 시간으로는 출석할 수 없습니다.');
      setShowNotification(true);
      return;
    }

    setIsSubmitting(true);
    haptic.medium();

    setNotificationType('loading');
    setNotificationMessage('출석 처리 중...');
    setShowNotification(true);

    try {
      const attendanceDateTime = new Date(`${formData.date}T${formData.time}:00`);
      const submissionData = {
        userId,
        crewId: initialFormData!.crewInfo.id,
        locationId: formData.location,
        exerciseTypeId: formData.exerciseType,
        isHost: formData.isHost === '예',
        attendanceTimestamp: attendanceDateTime.toISOString(),
      };

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        haptic.success();
        setNotificationType('success');
        setNotificationMessage('출석이 완료되었습니다!');
      } else {
        haptic.error();
        setNotificationType('error');
        setNotificationMessage(result.message || '출석 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      haptic.error();
      setNotificationType('error');
      setNotificationMessage('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }

    setShowNotification(true);
  }, [isSubmitting, userId, userStatus, formData, initialFormData]);

  const availableTimeOptions = useMemo(() => getAvailableTimeOptions(formData.date), [formData.date]);

  // 에러 상태 처리
  if (error) {
    return (
      <div className="h-screen bg-basic-black flex flex-col items-center justify-center">
        <div className="text-white text-center p-4">
          <h2 className="text-xl font-bold mb-4">오류가 발생했습니다</h2>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-basic-blue text-white rounded"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 초기 데이터가 없는 경우
  if (!initialFormData) {
    return (
      <div className="h-screen bg-basic-black flex items-center justify-center">
        <LoadingSpinner size="lg" color="blue" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-basic-black flex flex-col overflow-hidden relative">
      {/* 헤더 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <PageHeader title="출석 체크" iconColor="white" borderColor="gray-500" />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-y-auto native-scroll pt-[10vh] pb-[20vh] px-[4vw]">
        <div className="space-y-[3vh]">
          {/* 이름 */}
          <div>
            <label className="block mb-[1.5vh] text-[0.875rem] font-bold text-white">이름</label>
            <div className="h-[6vh] bg-basic-black-gray rounded-xl flex items-center px-[2vw]">
              <span className="text-white font-medium">{formData.name}</span>
            </div>
          </div>

          {/* 참여일시 */}
          <div>
            <label className="block mb-[1.5vh] text-[0.875rem] font-bold text-white">참여일시</label>
            <div className="space-y-[1.5vh]">
              <div className="relative">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                  className="ios-date-input bg-basic-black-gray text-white"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-[1.5vw] pointer-events-none">
                  <AiOutlineCalendar className="w-[1.25rem] h-[1.25rem] text-gray-400" />
                </div>
              </div>
              <div className="relative">
                <select
                  value={formData.time}
                  onChange={(e) => handleFormChange('time', e.target.value)}
                  className="ios-select bg-basic-black-gray text-white"
                >
                  {availableTimeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-[1.5vw] pointer-events-none">
                  <IoChevronDown className="w-[1.25rem] h-[1.25rem] text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* 장소 */}
          <div>
            <label className="block mb-[1.5vh] text-[0.875rem] font-bold text-white">참여 장소</label>
            <div className="relative">
              <select
                value={formData.location}
                onChange={(e) => handleFormChange('location', e.target.value)}
                className="ios-select bg-basic-black-gray text-white"
              >
                {initialFormData!.locationOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <IoChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* 운동 종류 */}
          <div>
            <label className="block mb-[1.5vh] text-[0.875rem] font-bold text-white">운동 종류</label>
            <div className="relative">
              <select
                value={formData.exerciseType}
                onChange={(e) => handleFormChange('exerciseType', e.target.value)}
                className="ios-select bg-basic-black-gray text-white"
              >
                {initialFormData!.exerciseOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <IoChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* 개설자 여부 */}
          <div>
            <label className="block mb-[1.5vh] text-[0.875rem] font-bold text-white">개설자 여부</label>
            <div className="flex space-x-[2vw]">
              {HOST_OPTIONS.map(option => (
                <label key={option.value} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="isHost"
                    value={option.value}
                    checked={formData.isHost === option.value}
                    onChange={(e) => handleFormChange('isHost', e.target.value)}
                    className="mr-[1vw] text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-white">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 제출 버튼 */}
        <button  
          onClick={handleSubmit}
          disabled={isSubmitting || (userStatus && !userStatus.isActive)}
          className={`mt-[2vh] p-[1vh] rounded-md transition-colors active:scale-95 native-shadow hw-accelerated hover:bg-white/10 w-full h-[7vh] font-bold text-white ${
            isSubmitting || (userStatus && !userStatus.isActive)
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-basic-blue hover:bg-blue-600'
          }`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-[1vw]">
              <LoadingSpinner size="md" color="white" />
              <span>처리 중...</span>
            </div>
          ) : userStatus && !userStatus.isActive ? (
            "출석 불가"
          ) : (
            "출석 체크"
          )}
        </button>
      </div>

      {/* 알림 팝업 */}
      {notificationType && (
        <PopupNotification 
          isVisible={showNotification} 
          message={notificationMessage}
          type={notificationType}
          duration={notificationType === 'loading' ? 0 : 1500}
          onClose={() => {
            setShowNotification(false);
            if (notificationType === 'success') {
              setTimeout(() => router.push('/ranking'), 100);
            } else if (notificationType === 'error' && userStatus && !userStatus.isActive) {
              setTimeout(() => router.push('/'), 100);
            }
          }}
        />
      )}
    </div>
  );
};

export default ClientAttendancePage;