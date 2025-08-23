"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FiChevronLeft } from "react-icons/fi";

interface FormLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function FormLayout({ title, children }: FormLayoutProps) {
  const router = useRouter();

  return (
    <div className='min-h-screen bg-basic-black'>
      {/* Header - PageHeader 스타일과 동일하게 */}
      <div className='fixed top-0 right-0 left-0 z-50 border-b border-gray-500 shadow-sm bg-basic-black-gray'>
        <header className='flex relative items-center py-4'>
          {/* 뒤로가기 버튼 */}
          <div className='absolute left-4'>
            <button
              onClick={() => router.back()}
              className='flex items-center text-white transition-colors hover:text-gray-300'
            >
              <FiChevronLeft size={24} />
            </button>
          </div>

          {/* 제목 - 가운데 정렬 */}
          <div className='flex-1 px-4'>
            <h1 className='text-xl font-bold text-center text-white black-han-sans-regular'>
              {title}
            </h1>
          </div>
        </header>
      </div>

      {/* Content */}
      <div className='pt-[80px] pb-20 px-4'>{children}</div>
    </div>
  );
}
