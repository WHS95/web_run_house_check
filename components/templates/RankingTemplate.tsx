"use client";

import React, { useState } from 'react';
import PageHeader from '@/components/organisms/common/PageHeader';
import RankingInfo from '@/components/organisms/ranking/RankingInfo';
import RankingTabs, { type TabItem } from '@/components/organisms/ranking/RankingTabs';
import RankingListHeader from '@/components/organisms/ranking/RankingListHeader';
import RankingListItem from '@/components/organisms/ranking/RankingListItem';
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';
import { IoMdArrowDropleft, IoMdArrowDropright} from 'react-icons/io';

// 데이터 타입 정의 (app/ranking/page.tsx의 정의와 일치 또는 공유 타입으로 분리 권장)
export interface RankItem {
  user_id: string;
  rank: number;
  name: string | null;
  profile_image_url: string | null;
  value: number; // 출석 횟수 또는 주최 횟수
  is_current_user?: boolean;
}

export interface RankingData {
  selectedYear: number;
  selectedMonth: number;
  attendanceRanking: RankItem[];
  hostingRanking: RankItem[];
  crewName?: string | null;
  // currentUserName?: string; // 필요시 추가
  // currentUserRank?: { attendance: number | null; hosting: number | null; }; // 필요시 추가
}

interface RankingTemplateProps {
  initialData?: RankingData; // initialData를 optional로 하여 page.tsx가 아직 준비 안됐을때도 오류 안나도록
  onMonthChange?: (direction: 'prev' | 'next') => void; // 월 변경 콜백 추가
}

const RankingTemplate: React.FC<RankingTemplateProps> = ({ initialData, onMonthChange }) => {
  // initialData가 없을 경우를 대비한 기본값 설정 또는 로딩 상태 표시
  const defaultYear = new Date().getFullYear(); // 기본 연도를 현재 연도로 변경
  const defaultMonth = new Date().getMonth() + 1; // 기본 월을 현재 월로 변경
  const defaultCrewName = "크루";

  const selectedYear = initialData?.selectedYear || defaultYear;
  const selectedMonth = initialData?.selectedMonth || defaultMonth;
  const crewName = initialData?.crewName || defaultCrewName;
  const attendanceRanking = initialData?.attendanceRanking || [];
  const hostingRanking = initialData?.hostingRanking || [];

  const [activeTab, setActiveTab] = useState<string>('attendance'); // 탭 ID (문자열)로 상태 관리

  const tabs: TabItem[] = [
    { id: 'attendance', label: '출석' },
    { id: 'hosting', label: '개설' },
  ];

  const handlePrevMonth = () => {
    // console.log("이전 달 클릭 - 기능 구현 필요 (현재 2025-05 고정)");
    if (onMonthChange) {
      onMonthChange('prev');
    } else {
      console.warn("onMonthChange prop is not provided to RankingTemplate");
    }
  };
  const handleNextMonth = () => {
    // console.log("다음 달 클릭 - 기능 구현 필요 (현재 2025-05 고정)");
    if (onMonthChange) {
      onMonthChange('next');
    } else {
      console.warn("onMonthChange prop is not provided to RankingTemplate");
    }
  };

  const currentRankingData = activeTab === 'attendance' ? attendanceRanking : hostingRanking;
  const activeTabLabel = tabs.find(tab => tab.id === activeTab)?.label || "랭킹";

  // RankingInfo에 전달할 props 구성
  // RankingInfo의 date prop은 YYYY-MM-DD 문자열을 기대하므로, selectedYear, selectedMonth로 조합
  const dateForRankingInfo = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
  // RankingInfo의 currentRank와 totalMembers는 initialData에 포함되거나, 여기서 계산/더미값 사용
  // 여기서는 우선 더미 값 사용, 실제 데이터는 initialData 또는 currentRankingData에서 추출 필요
  const placeholderCurrentRank = currentRankingData.find(item => item.is_current_user)?.rank || 0;
  const placeholderTotalMembers = currentRankingData.length; 

  return (
    <div className="min-h-screen bg-[#223150] text-white flex flex-col">
      {/* 상단 고정 영역 */}
      <div className="flex-shrink-0">
        <div className="mb-4 bg-white">
          {/* crewName을 사용하여 동적 타이틀 */}
          <PageHeader title={`랭킹`} iconColor="black" />
        </div>
        
        <div className="px-2">
          <div className="mb-6 mt-6 flex items-center justify-between">
            <button 
              onClick={handlePrevMonth} 
              className="p-2 rounded-md hover:bg-white/10 transition-colors"
              aria-label="이전 달"
            >
              <IoMdArrowDropleft className="h-6 w-6" />
            </button>
            {/* RankingInfo에 동적 데이터 전달 (totalMembers, currentRank는 임시) */}
            <RankingInfo 
              date={dateForRankingInfo} 
              totalMembers={placeholderTotalMembers} // TODO: 실제 크루 멤버 수 또는 랭킹 참여자 수
              currentRank={placeholderCurrentRank} // TODO: 현재 사용자의 실제 랭킹
            />
            <button 
              onClick={handleNextMonth} 
              className="p-2 rounded-md hover:bg-white/10 transition-colors"
              aria-label="다음 달"
            >
              <IoMdArrowDropright className="h-6 w-6" />
            </button>
          </div>
          {/* RankingTabs에 수정된 props 전달 */}
          <RankingTabs 
            tabs={tabs} 
            activeTabId={activeTab} 
            onTabChange={(tabId) => setActiveTab(tabId)} 
          />
        </div>
      </div>
      
      {/* 스크롤 가능한 랭킹 리스트 영역 */}
      <div className="flex-1 bg-white rounded-t-3xl text-black flex flex-col min-h-0">
        {/* 고정 헤더 */}
        <div className="flex-shrink-0">
          <RankingListHeader headers={['등수', '프로필', '이름', activeTab === 'attendance' ? '출석횟수' : '개설횟수']} />
        </div>
        
        {/* 스크롤 가능한 랭킹 아이템들 */}
        <div className="flex-1 overflow-y-auto">
          {currentRankingData.length > 0 ? (
            <div className="pb-4">
              {currentRankingData.map((item) => (
                <RankingListItem 
                  key={item.user_id} // key를 user_id로 변경
                  rank={item.rank}
                  name={item.name || '알 수 없음'}          
                  score={item.value}
                />
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-center text-gray-500">해당 월의 랭킹 데이터가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankingTemplate; 