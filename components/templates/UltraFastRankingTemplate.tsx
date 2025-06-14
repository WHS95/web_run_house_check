'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import PageHeader from '@/components/organisms/common/PageHeader';
import RankingInfo from '@/components/organisms/ranking/RankingInfo';
import RankingTabs, { TabItem } from '@/components/organisms/ranking/RankingTabs';
import RankingListHeader from '@/components/organisms/ranking/RankingListHeader';
import RankingListItem from '@/components/organisms/ranking/RankingListItem';
import PopupNotification, { NotificationType } from '@/components/molecules/common/PopupNotification';
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

// ⚡ 랭킹 리스트 로딩 스켈레톤
const RankingListSkeleton = React.memo(() => (
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
  
  // ⚡ 상태 최적화 - 필요한 것만 분리
  const [currentData, setCurrentData] = useState<RankingData>({
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth() + 1,
    attendanceRanking: [],
    hostingRanking: [],
    crewName: null
  });
  
  const [activeTab, setActiveTab] = useState('attendance');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<NotificationType | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  // ⚡ Supabase 클라이언트 (한 번만 생성)
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // ⚡ 탭 설정
  const tabs: TabItem[] = useMemo(() => [
    { id: 'attendance', label: '출석 랭킹' },
    { id: 'hosting', label: '개설 랭킹' }
  ], []);

  // ⚡ 메모화된 데이터 로딩 함수 - 통합 함수 사용으로 대폭 간소화
  const fetchRankingData = useCallback(async (year: number, month: number) => {
    try {
      // 1. 세션 확인
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      // 2. 통합 랭킹 데이터 조회 (5번 통신 → 1번 통신)
      const { data: result, error } = await supabase.schema('attendance').rpc('get_ranking_data_unified', {
        p_user_id: session.user.id,
        target_year: year,
        target_month: month
      });

      if (error) {
        console.error('랭킹 데이터 조회 오류:', error);
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

      // 4. 상태 업데이트 (기존과 동일한 형태)
      setCurrentData({
        selectedYear: result.data.selectedYear,
        selectedMonth: result.data.selectedMonth,
        attendanceRanking: result.data.attendanceRanking || [],
        hostingRanking: result.data.hostingRanking || [],
        crewName: result.data.crewName
      });

    } catch (error) {
      console.error('랭킹 데이터 로딩 오류:', error);
      throw error;
    }
  }, [supabase, router]);

  // ⚡ 초기 데이터 로딩
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const year = parseInt(searchParams.get('year') || '') || new Date().getFullYear();
        const month = parseInt(searchParams.get('month') || '') || new Date().getMonth() + 1;
        
        await fetchRankingData(year, month);
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
  }, [searchParams, fetchRankingData]);

  // ⚡ 월 변경 핸들러들 - URL 업데이트 제거로 간소화
  const handlePrevMonth = useCallback(async () => {
    if (isDataLoading) return;
    
    haptic.light();
    setIsDataLoading(true);

    let newYear = currentData.selectedYear;
    let newMonth = currentData.selectedMonth - 1;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    // 데이터 로딩만 수행 (URL 업데이트 제거)
    try {
      await fetchRankingData(newYear, newMonth);
    } catch (error) {
      haptic.error();
      setNotificationType("error");
      setNotificationMessage("데이터를 불러오지 못했습니다");
      setShowNotification(true);
    } finally {
      setIsDataLoading(false);
    }
  }, [isDataLoading, currentData.selectedYear, currentData.selectedMonth, fetchRankingData]);

  const handleNextMonth = useCallback(async () => {
    if (isDataLoading) return;
    
    haptic.light();
    setIsDataLoading(true);

    let newYear = currentData.selectedYear;
    let newMonth = currentData.selectedMonth + 1;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    // 데이터 로딩만 수행 (URL 업데이트 제거)
    try {
      await fetchRankingData(newYear, newMonth);
    } catch (error) {
      haptic.error();
      setNotificationType("error");
      setNotificationMessage("데이터를 불러오지 못했습니다");
      setShowNotification(true);
    } finally {
      setIsDataLoading(false);
    }
  }, [isDataLoading, currentData.selectedYear, currentData.selectedMonth, fetchRankingData]);

  // ⚡ 탭 변경 핸들러
  const handleTabChange = useCallback((tabId: string) => {
    haptic.light();
    setActiveTab(tabId);
  }, []);

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
    <div className="h-screen bg-basic-black text-white flex flex-col overflow-hidden relative">
      {/* ⚡ 헤더 - 상단 고정 */}
      <div className="fixed top-0 left-0 right-0 bg-basic-black-gray z-30 pt-safe shadow-sm">
        <PageHeader title="랭킹" iconColor="black" backgroundColor="bg-basic-black-gray" />
      </div>

      {/* ⚡ RankingInfo- 고정 */}
      <div className="fixed top-[55px] left-0 right-0 bg-basic-black z-20">
        <div className="px-2 pb-4">
          <div className="mb-6 mt-6 flex items-center justify-between">
            <button 
              onClick={handlePrevMonth} 
              className={`p-2 rounded-md transition-colors active:scale-95 native-shadow hw-accelerated ${
                isDataLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-white/10'
              }`}
              aria-label="이전 달"
              disabled={isDataLoading}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <IoMdArrowDropleft className="h-6 w-6" />
            </button>
            
            <RankingInfo 
              date={dateForRankingInfo} 
              totalMembers={placeholderTotalMembers}
              currentRank={placeholderCurrentRank}
            />
            
            <button 
              onClick={handleNextMonth} 
              className={`p-2 rounded-md transition-colors active:scale-95 native-shadow hw-accelerated ${
                isDataLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-white/10'
              }`}
              aria-label="다음 달"
              disabled={isDataLoading}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <IoMdArrowDropright className="h-6 w-6" />
            </button>
          </div>
          
          <RankingTabs 
            tabs={tabs} 
            activeTabId={activeTab} 
            onTabChange={handleTabChange}
          />
        </div>
        
        {/* ⚡ 고정된 랭킹 리스트 헤더 */}
        <div className="bg-white border-t border-gray-200">
          <RankingListHeader 
            headers={[
              '등수', 
              '프로필', 
              '이름', 
              activeTab === 'attendance' ? '출석횟수' : '개설횟수'
            ]} 
          />
        </div>
      </div>
      
      {/* ⚡ 스크롤 가능한 랭킹 리스트 영역 */}
      <div className="flex-1 bg-white text-black flex flex-col mt-[300px]  hw-accelerated">
        {/* ⚡ 데이터 또는 로딩 스피너 표시 */}
        <div className="flex-1 overflow-y-auto native-scroll">
          {isDataLoading ? (
            <RankingListSkeleton />
          ) : currentRankingData.length > 0 ? (
            <UltraFastRankingList 
              rankingData={currentRankingData}
              activeTab={activeTab}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center pb-safe min-h-[400px]">
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