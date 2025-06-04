"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/organisms/common/PageHeader';
import RankingInfo from '@/components/organisms/ranking/RankingInfo';
import RankingTabs, { type TabItem } from '@/components/organisms/ranking/RankingTabs';
import RankingListHeader from '@/components/organisms/ranking/RankingListHeader';
import RankingListItem from '@/components/organisms/ranking/RankingListItem';
import PullToRefresh from '@/components/molecules/PullToRefresh';
import PopupNotification, { NotificationType } from '@/components/molecules/common/PopupNotification';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { haptic } from '@/lib/haptic';
import { IoMdArrowDropleft, IoMdArrowDropright} from 'react-icons/io';

// 데이터 타입 정의
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

interface EnhancedRankingTemplateProps {
  initialData?: RankingData;
  onMonthChange?: (direction: 'prev' | 'next') => void;
}

// 로딩 스피너 컴포넌트
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
  </div>
);

// 랭킹 리스트 로딩 스켈레톤
const RankingListSkeleton: React.FC = () => (
  <div className="flex-1 overflow-y-auto native-scroll">
    <div className="pb-safe space-y-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center p-4 animate-pulse">
          <div className="w-8 h-6 bg-gray-200 rounded mr-4"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
          </div>
          <div className="w-12 h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

const EnhancedRankingTemplate: React.FC<EnhancedRankingTemplateProps> = ({ 
  initialData, 
  onMonthChange 
}) => {
  const router = useRouter();
  
  // 기본값 설정
  const defaultYear = new Date().getFullYear();
  const defaultMonth = new Date().getMonth() + 1;
  const defaultCrewName = "크루";

  // 데이터 상태
  const [currentData, setCurrentData] = useState<RankingData>(initialData || {
    selectedYear: defaultYear,
    selectedMonth: defaultMonth,
    attendanceRanking: [],
    hostingRanking: [],
    crewName: defaultCrewName,
  });

  // 로딩 상태들
  const [isMonthChanging, setIsMonthChanging] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('attendance');
  
  // 알림 상태
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<NotificationType | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  const tabs: TabItem[] = [
    { id: 'attendance', label: '출석' },
    { id: 'hosting', label: '개설' },
  ];

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

  // 월 데이터 페칭 함수
  const fetchMonthData = useCallback(async (year: number, month: number) => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/ranking?year=${year}&month=${month}`);
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setCurrentData(data);
      
      // 성공 시 햅틱 피드백
      haptic.light();
      setNotificationType("success");
      setNotificationMessage("데이터를 업데이트했습니다");
      setShowNotification(true);
    } catch (error) {
      console.error('월 데이터 페칭 오류:', error);
      // 에러 시 진동 피드백
      haptic.error();
      setNotificationType("error");
      setNotificationMessage("데이터를 불러오지 못했습니다");
      setShowNotification(true);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

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
    disabled: isDataLoading || isMonthChanging,
  });

  // 스와이프 제스처 기능
  const swipeRef = useSwipeGesture({
    onSwipeRight: handleSwipeToHome,
    onSwipeLeft: () => {
      // 추후 다른 기능 추가 시 사용
      haptic.light();
    },
    threshold: 80,
    hapticFeedback: true,
  });

  // ref를 모두 동일한 element에 연결하는 콜백
  const setRefs = useCallback((element: HTMLDivElement | null) => {
    // containerRef에 할당 (타입 체크 추가)
    if (containerRef && 'current' in containerRef) {
      (containerRef as any).current = element;
    }
    // swipeRef에 할당 (타입 체크 추가) 
    if (swipeRef && 'current' in swipeRef) {
      (swipeRef as any).current = element;
    }
  }, [containerRef, swipeRef]);

  const handlePrevMonth = async () => {
    if (isMonthChanging || isDataLoading) return;
    
    haptic.light();
    setIsMonthChanging(true);

    let newYear = currentData.selectedYear;
    let newMonth = currentData.selectedMonth - 1;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    // URL 즉시 업데이트 (사용자 피드백)
    router.push(`/ranking?year=${newYear}&month=${newMonth}`, { scroll: false });
    
    // 데이터 페칭
    try {
      await fetchMonthData(newYear, newMonth);
    } catch (error) {
      // 에러는 fetchMonthData에서 처리됨
    } finally {
      setIsMonthChanging(false);
    }
  };

  const handleNextMonth = async () => {
    if (isMonthChanging || isDataLoading) return;
    
    haptic.light();
    setIsMonthChanging(true);

    let newYear = currentData.selectedYear;
    let newMonth = currentData.selectedMonth + 1;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    // URL 즉시 업데이트 (사용자 피드백)
    router.push(`/ranking?year=${newYear}&month=${newMonth}`, { scroll: false });
    
    // 데이터 페칭
    try {
      await fetchMonthData(newYear, newMonth);
    } catch (error) {
      // 에러는 fetchMonthData에서 처리됨
    } finally {
      setIsMonthChanging(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    haptic.light();
    setActiveTab(tabId);
  };

  const currentRankingData = activeTab === 'attendance' ? currentData.attendanceRanking : currentData.hostingRanking;
  const activeTabLabel = tabs.find(tab => tab.id === activeTab)?.label || "랭킹";

  const dateForRankingInfo = `${currentData.selectedYear}-${currentData.selectedMonth.toString().padStart(2, '0')}-01`;
  const placeholderCurrentRank = currentRankingData.find(item => item.is_current_user)?.rank || 0;
  const placeholderTotalMembers = currentRankingData.length;

  return (
    <div 
      ref={setRefs}
      className="min-h-screen bg-[#223150] text-white flex flex-col native-scroll relative"
    >
      {/* 풀 투 리프레시 인디케이터 */}
      <PullToRefresh
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        isTriggered={isTriggered}
        style={refreshIndicatorStyle}
      />

      {/* 상단 고정 영역 - 안전 영역 고려 */}
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
      
      {/* 스크롤 가능한 랭킹 리스트 영역 */}
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
        
        {/* 스크롤 가능한 랭킹 아이템들 */}
        {isDataLoading ? (
          <RankingListSkeleton />
        ) : currentRankingData.length > 0 ? (
          <div className="flex-1 overflow-y-auto native-scroll">
            <div className="pb-safe">
              {currentRankingData.map((item) => (
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
        ) : (
          <div className="flex-1 flex items-center justify-center pb-safe">
            <div className="text-center">
              <div className="mb-4 text-gray-400">
                <svg className="w-16 h-16 mx-auto opacity-50" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium">해당 월의 랭킹 데이터가 없습니다</p>
              <p className="text-gray-400 text-sm mt-2">아래로 당겨서 새로고침해보세요</p>
            </div>
          </div>
        )}
      </div>

      {/* 스와이프 힌트 */}
      <div className="absolute bottom-4 left-4 z-50 opacity-50 pb-safe">
        <div className="flex items-center space-x-1 text-white text-xs">
          <span>→</span>
          <span>스와이프</span>
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

export default EnhancedRankingTemplate; 