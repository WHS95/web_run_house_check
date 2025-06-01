import React from "react";

const RankingListHeader: React.FC = () => {
  return (
    <div className='sticky top-0 z-10 flex justify-between px-4 py-3 text-sm text-black/60 '>
      <span className='w-1/6 text-center'>순위</span>
      <span className='w-3/6 text-center'>이름</span>
      <span className='w-2/6 text-center'>횟수</span>
    </div>
  );
};

export default RankingListHeader;
