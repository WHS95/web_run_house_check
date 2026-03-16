'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/organisms/common/PageHeader';
import MonthNavigator from '@/components/molecules/MonthNavigator';
import RankingTabs, { TabItem } from '@/components/organisms/ranking/RankingTabs';
import RankingListItem from '@/components/organisms/ranking/RankingListItem';
import type { NotificationType } from '@/components/molecules/common/PopupNotification';
import BottomNavigation from '@/components/organisms/BottomNavigation';
import { haptic } from '@/lib/haptic';
import { fetchRankingData } from '@/app/ranking/actions';

const PopupNotification = React.lazy(() => import('@/components/molecules/common/PopupNotification'));

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

const RankingListSkeleton = React.memo(() => (
  <div className="pb-safe space-y-2">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="flex items-center px-4 h-14 rounded-rh-lg bg-rh-bg-surface animate-pulse">
        <div className="w-8 h-5 bg-rh-bg-muted rounded" />
        <div className="flex-1 ml-3">
          <div className="w-20 h-4 bg-rh-bg-muted rounded mb-1" />
          <div className="w-14 h-3 bg-rh-bg-muted rounded" />
        </div>
      </div>
    ))}
  </div>
));
RankingListSkeleton.displayName = 'RankingListSkeleton';

interface UltraFastRankingTemplateProps {
  initialData?: RankingData | null;
}

const UltraFastRankingTemplate: React.FC<UltraFastRankingTemplateProps> = ({ initialData }) => {
  const router = useRouter();

  const [currentData, setCurrentData] = useState<RankingData>(() => {
    if (initialData) {
      return {
        selectedYear: initialData.selectedYear,
        selectedMonth: initialData.selectedMonth,
        attendanceRanking: initialData.attendanceRanking || [],
        hostingRanking: initialData.hostingRanking || [],
        crewName: initialData.crewName
      };
    }
    return {
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth() + 1,
      attendanceRanking: [],
      hostingRanking: [],
      crewName: null
    };
  });

  const [activeTab, setActiveTab] = useState('attendance');
  const [isDataLoading, setIsDataLoading] = useState(!initialData);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<NotificationType | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  const tabs: TabItem[] = useMemo(() => [
    { id: 'attendance', label: '출석 랭킹' },
    { id: 'hosting', label: '개설 랭킹' }
  ], []);

  // 서버 액션을 재사용하여 월 변경 데이터 로딩
  const loadMonthData = useCallback(async (year: number, month: number) => {
    const result = await fetchRankingData(year, month);

    if (result.redirect) {
      router.push(result.redirect);
      return;
    }

    if (result.error || !result.data) {
      throw new Error(result.error || '데이터를 불러오지 못했습니다');
    }

    setCurrentData({
      selectedYear: result.data.selectedYear,
      selectedMonth: result.data.selectedMonth,
      attendanceRanking: result.data.attendanceRanking || [],
      hostingRanking: result.data.hostingRanking || [],
      crewName: result.data.crewName
    });
  }, [router]);

  const handlePrevMonth = useCallback(async () => {
    if (isDataLoading) return;
    haptic.light();
    setIsDataLoading(true);

    let newYear = currentData.selectedYear;
    let newMonth = currentData.selectedMonth - 1;
    if (newMonth < 1) { newMonth = 12; newYear -= 1; }

    try {
      await loadMonthData(newYear, newMonth);
    } catch {
      haptic.error();
      setNotificationType("error");
      setNotificationMessage("데이터를 불러오지 못했습니다");
      setShowNotification(true);
    } finally {
      setIsDataLoading(false);
    }
  }, [isDataLoading, currentData.selectedYear, currentData.selectedMonth, loadMonthData]);

  const handleNextMonth = useCallback(async () => {
    if (isDataLoading) return;
    haptic.light();
    setIsDataLoading(true);

    let newYear = currentData.selectedYear;
    let newMonth = currentData.selectedMonth + 1;
    if (newMonth > 12) { newMonth = 1; newYear += 1; }

    try {
      await loadMonthData(newYear, newMonth);
    } catch {
      haptic.error();
      setNotificationType("error");
      setNotificationMessage("데이터를 불러오지 못했습니다");
      setShowNotification(true);
    } finally {
      setIsDataLoading(false);
    }
  }, [isDataLoading, currentData.selectedYear, currentData.selectedMonth, loadMonthData]);

  const handleTabChange = useCallback((tabId: string) => {
    haptic.light();
    setActiveTab(tabId);
  }, []);

  const currentRankingData = useMemo(() =>
    activeTab === 'attendance' ? currentData.attendanceRanking : currentData.hostingRanking,
    [activeTab, currentData.attendanceRanking, currentData.hostingRanking]
  );

  const currentUserRank = useMemo(() =>
    currentRankingData.find((item) => item.is_current_user),
    [currentRankingData]
  );

  return (
    <div className="flex flex-col h-screen bg-rh-bg-primary text-white">
      <div className="shrink-0 bg-rh-bg-surface pt-safe">
        <PageHeader title="랭킹" iconColor="white" backgroundColor="bg-rh-bg-surface" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 scroll-area-bottom space-y-5">
        <MonthNavigator
          year={currentData.selectedYear}
          month={currentData.selectedMonth}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
          disabled={isDataLoading}
        />

        <RankingTabs
          tabs={tabs}
          activeTabId={activeTab}
          onTabChange={handleTabChange}
        />

        {isDataLoading ? (
          <RankingListSkeleton />
        ) : currentRankingData.length > 0 ? (
          <div className="space-y-2">
            {currentRankingData.map((item) => (
              <div key={item.user_id}>
                <RankingListItem
                  rank={item.rank}
                  name={item.name || '알 수 없음'}
                  score={item.value}
                  isCurrentUser={item.is_current_user}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 text-rh-text-secondary">
                <svg className="w-[4rem] h-[4rem] mx-auto opacity-50" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-rh-text-tertiary text-[1.125rem] font-medium">해당 월의 출석 데이터가 없습니다</p>
              <p className="text-rh-text-secondary text-[0.875rem] mt-2">다른 월을 확인해보세요</p>
            </div>
          </div>
        )}
      </div>

      {currentUserRank && (
        <div className="shrink-0 bg-rh-bg-surface border-t border-rh-border rounded-t-rh-lg px-4 py-3 flex items-center">
          <div className="w-8 flex items-center justify-center">
            <span className="font-bold text-sm text-rh-accent">
              {currentUserRank.rank}
            </span>
          </div>
          <div className="flex-1 ml-3">
            <span className="text-sm font-medium text-white">
              내 순위
            </span>
            <p className="text-xs text-rh-text-tertiary">
              {currentUserRank.name || '알 수 없음'} · 출석 {currentUserRank.value}회
            </p>
          </div>
        </div>
      )}

      <BottomNavigation />

      {notificationType && (
        <React.Suspense fallback={null}>
          <PopupNotification
            isVisible={showNotification}
            message={notificationMessage}
            type={notificationType}
            duration={1500}
            onClose={() => {
              setShowNotification(false);
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default UltraFastRankingTemplate;
