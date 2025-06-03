import React from "react";

interface RankingListHeaderProps {
  headers: string[];
}

const RankingListHeader: React.FC<RankingListHeaderProps> = ({ headers }) => {
  return (
    <div className='sticky top-0 z-20 flex justify-between px-4 py-3 text-sm bg-white border-b border-gray-200 shadow-sm text-black/60'>
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
