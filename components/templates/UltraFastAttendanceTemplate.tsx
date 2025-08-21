'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import PageHeader from '@/components/organisms/common/PageHeader';
import PopupNotification, { NotificationType } from '@/components/molecules/common/PopupNotification';
import { haptic } from '@/lib/haptic';
import { AiOutlineCalendar } from "react-icons/ai";
import { IoChevronDown } from "react-icons/io5";
import LoadingSpinner from '../atoms/LoadingSpinner';

// ⚡ 심플한 폼 로딩 스켈레톤
const FormSkeleton = React.memo(() => (
  <div className="space-y-[3vh] animate-pulse">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index}>
        <div className="h-[1rem] bg-gray-200 rounded w-[24vw] mb-[1.5vh]"></div>
        <div className="h-[6vh] bg-gray-100 rounded-xl"></div>
      </div>
    ))}
  </div>
));
FormSkeleton.displayName = 'FormSkeleton';

const HOST_OPTIONS = [
  { value: '예', label: '예' },
  { value: '아니오', label: '아니오' },
];

// ⚡ 현재 시간 즉시 계산
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
    // 한국 시간(UTC+9) 기준으로 오늘 날짜 반환
    const now = new Date();
    // UTC+9로 변환
    const koreaOffset = 9 * 60; // 분 단위
    const localTime = new Date(now.getTime() + (koreaOffset - now.getTimezoneOffset()) * 60000);
    return localTime.toISOString().split('T')[0];
};

// ⚡ 현재 시간보다 이후인지 확인하는 함수 (미래 시간인지)
const isFutureDateTime = (date: string, time: string) => {
  const selectedDateTime = new Date(`${date}T${time}:00`);
  const now = new Date();
  // console.log("selectedDateTime", selectedDateTime);  
  // console.log("now", now);
  return selectedDateTime > now;
};

// ⚡ 오늘 날짜에서 선택 가능한 시간 옵션 필터링 (현재 시간 이전만 허용)
const getAvailableTimeOptions = (selectedDate: string) => {
  const today = getTodayString();
  if (selectedDate !== today) {
    return TIME_OPTIONS; // 오늘이 아니면 모든 시간 선택 가능
  }
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return TIME_OPTIONS.filter(option => option.value <= currentTime);
};

// ⚡ 시간 옵션 미리 계산 (컴포넌트 외부에서)
const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) => 
  ['00', '10', '20', '30', '40', '50'].map(m => ({
    value: `${h.toString().padStart(2, '0')}:${m}`,
    label: `${h.toString().padStart(2, '0')}:${m}`
  }))
).flat();

// ⚡ 실제 데이터 로딩 후 표시되는 폼 컴포넌트
const UltraFastForm = React.memo<{
  formData: any;
  onFormChange: (field: string, value: string) => void;
  locationOptions: any[];
  exerciseOptions: any[];
}>(({ formData, onFormChange, locationOptions, exerciseOptions }) => {
  
  // 현재 날짜에 따른 시간 옵션 계산
  const availableTimeOptions = useMemo(() => getAvailableTimeOptions(formData.date), [formData.date]);
  
  return (
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
              onChange={(e) => onFormChange('date', e.target.value)}
              className="ios-date-input bg-basic-black-gray text-white"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-[1.5vw] pointer-events-none">
              <AiOutlineCalendar className="w-[1.25rem] h-[1.25rem] text-gray-400" />
            </div>
          </div>
          <div className="relative">
            <select
              value={formData.time}
              onChange={(e) => onFormChange('time', e.target.value)}
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
            onChange={(e) => onFormChange('location', e.target.value)}
            className="ios-select bg-basic-black-gray text-white"
          >
            {locationOptions.map(option => (
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
            onChange={(e) => onFormChange('exerciseType', e.target.value)}
            className="ios-select bg-basic-black-gray text-white"
          >
            {exerciseOptions.map(option => (
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
                onChange={(e) => onFormChange('isHost', e.target.value)}
                className="mr-[1vw] text-blue-500 focus:ring-blue-500"
              />
              <span className="text-white">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
});
UltraFastForm.displayName = 'UltraFastForm';

const UltraFastAttendanceTemplate = () => {
  const router = useRouter();
  
  // ⚡ 상태 최적화 - 필요한 것만 분리
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [crewInfo, setCrewInfo] = useState<any>(null);
  const [locationOptions, setLocationOptions] = useState<any[]>([]);
  const [exerciseOptions, setExerciseOptions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<NotificationType | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // ⚡ 폼 데이터 (메모화된 초기값)
  const initialFormData = useMemo(() => ({
    name: '',
    date: getTodayString(),
    time: getCurrentTime(),
    location: '',
    exerciseType: '',
    isHost: '아니오',
  }), []);

  const [formData, setFormData] = useState(initialFormData);

  // ⚡ Supabase 클라이언트 (한 번만 생성)
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // ⚡ 메모화된 폼 변경 핸들러
  const handleFormChange = useCallback((field: string, value: string) => {
    if (field === 'date') {
      setFormData(prev => {
        const newData = { ...prev, [field]: value };
        
        // 오늘 날짜로 변경된 경우, 현재 시간 이후면 현재 시간으로 조정
        if (value === getTodayString()) {
          const availableOptions = getAvailableTimeOptions(value);
          if (availableOptions.length > 0 && !availableOptions.find(opt => opt.value === prev.time)) {
            newData.time = availableOptions[availableOptions.length - 1].value; // 현재 시간에 가장 가까운 시간
          }
        }
        
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  // ⚡ 메모화된 제출 핸들러
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !currentUser || !crewInfo) return;

    // 사용자 상태 확인
    if (userStatus && !userStatus.isActive) {
      haptic.error();
      setNotificationType('error');
      setNotificationMessage(`${userStatus.statusMessage}\n\n${userStatus.suspensionReason}`);
      setShowNotification(true);
      return;
    }

    // 현재 시간보다 이후인지 검증 (미래 시간 차단)
    if (isFutureDateTime(formData.date, formData.time)) {
      haptic.error();
      setNotificationType('error');
      setNotificationMessage('현재 시간보다 이후 시간으로는 출석할 수 없습니다.');
      setShowNotification(true);
      return;
    }

    setIsSubmitting(true);
    haptic.medium();

    // 로딩 알림 표시
    setNotificationType('loading');
    setNotificationMessage('출석 처리 중...');
    setShowNotification(true);

    try {
      const attendanceDateTime = new Date(`${formData.date}T${formData.time}:00`);
      const submissionData = {
        userId: currentUser.id,
        crewId: crewInfo.id,
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
  }, [isSubmitting, currentUser, crewInfo, formData, userStatus]);

  // ⚡ 데이터 로딩 - 통합 함수 사용으로 대폭 간소화
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. 사용자 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/auth/login');
          return;
        }

        // 1-1. 사용자 상태 확인
        try {
          const statusResponse = await fetch('/api/user/status');
          const statusResult = await statusResponse.json();
          
          if (statusResult.success) {
            setUserStatus(statusResult.data);
            
            // 사용자가 비활성화된 상태인 경우 알림 표시 후 리턴 (출석 불가)
            if (!statusResult.data.isActive) {
              setNotificationType('error');
              setNotificationMessage(`${statusResult.data.statusMessage}\n\n${statusResult.data.suspensionReason}`);
              setShowNotification(true);
              setIsDataLoading(false);
              // 알림 후 홈으로 이동하기 위해 타이머 설정
              setTimeout(() => {
                router.push('/');
              }, 3000);
              return;
            }
          }
        } catch (statusError) {
          //console.error('사용자 상태 확인 오류:', statusError);
          // 상태 확인 실패 시에도 계속 진행 (기본적으로는 허용)
        }

        // 2. 통합 폼 데이터 조회 (5번 통신 → 1번 통신)
        const { data: result, error } = await supabase.schema('attendance').rpc('get_attendance_form_data', {
          p_user_id: user.id
        });

        if (error) {
          //console.error('폼 데이터 조회 오류:', error);
          throw new Error(error.message);
        }

        // 3. 결과 처리
        if (!result.success) {
          if (result.error === 'user_not_found') {
            router.push('/auth/login');
            return;
          }
          if (result.error === 'crew_not_verified') {
            router.push('/auth/verify-crew');
            return;
          }
          throw new Error(result.message || '알 수 없는 오류가 발생했습니다.');
        }

        // 4. 상태 업데이트
        const { userName, crewInfo, locationOptions, exerciseOptions } = result.data;
        
        setCurrentUser({
          id: user.id,
          name: userName
        });
        setCrewInfo(crewInfo);
        setLocationOptions(locationOptions);
        setExerciseOptions(exerciseOptions);
        
        // 5. 폼 데이터 설정
        setFormData(prev => ({ 
          ...prev, 
          name: userName,
          location: locationOptions[0]?.value || '',
          exerciseType: exerciseOptions[0]?.value || ''
        }));
        
      } catch (error) {
        //console.error('데이터 로딩 오류:', error);
        haptic.error();
        setNotificationType('error');
        setNotificationMessage('데이터를 불러오지 못했습니다.');
        setShowNotification(true);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, [supabase, router]);

  return (
    <div className="h-screen bg-basic-black flex flex-col overflow-hidden relative">
      {/* ⚡ 헤더 - 상단 고정 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <PageHeader title="출석 체크" iconColor="white" borderColor="gray-500" />
      </div>

      {/* ⚡ 메인 콘텐츠 - 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto native-scroll pt-[10vh] pb-[20vh] px-[4vw]">
          {isDataLoading ? (
            <FormSkeleton />
          ) : (
            <UltraFastForm
              formData={formData}
              onFormChange={handleFormChange}
              locationOptions={locationOptions}
              exerciseOptions={exerciseOptions}
            />
          )}
          <button  
          onClick={handleSubmit}
          disabled={isSubmitting || isDataLoading || !currentUser || (userStatus && !userStatus.isActive)}
          className={`mt-[2vh] p-[1vh] rounded-md transition-colors active:scale-95 native-shadow hw-accelerated hover:bg-white/10 w-full h-[7vh] font-bold text-white ${
            isSubmitting || isDataLoading || !currentUser || (userStatus && !userStatus.isActive)
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
          ) :  userStatus && !userStatus.isActive ? (
            "출석 불가"
          ) : (
            "출석 체크"
          )}
        </button>
      </div>

      {/* ⚡ 하단 버튼 - 하단 고정 */}

      




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
              // 출석 불가 상태의 에러 알림이면 홈으로 이동
              setTimeout(() => router.push('/'), 100);
            }
          }}
        />
      )}
    </div>
  );
};

export default UltraFastAttendanceTemplate; 