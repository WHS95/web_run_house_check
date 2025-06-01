"use client";

import React from "react";
import Card from "../atoms/Card";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const RankingCard: React.FC = () => {
  return (
    <Link href='/ranking'>
      <Card
        bgColor='bg-basic-gray'
        className='rounded-card-top min-h-[100px] cursor-pointer shadow-lg'
      >
        <div className='flex items-center justify-between h-full py-5'>
          <div className='flex items-center'>
            <h3 className='font-bold text-white text-20'>나의 랭킹 확인하기</h3>
          </div>
          <div className='flex items-center'>
            <p className='font-semibold text-white text-15'>랭킹 확인</p>
            <ChevronRight className='w-5 h-5 text-white' />
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default RankingCard;
