'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import PageHeader from '@/components/organisms/common/PageHeader';
import RankingInfo from '@/components/organisms/ranking/RankingInfo';
import RankingTabs, { type TabItem } from '@/components/organisms/ranking/RankingTabs';
import RankingListHeader from '@/components/organisms/ranking/RankingListHeader';
import RankingListItem from '@/components/organisms/ranking/RankingListItem';
import PopupNotification, { NotificationType } from '@/components/molecules/common/PopupNotification';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { haptic } from '@/lib/haptic';
import { IoMdArrowDropleft, IoMdArrowDropright } from 'react-icons/io';

// ⚡ 데이터 타입 정의
export interface RankItem {
  user_id: string;
  rank: number;
  name: string | null;
  profile_image_url: string | null;
  value: number;
  is_current_user?: boolean;
}

export interface RankingData {
  selectedYear: number;
  selectedMonth: number;
  attendanceRanking: RankItem[];
  hostingRanking: RankItem[];
  crewName?: string | null;
}

// ⚡ 로딩 스피너 컴포넌트
const LoadingSpinner = React.memo(() => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

// ⚡ 심플한 랭킹 리스트 로딩 스피너
const RankingListSkeleton = React.memo(() => (
  <div className="flex-1 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-3 py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
      <p className="text-gray-500 text-sm">랭킹 데이터 로딩 중...</p>
    </div>
  </div>
));
RankingListSkeleton.displayName = 'RankingListSkeleton';

// ⚡ 즉시 상호작용 가능한 랭킹 리스트 컴포넌트
const UltraFastRankingList = React.memo<{
  rankingData: RankItem[];
  activeTab: string;
}>(({ rankingData, activeTab }) => {
  return (
    <div className="flex-1 overflow-y-auto native-scroll">
      <div className="pb-safe">
        {rankingData.map((item) => (
          <div 
            key={item.user_id}
            className="native-list-item"
          >
            <RankingListItem 
              rank={item.rank}
              name={item.name || '알 수 없음'}          
              score={item.value}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
UltraFastRankingList.displayName = 'UltraFastRankingList';

const UltraFastRankingTemplate = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ⚡ 현재 날짜 즉시 계산
  const currentDate = useMemo(() => {
    const now = new Date();
    const urlYear = searchParams.get('year');
    const urlMonth = searchParams.get('month');
    
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    
    if (urlYear) {
      const parsedYear = parseInt(urlYear, 10);
      if (!isNaN(parsedYear) && parsedYear >= 1900 && parsedYear <= 2200) {
        year = parsedYear;
      }
    }
    
    if (urlMonth) {
      const parsedMonth = parseInt(urlMonth, 10);
      if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        month = parsedMonth;
      }
    }
    
    return { year, month };
  }, [searchParams]);

  // ⚡ 상태 - 초기에는 빈 데이터로 시작
  const [currentData, setCurrentData] = useState<RankingData>({
    selectedYear: currentDate.year,
    selectedMonth: currentDate.month,
    attendanceRanking: [],
    hostingRanking: [],
    crewName: null,
  });
  const [activeTab, setActiveTab] = useState<string>('attendance');
  const [isMonthChanging, setIsMonthChanging] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true); // 초기에는 로딩 중
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<NotificationType | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  // ⚡ Supabase 클라이언트 (지연 생성)
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // ⚡ 탭 설정
  const tabs: TabItem[] = useMemo(() => [
    { id: 'attendance', label: '출석' },
    { id: 'hosting', label: '개설' },
  ], []);

  // ⚡ 데이터 로딩 함수
  const fetchRankingData = useCallback(async (year: number, month: number) => {
    try {
      // 1. 세션 확인
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      // 2. 실제 랭킹 데이터 로딩
      const response = await fetch(`/api/ranking?year=${year}&month=${month}`);
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setCurrentData(data);
      
      return data;
    } catch (error) {
      console.error('랭킹 데이터 로딩 오류:', error);
      throw error;
    }
  }, [supabase, router]);

  // ⚡ 초기 데이터 로딩
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchRankingData(currentDate.year, currentDate.month);
      } catch (error) {
        haptic.error();
        setNotificationType("error");
        setNotificationMessage("데이터를 불러오지 못했습니다");
        setShowNotification(true);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadInitialData();
  }, [fetchRankingData, currentDate.year, currentDate.month]);

  // ⚡ 월 변경 핸들러
  const handlePrevMonth = useCallback(async () => {
    if (isMonthChanging || isDataLoading) return;
    
    haptic.light();
    setIsMonthChanging(true);
    setIsDataLoading(true); // 즉시 로딩 상태 표시

    let newYear = currentData.selectedYear;
    let newMonth = currentData.selectedMonth - 1;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    // URL 즉시 업데이트 (사용자 피드백)
    router.push(`/ranking?year=${newYear}&month=${newMonth}`, { scroll: false });
    
    // 데이터 로딩
    try {
      await fetchRankingData(newYear, newMonth);
    } catch (error) {
      haptic.error();
      setNotificationType("error");
      setNotificationMessage("데이터를 불러오지 못했습니다");
      setShowNotification(true);
    } finally {
      setIsDataLoading(false);
      setIsMonthChanging(false);
    }
  }, [isMonthChanging, isDataLoading, currentData.selectedYear, currentData.selectedMonth, router, fetchRankingData]);

  const handleNextMonth = useCallback(async () => {
    if (isMonthChanging || isDataLoading) return;
    
    haptic.light();
    setIsMonthChanging(true);
    setIsDataLoading(true); // 즉시 로딩 상태 표시

    let newYear = currentData.selectedYear;
    let newMonth = currentData.selectedMonth + 1;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    // URL 즉시 업데이트 (사용자 피드백)
    router.push(`/ranking?year=${newYear}&month=${newMonth}`, { scroll: false });
    
    // 데이터 로딩
    try {
      await fetchRankingData(newYear, newMonth);
    } catch (error) {
      haptic.error();
      setNotificationType("error");
      setNotificationMessage("데이터를 불러오지 못했습니다");
      setShowNotification(true);
    } finally {
      setIsDataLoading(false);
      setIsMonthChanging(false);
    }
  }, [isMonthChanging, isDataLoading, currentData.selectedYear, currentData.selectedMonth, router, fetchRankingData]);

  // ⚡ 탭 변경 핸들러
  const handleTabChange = useCallback((tabId: string) => {
    haptic.light();
    setActiveTab(tabId);
  }, []);

  // ⚡ 스와이프 제스처
  const swipeOptions = useMemo(() => ({
    onSwipeRight: () => { haptic.medium(); router.push('/'); },
    onSwipeLeft: () => { haptic.medium(); router.push('/attendance'); },
    threshold: 80,
    hapticFeedback: true,
  }), [router]);

  const swipeRef = useSwipeGesture(swipeOptions);

  // ⚡ 현재 표시할 데이터 계산
  const currentRankingData = useMemo(() => 
    activeTab === 'attendance' ? currentData.attendanceRanking : currentData.hostingRanking,
    [activeTab, currentData.attendanceRanking, currentData.hostingRanking]
  );

  const dateForRankingInfo = useMemo(() => 
    `${currentData.selectedYear}-${currentData.selectedMonth.toString().padStart(2, '0')}-01`,
    [currentData.selectedYear, currentData.selectedMonth]
  );

  const placeholderCurrentRank = useMemo(() => 
    currentRankingData.find(item => item.is_current_user)?.rank || 0,
    [currentRankingData]
  );

  const placeholderTotalMembers = useMemo(() => 
    currentRankingData.length,
    [currentRankingData]
  );

  return (
    <div 
      ref={swipeRef as any}
      className="min-h-screen bg-[#223150] text-white flex flex-col native-scroll relative"
    >
      {/* ⚡ 상단 고정 영역 - 즉시 표시 */}
      <div className="flex-shrink-0 pt-safe">
        <div className="mb-4 bg-white">
          <PageHeader title="랭킹" iconColor="black" />
        </div>
        
        <div className="px-2">
          <div className="mb-6 mt-6 flex items-center justify-between">
            <button 
              onClick={handlePrevMonth} 
              className={`p-2 rounded-md transition-colors active:scale-95 native-shadow ${
                isMonthChanging || isDataLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-white/10'
              }`}
              aria-label="이전 달"
              disabled={isMonthChanging || isDataLoading}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isMonthChanging ? <LoadingSpinner /> : <IoMdArrowDropleft className="h-6 w-6" />}
            </button>
            
            <RankingInfo 
              date={dateForRankingInfo} 
              totalMembers={placeholderTotalMembers}
              currentRank={placeholderCurrentRank}
            />
            
            <button 
              onClick={handleNextMonth} 
              className={`p-2 rounded-md transition-colors active:scale-95 native-shadow ${
                isMonthChanging || isDataLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-white/10'
              }`}
              aria-label="다음 달"
              disabled={isMonthChanging || isDataLoading}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isMonthChanging ? <LoadingSpinner /> : <IoMdArrowDropright className="h-6 w-6" />}
            </button>
          </div>
          
          <RankingTabs 
            tabs={tabs} 
            activeTabId={activeTab} 
            onTabChange={handleTabChange}
          />
        </div>
      </div>
      
      {/* ⚡ 스크롤 가능한 랭킹 리스트 영역 */}
      <div className="flex-1 bg-white rounded-t-3xl text-black flex flex-col min-h-0 native-card">
        {/* 고정 헤더 */}
        <div className="flex-shrink-0">
          <RankingListHeader 
            headers={[
              '등수', 
              '프로필', 
              '이름', 
              activeTab === 'attendance' ? '출석횟수' : '개설횟수'
            ]} 
          />
        </div>
        
        {/* ⚡ 데이터 또는 로딩 스피너 표시 */}
        {isDataLoading ? (
          <RankingListSkeleton />
        ) : currentRankingData.length > 0 ? (
          <UltraFastRankingList 
            rankingData={currentRankingData}
            activeTab={activeTab}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center pb-safe">
            <div className="text-center">
              <div className="mb-4 text-gray-400">
                <svg className="w-16 h-16 mx-auto opacity-50" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium">해당 월의 랭킹 데이터가 없습니다</p>
              <p className="text-gray-400 text-sm mt-2">다른 월을 확인해보세요</p>
            </div>
          </div>
        )}
      </div>

      {/* 스와이프 힌트 */}
      <div className="absolute bottom-4 left-4 right-4 z-50 opacity-50 pb-safe">
        <div className="flex justify-between text-white text-xs">
          <div className="flex items-center space-x-1">
            <span>←</span>
            <span>홈</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>출석</span>
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
          }}
        />
      )}
    </div>
  );
};

export default UltraFastRankingTemplate; 