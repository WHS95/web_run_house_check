"use client";

import { useEffect, useState } from "react";
import { useAdminContext } from "../AdminContextProvider";
import AdminUserManagement from "@/components/organisms/AdminUserManagement";
import AdminPageContainer from "@/components/layouts/AdminPageContainer";
import { getUsersByCrewIdOptimized } from "@/lib/supabase/admin";

// 로딩 컴포넌트
function AdminUserManagementSkeleton() {
  return (
    <AdminPageContainer>
      {/* 검색 및 필터 스켈레톤 */}
      <div className='sticky top-4 lg:top-6 z-30 bg-rh-bg-primary py-4 space-y-4'>
        <div className='w-full h-10 bg-rh-bg-muted rounded-lg animate-pulse'></div>
        <div className='flex justify-between items-center'>
          <div className='flex space-x-2'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='w-16 h-8 bg-rh-bg-muted rounded-full animate-pulse'
              ></div>
            ))}
          </div>
          <div className='w-20 h-8 bg-rh-bg-muted rounded-full animate-pulse'></div>
        </div>
      </div>

      {/* 사용자 목록 스켈레톤 */}
      <div className='space-y-3'>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className='p-4 bg-rh-bg-surface rounded-lg border border-rh-border'
          >
            <div className='flex justify-between items-center'>
              <div className='flex-1'>
                <div className='flex justify-between items-center mb-2'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-20 h-5 bg-rh-bg-muted rounded animate-pulse'></div>
                    <div className='w-12 h-5 bg-rh-bg-muted rounded-full animate-pulse'></div>
                  </div>
                  <div className='w-6 h-6 bg-rh-bg-muted rounded animate-pulse'></div>
                </div>
                <div className='space-y-1'>
                  {[1, 2, 3].map((j) => (
                    <div key={j} className='flex justify-between'>
                      <div className='w-16 h-4 bg-rh-bg-muted rounded animate-pulse'></div>
                      <div className='w-24 h-4 bg-rh-bg-muted rounded animate-pulse'></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminPageContainer>
  );
}

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
        // //console.error("사용자 데이터 조회 오류:", err);
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

  if (isLoading) {
    return <AdminUserManagementSkeleton />;
  }

  if (error) {
    return (
      <AdminPageContainer>
        <div className='flex justify-center items-center min-h-64'>
          <div className='text-center'>
            <h2 className='mb-2 text-lg font-semibold text-white'>
              데이터를 불러올 수 없습니다
            </h2>
            <p className='text-rh-text-secondary'>{error}</p>
          </div>
        </div>
      </AdminPageContainer>
    );
  }

  return <AdminUserManagement initialUsers={users} />;
}
