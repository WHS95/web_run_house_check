'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setShowScrollTop(scrollRef.current.scrollTop > 200);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    haptic.light();
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="flex flex-col h-screen bg-rh-bg-primary text-white">
      <div className="shrink-0 bg-rh-bg-surface pt-safe">
        <PageHeader title="랭킹" iconColor="white" backgroundColor="bg-rh-bg-surface" />
      </div>

      {/* Sticky 영역: 스크롤 밖 */}
      <div className="shrink-0 sticky top-0 z-10 bg-rh-bg-primary/80 backdrop-blur-xl px-4 pt-4 pb-3 space-y-3 relative">
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
        {/* 하단 그라데이션 섀도우 */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-b from-rh-bg-primary/40 to-transparent pointer-events-none translate-y-full" />
      </div>

      {/* 스크롤 영역: 리스트만 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pt-2 scroll-area-bottom space-y-2"
      >
        {/* 내 순위 카드 */}
        {currentUserRank && !isDataLoading && (
          <div className="flex items-center gap-3 px-4 h-14 rounded-xl bg-rh-accent/[0.1] border border-rh-accent/30">
            <div className="w-8 h-8 rounded-lg bg-rh-accent/20 flex items-center justify-center">
              <span className="font-bold text-base text-rh-accent">
                {currentUserRank.rank}
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white">
                  {currentUserRank.name || '알 수 없음'}
                </span>
                <span className="bg-rh-accent text-white text-[10px] rounded-full px-1.5 leading-4">
                  나
                </span>
              </div>
              <p className="text-xs text-rh-text-tertiary">
                출석 {currentUserRank.value}회 · 총 {currentRankingData.length}명 중
              </p>
            </div>
            <Trophy className="w-[18px] h-[18px] text-rh-accent" />
          </div>
        )}

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

      {/* Scroll to Top FAB */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed right-4 bottom-24 z-20 w-10 h-10 rounded-full bg-rh-bg-surface/90 backdrop-blur-sm border border-rh-border shadow-lg flex items-center justify-center active:scale-90 transition-transform"
            aria-label="맨 위로"
          >
            <ChevronUp className="w-5 h-5 text-rh-text-secondary" />
          </motion.button>
        )}
      </AnimatePresence>

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
