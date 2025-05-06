import React from "react";
import Card from "../atoms/Card";
import Link from "next/link";

const AttendanceCard: React.FC = () => {
  return (
    <Link href='/attendance'>
      <Card
        bgColor='bg-primary-purple'
        className='rounded-card-top min-h-[120px] shadow-lg cursor-pointer'
      >
        <div className='flex items-center justify-between py-5'>
          <div>
            <h3 className='text-white text-15 font-normal mb-2'>
              출첵하고 상품을 받으세요!
            </h3>
            <div className='flex items-center'>
              <p className='text-white text-15 font-semibold'>출석 체크</p>
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

export default AttendanceCard;
