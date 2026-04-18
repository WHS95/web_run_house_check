'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/organisms/common/PageHeader';
import YearMonthSelector from '@/app/admin2/analyze/components/YearMonthSelector';
import RankingTabs, { TabItem } from '@/components/organisms/ranking/RankingTabs';
import RankingListItem from '@/components/organisms/ranking/RankingListItem';
import type { NotificationType } from '@/components/molecules/common/PopupNotification';

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

  const handleMonthChange = useCallback(async (newYear: number, newMonth: number) => {
    if (isDataLoading) return;
    if (newYear === currentData.selectedYear && newMonth === currentData.selectedMonth) return;
    haptic.light();
    setIsDataLoading(true);

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

  // 실제 데이터 존재 여부: 값이 0보다 큰 항목이 하나라도 있어야 데이터가 있다고 판단
  const hasRealData = useMemo(() =>
    currentRankingData.some((item) => item.value > 0),
    [currentRankingData]
  );

  const visibleRankingData = useMemo(() =>
    hasRealData ? currentRankingData.filter((item) => item.value > 0) : [],
    [hasRealData, currentRankingData]
  );

  const currentUserRank = useMemo(() =>
    hasRealData ? visibleRankingData.find((item) => item.is_current_user) : undefined,
    [hasRealData, visibleRankingData]
  );

  // 현재 유저의 출석/개설 정보 (값이 0인 경우 undefined 처리)
  const currentUserAttendance = useMemo(() => {
    const item = currentData.attendanceRanking.find((i) => i.is_current_user);
    return item && item.value > 0 ? item : undefined;
  }, [currentData.attendanceRanking]);

  const currentUserHosting = useMemo(() => {
    const item = currentData.hostingRanking.find((i) => i.is_current_user);
    return item && item.value > 0 ? item : undefined;
  }, [currentData.hostingRanking]);

  const [showScrollTop, setShowScrollTop] = useState(false);

  // .main-content(루트 레이아웃 스크롤 영역) 스크롤 감지
  React.useEffect(() => {
    const el = document.querySelector('.main-content');
    if (!el) return;
    const onScroll = () => {
      setShowScrollTop((el as HTMLElement).scrollTop > 200);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    haptic.light();
    const el = document.querySelector('.main-content') as HTMLElement | null;
    el?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen bg-rh-bg-primary text-white">
      <PageHeader title="랭킹" iconColor="white" backgroundColor="bg-rh-bg-surface" />


      {/* 년월 선택 (admin2/analyze와 동일 컴포넌트 — 스크롤 시 자동 축소) */}
      <YearMonthSelector
        year={currentData.selectedYear}
        month={currentData.selectedMonth}
        onChange={handleMonthChange}
        disabled={isDataLoading}
      />

      {/* 랭킹 탭 */}
      <div className="px-4 pb-3">
        <RankingTabs
          tabs={tabs}
          activeTabId={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* 리스트 */}
      <div className="flex-1 px-4 space-y-2">
        <div className={isDataLoading
          ? "opacity-50 pointer-events-none transition-opacity"
          : "transition-opacity"
        }>
          {/* 내 순위 카드 — top 3 이내면 리스트 상단에 이미 하이라이트되므로 중복 숨김 */}
          {currentUserRank && currentUserRank.rank > 3 && (
            <div className="flex items-center gap-3 px-4 h-14 rounded-xl bg-rh-accent/[0.1] border border-rh-accent/30 mb-2">
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
                  출석 {currentUserAttendance?.value ?? 0}회 · 개설 {currentUserHosting?.value ?? 0}회 · 총 {visibleRankingData.length}명 중
                </p>
              </div>
              <Trophy className="w-[18px] h-[18px] text-rh-accent" />
            </div>
          )}

          {visibleRankingData.length > 0 ? (
            <div className="space-y-2">
              {visibleRankingData.map((item) => (
                <RankingListItem
                  key={item.user_id}
                  rank={item.rank}
                  name={item.name || '알 수 없음'}
                  score={item.value}
                  isCurrentUser={item.is_current_user}
                  scoreLabel={activeTab === 'hosting' ? '개설' : '출석'}
                />
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
      </div>

      {/* Scroll to Top FAB — sticky 패턴 (fixed 금지) */}
      <div className="sticky bottom-4 z-20 flex justify-end px-4 pointer-events-none h-0">
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              onClick={scrollToTop}
              className="pointer-events-auto -translate-y-full w-10 h-10 rounded-full bg-rh-bg-surface/90 backdrop-blur-sm border border-rh-border shadow-lg flex items-center justify-center active:scale-90 transition-transform"
              aria-label="맨 위로"
            >
              <ChevronUp className="w-5 h-5 text-rh-text-secondary" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

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
