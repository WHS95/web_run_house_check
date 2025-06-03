"use client";

import React from "react";
import { useAdminContext } from "@/app/admin/layout";

const AdminHeader: React.FC = () => {
  const { firstName, crewId } = useAdminContext();

  return (
    <header className='sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm'>
      <div className='px-4 py-3'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>관리자 대시보드</h1>
            <p className='text-sm text-gray-600'>
              {firstName}님 환영합니다 (Crew ID: {crewId})
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full'>
              <span className='text-sm font-semibold text-white'>
                {firstName.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
