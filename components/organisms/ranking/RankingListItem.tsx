import React from "react";

interface RankingListItemProps {
  rank: number;
  name: string;
  score: number;
}

// // 임시 프로필 아이콘 컴포넌트
// const ProfileIcon: React.FC = () => (
//   <div className='w-8 h-8 rounded-full bg-[#476565]/30 flex items-center justify-center'>
//     <svg
//       width='16'
//       height='16'
//       viewBox='0 0 24 24'
//       fill='none'
//       xmlns='http://www.w3.org/2000/svg'
//     >
//       <path
//         d='M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21'
//         stroke='white'
//         strokeWidth='2'
//         strokeLinecap='round'
//         strokeLinejoin='round'
//       />
//       <path
//         d='M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z'
//         stroke='white'
//         strokeWidth='2'
//         strokeLinecap='round'
//         strokeLinejoin='round'
//       />
//     </svg>
//   </div>
// );

const RankingListItem: React.FC<RankingListItemProps> = ({
  rank,
  name,
  score,
}) => {
  const getRankDisplay = () => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return rank.toString();
    }
  };

  return (
    <div className='flex overflow-y-auto justify-between items-center px-4 py-3 border-b border-white'>
      <span
        className={`w-1/6 text-center ${rank <= 3 ? "text-2xl" : "text-sm"}`}
      >
        {getRankDisplay()}
      </span>
      <div className='flex justify-center items-center w-3/6'>
        {/* <ProfileIcon /> */}
        <span className='text-sm font-normal text-center text-white'>
          {name}
        </span>
      </div>
      <span className='w-2/6 text-sm font-normal text-center text-white'>
        {score}
      </span>
    </div>
  );
};

export default RankingListItem;
