"use client";

import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { Menu, Shield } from "lucide-react";

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({
  children,
}: AdminLayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className='flex flex-col h-screen bg-basic-black'>
      {/* 사이드바 */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* 메인 콘텐츠 */}
      <div className='flex flex-col flex-1 min-h-screen'>
        {/* 모바일 헤더 - 상단 고정 */}
        <div className='sticky top-0 z-10 border-b bg-basic-black-gray border-basic-gray'>
          <div className='flex justify-between items-center p-5'>
            <button
              onClick={() => setSidebarOpen(true)}
              className='text-gray-400 hover:text-white'
            >
              <Menu className='w-6 h-6' />
            </button>
            <div className='flex items-center space-x-2'>
              <Shield className='w-5 h-5 text-basic-blue' />
              <span className='font-medium text-white'>크루 관리자</span>
            </div>
            <div className='w-6 h-6' /> {/* 균형을 위한 공간 */}
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className='overflow-auto flex-1'>{children}</div>
      </div>
    </div>
  );
}
