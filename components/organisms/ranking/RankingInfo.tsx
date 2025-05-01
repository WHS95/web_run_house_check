import React from "react";

const RankingInfo: React.FC = () => {
  // TODO: 실제 데이터 연동 필요
  const date = "2024년 1월";
  const totalMembers = 132;
  const currentRank = 1;

  return (
    <div className='mb-6'>
      <div className='flex justify-between items-baseline mb-1'>
        <p className='text-sm font-semibold'>{date}</p>
        <p className='text-xs text-white/80'>전체 {totalMembers}명</p>
      </div>
      <p className='text-2xl font-semibold'>현재 {currentRank}위</p>
    </div>
  );
};

export default RankingInfo;
