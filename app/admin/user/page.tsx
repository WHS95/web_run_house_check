"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAdminContext } from "../AdminContextProvider";
import AdminUserManagement from "@/components/organisms/AdminUserManagement";
import { getUsersByCrewIdOptimized } from "@/lib/supabase/admin";
import PageHeader from "@/components/organisms/common/PageHeader";

// iOS 스타일 로딩 스켈레톤 컴포넌트
const UserManagementSkeleton = React.memo(() => (
  <div className='space-y-[3vh] animate-pulse'>
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className='bg-basic-black-gray rounded-xl p-[4vw]'>
        <div className='flex justify-between items-center mb-[2vh]'>
          <div className='flex items-center space-x-[3vw]'>
            <div className='h-[1rem] bg-gray-600 rounded w-[24vw]'></div>
            <div className='h-[1rem] bg-gray-600 rounded-full w-[12vw]'></div>
          </div>
          <div className='w-[1.5rem] h-[1.5rem] bg-gray-600 rounded'></div>
        </div>
        <div className='space-y-[1vh]'>
          {[1, 2, 3].map((j) => (
            <div key={j} className='flex justify-between'>
              <div className='w-[16vw] h-[0.875rem] bg-gray-600 rounded'></div>
              <div className='w-[24vw] h-[0.875rem] bg-gray-600 rounded'></div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
));
UserManagementSkeleton.displayName = "UserManagementSkeleton";

// 메인 페이지 컴포넌트
export default function AdminUserPage() {
  const { crewId } = useAdminContext();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);

        // 직접 Supabase 함수 호출
        const { data: users, error } = await getUsersByCrewIdOptimized(crewId);

        if (error) {
          throw error;
        }

        setUsers(users || []);
      } catch (err) {
        console.error("사용자 데이터 조회 오류:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (crewId) {
      fetchUsers();
    }
  }, [crewId]);

  const UserManagementContent = () => {
    if (error) {
      return (
        <div className='flex flex-1 justify-center items-center'>
          <div className='text-center rounded-xl p-[6vw]'>
            <h2 className='mb-[1vh] text-lg font-semibold text-white'>
              데이터를 불러올 수 없습니다
            </h2>
            <p className='text-gray-300'>{error}</p>
          </div>
        </div>
      );
    }
    return <AdminUserManagement initialUsers={users} />;
  };

  return (
    <div className='flex overflow-hidden relative flex-col h-screen'>
      {/* 메인 콘텐츠 - 스크롤 영역 */}
      <div className='flex-1 overflow-y-auto native-scroll pt-[10vh] pb-[20vh] px-[4vw]'>
        <UserManagementContent />
      </div>
    </div>
  );
}
