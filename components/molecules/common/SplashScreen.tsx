"use client";

import React from "react";

interface SplashScreenProps {
  isVisible: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className='fixed inset-0 z-[9999] bg-basic-black flex flex-col items-center justify-center splash-screen'>
      {/* 로고 및 텍스트 블록 */}
      <div className='text-center text-white'>
        <img
          src='/logo.png'
          alt='런하우스 로고'
          className='w-32 h-auto mx-auto mb-6 sm:w-36'
        />
      </div>

      {/* 로딩 인디케이터 */}
      <div className='flex flex-col items-center mt-12 space-y-4'>
        <div className='flex space-x-2'>
          <div className='w-2 h-2 bg-white rounded-full splash-dot'></div>
          <div className='w-2 h-2 bg-white rounded-full splash-dot'></div>
          <div className='w-2 h-2 bg-white rounded-full splash-dot'></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
