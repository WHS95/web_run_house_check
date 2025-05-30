"use client";

import React from "react";
import Card from "../atoms/Card";
import Link from "next/link";
// import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const AttendanceCard: React.FC = () => {
  return (
    <Link href='/attendance'>
      <Card
        // bgColor='bg-[#49eafc]'
        bgColor='bg-[#669ff2]'
        // bgColor='bg-gray-300'
        className='rounded-card-top min-h-[100px] shadow-lg cursor-pointer'
      >
        <div className='flex items-center justify-between h-full py-5'>
          <div className='flex items-center'>
            <h3 className='font-bold text-white text-20'>출석 체크 하러가기</h3>
          </div>
          <div className='flex items-center'>
            <p className='font-semibold text-white text-15'>출석 체크</p>
            <ChevronRight className='w-5 h-5 text-white' />
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default AttendanceCard;
