'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import PageHeader from '@/components/organisms/common/PageHeader';
import PopupNotification, { NotificationType } from '@/components/molecules/common/PopupNotification';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { haptic } from '@/lib/haptic';

const LoadingSpinner = React.memo(() => (
  <div className="animate-spin rounded-full h-6 w-6 border-2 border-basic-blue border-t-transparent"></div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

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
          <input
            type="date"
            value={formData.date}
            onChange={(e) => onFormChange('date', e.target.value)}
            className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
          <div className="relative">
            <select
              value={formData.time}
              onChange={(e) => onFormChange('time', e.target.value)}
              className="w-full h-12 bg-white border border-gray-200 rounded-xl pl-4 pr-10 text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
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
            className="w-full h-12 bg-white border border-gray-200 rounded-xl pl-4 pr-10 text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
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
            className="w-full h-12 bg-white border border-gray-200 rounded-xl pl-4 pr-10 text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
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
  
  // ⚡ 상태
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [crewInfo, setCrewInfo] = useState<any>(null);
  const [locationOptions, setLocationOptions] = useState<any[]>([]);
  const [exerciseOptions, setExerciseOptions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true); // 초기에는 로딩 중
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<NotificationType | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // ⚡ 폼 데이터 (초기값은 로딩 후 설정)
  const [formData, setFormData] = useState({
    name: '',
    date: getTodayString(),
    time: getCurrentTime(),
    location: '',
    exerciseType: '',
    isHost: '아니오',
  });

  // ⚡ Supabase 클라이언트 (지연 생성)
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // ⚡ 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth/login');
          return;
        }

        // 2. 사용자 정보 로딩
        const { data: userData, error: userError } = await supabase
          .schema('attendance')
          .from('users')
          .select('first_name, verified_crew_id, is_crew_verified')
          .eq('id', session.user.id)
          .single();

        if (userError || !userData?.is_crew_verified || !userData.verified_crew_id) {
          router.push('/auth/verify-crew');
          return;
        }

        setCurrentUser({
          id: session.user.id,
          name: userData.first_name || session.user.email?.split('@')[0] || '사용자'
        });

        // 3. 크루 정보 및 옵션들 병렬 로딩
        const [crewRes, locationsRes, exerciseTypesRes] = await Promise.allSettled([
          supabase.schema('attendance').from('crews').select('id, name').eq('id', userData.verified_crew_id).single(),
          supabase.schema('attendance').from('crew_locations').select('id, name').eq('crew_id', userData.verified_crew_id).eq('is_active', true),
          supabase.schema('attendance').from('crew_exercise_types').select('exercise_type_id').eq('crew_id', userData.verified_crew_id)
        ]);

        // 크루 정보 설정
        if (crewRes.status === 'fulfilled' && crewRes.value.data) {
          setCrewInfo(crewRes.value.data);
        }

        // 장소 옵션 설정
        if (locationsRes.status === 'fulfilled' && locationsRes.value.data) {
          const locations = locationsRes.value.data.map((loc: any) => ({
            value: loc.id.toString(),
            label: loc.name
          }));
          setLocationOptions(locations);
          if (locations.length > 0) {
            setFormData(prev => ({ ...prev, location: locations[0].value }));
          }
        }

        // 운동 종류 옵션 설정
        if (exerciseTypesRes.status === 'fulfilled' && exerciseTypesRes.value.data && exerciseTypesRes.value.data.length > 0) {
          const exerciseTypeIds = exerciseTypesRes.value.data.map((item: any) => item.exercise_type_id);
          const { data: exercises } = await supabase
            .schema('attendance')
            .from('exercise_types')
            .select('id, name')
            .in('id', exerciseTypeIds);

          if (exercises) {
            const exerciseOptions = exercises.map((ex: any) => ({
              value: ex.id.toString(),
              label: ex.name
            }));
            setExerciseOptions(exerciseOptions);
            if (exerciseOptions.length > 0) {
              setFormData(prev => ({ ...prev, exerciseType: exerciseOptions[0].value }));
            }
          }
        }

        // 사용자 이름 설정
        setFormData(prev => ({ ...prev, name: userData.first_name || '사용자' }));
        
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

  // ⚡ 폼 데이터 변경 핸들러
  const handleFormChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // ⚡ 출석 제출
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

  // ⚡ 스와이프 제스처
  const swipeOptions = useMemo(() => ({
    onSwipeRight: () => { haptic.medium(); router.push('/'); },
    onSwipeLeft: () => { haptic.medium(); router.push('/ranking'); },
    threshold: 80,
    hapticFeedback: true,
  }), [router]);

  const swipeRef = useSwipeGesture(swipeOptions);

  return (
    <div 
      ref={swipeRef as any}
      className="min-h-screen bg-white flex flex-col native-scroll relative"
    >
      {/* 제출 로딩 오버레이 */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center space-y-3">
            <LoadingSpinner />
            <p className="text-gray-700 text-sm font-medium">출석 처리 중...</p>
          </div>
        </div>
      )}

      {/* ⚡ 헤더 - 즉시 표시 */}
      <div className="flex-shrink-0 pt-safe">
        <div className="mb-4">
          <PageHeader title="출석 체크" iconColor="black" borderColor="border-[#EAEAF3]" />
        </div>
      </div>

      {/* ⚡ 메인 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 native-scroll">
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

      {/* ⚡ 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-[#EAEAF3] bg-white shadow-lg z-40 pb-safe">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isDataLoading}
          className={`w-full h-14 rounded-2xl font-semibold text-white transition-all duration-200 active:scale-95 ${
            isSubmitting || isDataLoading
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-basic-blue hover:bg-blue-600'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner />
              <span>처리 중...</span>
            </div>
          ) : isDataLoading ? (
            "데이터 로딩 중..."
          ) : (
            "출석 체크"
          )}
        </button>
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