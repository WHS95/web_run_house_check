"use client";

import React from "react";
import Card from "../atoms/Card";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const AttendanceCard: React.FC = () => {
  return (
    <Link href='/attendance'>
      <motion.div
        className='pb-5 bg-primary-purple rounded-card-top'
        whileHover={{
          y: -20,
          transition: { duration: 0.3, ease: "easeOut" },
        }}
      >
        <Card
          bgColor='bg-primary-purple'
          className='rounded-card-top min-h-[100px] shadow-lg cursor-pointer'
        >
          <div className='flex items-center justify-between h-full py-5'>
            <div className='flex items-center'>
              <h3 className='font-bold text-white text-20'>
                출석 체크 하러가기
              </h3>
            </div>
            <div className='flex items-center'>
              <p className='font-semibold text-white text-15'>출석 체크</p>
              <ChevronRight className='w-5 h-5 text-white' />
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
};

export default AttendanceCard;
