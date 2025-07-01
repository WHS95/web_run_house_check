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
          <div className='flex justify-between items-center'>
            <div>
              <div className='w-20 h-8 bg-gray-200 rounded animate-pulse'></div>
              <div className='mt-1 w-16 h-4 bg-gray-200 rounded animate-pulse'></div>
            </div>
          </div>
        </div>
      </div>

      <div className='overflow-y-auto flex-1 pb-24 bg-gray-50'>
        <div className='px-4 py-3 mx-auto max-w-md'>
          {/* 기본 통계 스켈레톤 */}
          <div className='space-y-4'>
            <div className='grid grid-cols-3 gap-3'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='p-3 bg-white rounded-lg shadow-sm'>
                  <div className='flex flex-col items-center space-y-2 text-center'>
                    <div className='w-8 h-8 bg-gray-200 rounded-xl animate-pulse'></div>
                    <div>
                      <div className='w-12 h-3 bg-gray-200 rounded animate-pulse'></div>
                      <div className='mt-1 w-16 h-6 bg-gray-200 rounded animate-pulse'></div>
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
                  <div className='flex justify-between items-center'>
                    <div>
                      <div className='w-20 h-4 bg-gray-200 rounded animate-pulse'></div>
                      <div className='mt-1 w-16 h-6 bg-gray-200 rounded animate-pulse'></div>
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

  // 년도/월 상태 관리 (기본값: 현재 년월)
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        // 년도/월 파라미터 추가하여 API 호출
        const params = new URLSearchParams({
          crewId,
          type: "stats",
          year: selectedYear.toString(),
          month: selectedMonth.toString(),
        });

        const response = await fetch(`/api/admin/attendance?${params}`);

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
  }, [crewId, selectedYear, selectedMonth]);

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-gray-50'>
        <div className='p-6 text-center bg-white rounded-lg border border-red-200 shadow-sm'>
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

  // 년도 옵션 생성 (현재년도 기준 ±2년)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // 월 옵션 생성
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className='flex flex-col h-screen'>
      {/* 년도/월 선택 헤더 */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='px-4 py-3'>
          <div className='flex justify-between items-center'>
            {/* 년도/월 선택 드롭다운 */}
            <div className='flex items-center space-x-2'>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className='px-3 py-1 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className='px-3 py-1 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}월
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* AdminDashboard 컴포넌트 */}
      <div className='overflow-hidden flex-1'>
        <AdminDashboard stats={stats} />
      </div>
    </div>
  );
}
