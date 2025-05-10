import React from "react";
interface RankingInfoProps {
  date: string;
  totalMembers: number;
  currentRank: number;
}

const RankingInfo: React.FC<RankingInfoProps> = ({
  date,
  totalMembers,
  currentRank,
}) => {
  // YYYY-MM-DD 형식의 날짜를 YYYY년 MM월 형식으로 변환
  const formattedDate = new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className='mb-6'>
      <div className='flex flex-col items-center justify-center mb-1'>
        <p className='text-sm font-semibold'>{formattedDate}</p>
        <p className='text-2xl font-semibold'>현재 {currentRank}위</p>
        <p className='text-xs text-white/80'>전체 {totalMembers}명</p>
      </div>
    </div>
  );
};

export default RankingInfo;
