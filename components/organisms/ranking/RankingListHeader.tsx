import React from "react";

interface RankingListHeaderProps {
  headers: string[];
}

const RankingListHeader: React.FC<RankingListHeaderProps> = ({ headers }) => {
  return (
    <div className='flex sticky top-0 z-20 justify-between px-[4vw] py-[1.5vh] text-[0.875rem] text-white shadow-sm bg-basic-black-gray'>
      <span className='w-1/6 font-medium text-center'>
        {headers[0] || "순위"}
      </span>
      <span className='w-2/6 font-medium text-center'>
        {headers[2] || "이름"}
      </span>
      <span className='w-2/6 font-medium text-center'>
        {headers[3] || "횟수"}
      </span>
    </div>
  );
};

export default RankingListHeader;
