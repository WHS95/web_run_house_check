'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import PageHeader from '@/components/organisms/common/PageHeader';
import PopupNotification, { NotificationType } from '@/components/molecules/common/PopupNotification';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { haptic } from '@/lib/haptic';

// ⚡ 간단한 메모리 캐시
const cache = new Map();
const getCacheKey = (userId: string) => `attendance_data_${userId}`;

// ⚡ 캐시된 데이터 가져오기
const getCachedData = (userId: string) => {
  const key = getCacheKey(userId);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < 30000) { // 30초 캐시
    return cached.data;
  }
  return null;
};

// ⚡ 데이터 캐시 저장
const setCachedData = (userId: string, data: any) => {
  const key = getCacheKey(userId);
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

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
          <div className="relative">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => onFormChange('date', e.target.value)}
              className="ios-date-input"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

  // ⚡ 메모화된 스와이프 옵션
  const swipeOptions = useMemo(() => ({
    onSwipeRight: () => { haptic.medium(); router.push('/'); },
    onSwipeLeft: () => { haptic.medium(); router.push('/ranking'); },
    threshold: 80,
    hapticFeedback: true,
  }), [router]);

  const swipeRef = useSwipeGesture(swipeOptions);

  // ⚡ 프리로딩 효과 - 페이지 이동을 위한 리소스 미리 로드
  useEffect(() => {
    // 랭킹 페이지 프리로딩 (백그라운드에서)
    const preloadRanking = () => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = '/ranking';
      document.head.appendChild(link);
    };

    // 100ms 후 프리로딩 시작 (초기 렌더링에 영향 없도록)
    const timer = setTimeout(preloadRanking, 100);
    return () => clearTimeout(timer);
  }, []);

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

        // 2. 캐시된 데이터 확인
        const cachedData = getCachedData(session.user.id);
        if (cachedData) {
          setCurrentUser({
            id: session.user.id,
            name: cachedData.userName
          });
          setCrewInfo(cachedData.crewInfo);
          setLocationOptions(cachedData.locationOptions);
          setExerciseOptions(cachedData.exerciseOptions);
          setFormData(prev => ({ 
            ...prev, 
            name: cachedData.userName,
            location: cachedData.locationOptions[0]?.value || '',
            exerciseType: cachedData.exerciseOptions[0]?.value || ''
          }));
          setIsDataLoading(false);
          return;
        }

        // 3. 사용자 정보 로딩
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

        const userName = userData.first_name || session.user.email?.split('@')[0] || '사용자';
        setCurrentUser({
          id: session.user.id,
          name: userName
        });

        // 4. 크루 정보 및 옵션들 병렬 로딩
        const [crewRes, locationsRes, exerciseTypesRes] = await Promise.allSettled([
          supabase.schema('attendance').from('crews').select('id, name').eq('id', userData.verified_crew_id).single(),
          supabase.schema('attendance').from('crew_locations').select('id, name').eq('crew_id', userData.verified_crew_id).eq('is_active', true),
          supabase.schema('attendance').from('crew_exercise_types').select('exercise_type_id').eq('crew_id', userData.verified_crew_id)
        ]);

        let crewInfo = null;
        let locationOptions: any[] = [];
        let exerciseOptions: any[] = [];

        // 크루 정보 설정
        if (crewRes.status === 'fulfilled' && crewRes.value.data) {
          crewInfo = crewRes.value.data;
          setCrewInfo(crewInfo);
        }

        // 장소 옵션 설정
        if (locationsRes.status === 'fulfilled' && locationsRes.value.data) {
          locationOptions = locationsRes.value.data.map((loc: any) => ({
            value: loc.id.toString(),
            label: loc.name
          }));
          setLocationOptions(locationOptions);
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
            exerciseOptions = exercises.map((ex: any) => ({
              value: ex.id.toString(),
              label: ex.name
            }));
            setExerciseOptions(exerciseOptions);
          }
        }

        // 5. 폼 데이터 설정
        setFormData(prev => ({ 
          ...prev, 
          name: userName,
          location: locationOptions[0]?.value || '',
          exerciseType: exerciseOptions[0]?.value || ''
        }));
        
        // 6. 데이터 캐시에 저장
        setCachedData(session.user.id, {
          userName,
          crewInfo,
          locationOptions,
          exerciseOptions
        });
        
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
    <div 
      ref={swipeRef as any}
      className="h-screen bg-white flex flex-col overflow-hidden relative"
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
            className={`w-full h-14 rounded-2xl font-semibold text-white transition-all duration-200 active:scale-95 hw-accelerated ${
              isSubmitting || isDataLoading || !currentUser
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
      </div>

      {/* 스와이프 힌트 - 하단 버튼 위에 위치 */}
      <div className="fixed bottom-[100px] left-4 right-4 z-20 opacity-50 pb-safe">
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