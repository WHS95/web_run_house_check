import React from "react";

const RankingListHeader: React.FC = () => {
  return (
    <div className='flex justify-between text-sm text-black/60 px-4 py-3'>
      <span className='w-1/6 text-center'>순위</span>
      <span className='w-3/6 text-center'>크루원</span>
      <span className='w-2/6 text-center'>점수</span>
    </div>
  );
};

export default RankingListHeader;
