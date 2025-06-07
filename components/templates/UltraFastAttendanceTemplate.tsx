'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import PageHeader from '@/components/organisms/common/PageHeader';
import PopupNotification, { NotificationType } from '@/components/molecules/common/PopupNotification';
import { haptic } from '@/lib/haptic';

// ⚡ 심플한 폼 로딩 스켈레톤
const FormSkeleton = React.memo(() => (
  <div className="space-y-6 animate-pulse">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index}>
        <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
        <div className="h-12 bg-gray-100 rounded-xl"></div>
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
  const today = new Date();
  return today.toISOString().split('T')[0];
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
  
  return (
    <div className="space-y-6">
      {/* 이름 */}
      <div>
        <label className="block mb-3 text-sm font-semibold text-gray-800">이름</label>
        <div className="h-12 bg-gray-100 rounded-xl flex items-center px-4">
          <span className="text-gray-700 font-medium">{formData.name}</span>
        </div>
      </div>

      {/* 참여일시 */}
      <div>
        <label className="block mb-3 text-sm font-semibold text-gray-800">참여일시</label>
        <div className="space-y-3">
          <div className="relative">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => onFormChange('date', e.target.value)}
              className="ios-date-input"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="relative">
            <select
              value={formData.time}
              onChange={(e) => onFormChange('time', e.target.value)}
              className="ios-select"
            >
              {TIME_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 장소 */}
      <div>
        <label className="block mb-3 text-sm font-semibold text-gray-800">참여 장소</label>
        <div className="relative">
          <select
            value={formData.location}
            onChange={(e) => onFormChange('location', e.target.value)}
            className="ios-select"
          >
            {locationOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* 운동 종류 */}
      <div>
        <label className="block mb-3 text-sm font-semibold text-gray-800">운동 종류</label>
        <div className="relative">
          <select
            value={formData.exerciseType}
            onChange={(e) => onFormChange('exerciseType', e.target.value)}
            className="ios-select"
          >
            {exerciseOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* 개설자 여부 */}
      <div>
        <label className="block mb-3 text-sm font-semibold text-gray-800">개설자 여부</label>
        <div className="flex space-x-4">
          {HOST_OPTIONS.map(option => (
            <label key={option.value} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="isHost"
                value={option.value}
                checked={formData.isHost === option.value}
                onChange={(e) => onFormChange('isHost', e.target.value)}
                className="mr-2 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-gray-700">{option.label}</span>
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
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // ⚡ 메모화된 제출 핸들러
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !currentUser || !crewInfo) return;

    setIsSubmitting(true);
    haptic.medium();

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
  }, [isSubmitting, currentUser, crewInfo, formData]);

  // ⚡ 데이터 로딩 - 통합 함수 사용으로 대폭 간소화
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth/login');
          return;
        }

        // 2. 통합 폼 데이터 조회 (5번 통신 → 1번 통신)
        const { data: result, error } = await supabase.schema('attendance').rpc('get_attendance_form_data', {
          p_user_id: session.user.id
        });

        if (error) {
          console.error('폼 데이터 조회 오류:', error);
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
          id: session.user.id,
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
        console.error('데이터 로딩 오류:', error);
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
    <div className="h-screen bg-white flex flex-col overflow-hidden relative">
      {/* 제출 로딩 오버레이 */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-basic-blue border-t-transparent"></div>
            <p className="text-gray-700 text-sm font-medium">출석 처리 중...</p>
          </div>
        </div>
      )}

      {/* ⚡ 헤더 - 상단 고정 */}
      <div className="fixed top-0 left-0 right-0 bg-white z-30 pt-safe border-b border-[#EAEAF3] shadow-sm">
        <PageHeader title="출석 체크" iconColor="black" borderColor="border-transparent" />
      </div>

      {/* ⚡ 메인 콘텐츠 - 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto native-scroll pt-[80px] pb-[100px] px-4">
        <div className="pt-6">
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
        </div>
      </div>

      {/* ⚡ 하단 버튼 - 하단 고정 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EAEAF3] shadow-lg z-30 pb-safe">
        <div className="p-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isDataLoading || !currentUser}
            className={`p-2 rounded-md transition-colors active:scale-95 native-shadow hw-accelerated hover:bg-white/10 w-full h-14 font-semibold text-white ${
              isSubmitting || isDataLoading || !currentUser
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-basic-blue hover:bg-blue-600'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                <span>처리 중...</span>
              </div>
            ) : isDataLoading ? (
              "데이터 로딩 중..."
            ) : (
              "출석 체크"
            )}
          </button>
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
            if (notificationType === 'success') {
              setTimeout(() => router.push('/ranking'), 100);
            }
          }}
        />
      )}
    </div>
  );
};

export default UltraFastAttendanceTemplate; 