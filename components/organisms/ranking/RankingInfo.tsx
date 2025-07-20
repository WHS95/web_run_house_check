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
    <div className='flex flex-col items-center justify-center mb-[0.5vh]'>
      <p className='text-[0.875rem] font-semibold'>{formattedDate}</p>
      <p className='text-[1.5rem] font-semibold'> 나의 랭킹 {currentRank}위</p>
      <p className='text-[0.75rem] text-white/80'>전체 인원 {totalMembers}명</p>
    </div>
  );
};

export default RankingInfo;
