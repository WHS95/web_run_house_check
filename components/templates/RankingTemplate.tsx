
"use client";

import React from 'react';
import PageHeader from '@/components/organisms/common/PageHeader';
import RankingInfo from '@/components/organisms/ranking/RankingInfo';
import RankingTabs from '@/components/organisms/ranking/RankingTabs';
import RankingListHeader from '@/components/organisms/ranking/RankingListHeader';
import RankingListItem from '@/components/organisms/ranking/RankingListItem';

// 임시 랭킹 데이터
const dummyRankingData = [
  { rank: 1, name: '홍길동(91)', score: 14.5 },
  { rank: 2, name: '박수민(92)', score: 10 },
  { rank: 3, name: '김기철(02)', score: 9 },
  { rank: 4, name: '홍지민(04)', score: 4.5 },
  { rank: 5, name: '서동현(81)', score: 4.5 },
  { rank: 6, name: '김수진(78)', score: 4 },
  { rank: 7, name: '김용훈(98)', score: 1 }, // 이름 중복은 Figma 디자인 따름
];

const RankingTemplate: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#223150] text-white flex flex-col">
      <div className="flex-shrink-0">
        <div className="mb-4">
          <PageHeader title="랭킹" iconColor="white" />
        </div>
      </div>
      <div className="px-2">
        <RankingInfo date={"2025-05-10"} totalMembers={132} currentRank={1} />
        <RankingTabs tabs={["종합", "참여", "개설"]} initialTab="종합" />
      </div>
      
      <div className="flex-1 bg-white rounded-t-3xl overflow-y-auto text-black">
        <RankingListHeader />
        <div className="pb-4">
          {dummyRankingData.map((item) => (
            <RankingListItem 
              key={item.rank}
              rank={item.rank}
              name={item.name}
              score={item.score}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RankingTemplate; 