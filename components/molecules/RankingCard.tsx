import React from "react";
import Card from "../atoms/Card";
import Link from "next/link";

const RankingCard: React.FC = () => {
  return (
    <Link href='/ranking'>
      <Card
        bgColor='bg-primary-blue'
        className='rounded-card-top min-h-[120px] cursor-pointer'
      >
        <div className='flex items-center justify-between py-5'>
          <div>
            <h3 className='text-white text-15 font-normal mb-2'>
              크루원의 참여도를 확인해 보세요.
            </h3>
            <div className='flex items-center'>
              <p className='text-white text-15 font-semibold'>랭킹 확인</p>
              <div className='ml-2'>
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M9 18L15 12L9 6'
                    stroke='white'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default RankingCard;
