"use client";

import { Suspense, useEffect, useState } from "react";
import AdminDashboard from "@/components/organisms/AdminDashboard";
import { useAdminContext } from "./AdminContextProvider";

// 로딩 컴포넌트
function AdminDashboardSkeleton() {
  return (
    <div className='flex flex-col h-screen'>
      {/* 헤더 스켈레톤 */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='w-20 h-8 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-16 h-4 mt-1 bg-gray-200 rounded animate-pulse'></div>
            </div>
          </div>
        </div>
      </div>

      <div className='flex-1 pb-24 overflow-y-auto bg-gray-50'>
        <div className='max-w-md px-4 py-3 mx-auto'>
          {/* 기본 통계 스켈레톤 */}
          <div className='space-y-4'>
            <div className='grid grid-cols-3 gap-3'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='p-3 bg-white rounded-lg shadow-sm'>
                  <div className='flex flex-col items-center space-y-2 text-center'>
                    <div className='w-8 h-8 bg-gray-200 rounded-xl animate-pulse'></div>
                    <div>
                      <div className='w-12 h-3 bg-gray-200 rounded animate-pulse'></div>
                      <div className='w-16 h-6 mt-1 bg-gray-200 rounded animate-pulse'></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 이달 현황 스켈레톤 */}
          <div className='mt-6'>
            <div className='flex items-center p-2 space-x-2'>
              <div className='w-5 h-5 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-20 h-6 bg-gray-200 rounded animate-pulse'></div>
            </div>

            <div className='space-y-3'>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className='p-3 bg-white rounded-lg shadow-sm'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='w-20 h-4 bg-gray-200 rounded animate-pulse'></div>
                      <div className='w-16 h-6 mt-1 bg-gray-200 rounded animate-pulse'></div>
                    </div>
                    <div className='w-12 h-6 bg-gray-200 rounded animate-pulse'></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트 - 클라이언트 컴포넌트로 변경
export default function AdminPage() {
  const { crewId } = useAdminContext();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/stats?crewId=${crewId}`);

        if (!response.ok) {
          throw new Error("통계 데이터를 가져오는데 실패했습니다.");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("통계 데이터 조회 오류:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (crewId) {
      fetchStats();
    }
  }, [crewId]);

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-50'>
        <div className='p-6 text-center bg-white border border-red-200 rounded-lg shadow-sm'>
          <h3 className='mb-2 text-lg font-semibold text-gray-900'>
            오류 발생
          </h3>
          <p className='text-gray-600'>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <AdminDashboardSkeleton />;
  }

  return <AdminDashboard stats={stats} />;
}
