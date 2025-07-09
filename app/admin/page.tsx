"use client";

import { Suspense, useEffect, useState } from "react";
import AdminDashboard from "@/components/organisms/AdminDashboard";
import { useAdminContext } from "./AdminContextProvider";
import { getAdminStatsOptimized } from "@/lib/admin-stats";

// iOS 스타일의 깔끔한 로딩 컴포넌트
function AdminDashboardSkeleton() {
    return (
        <div className='flex flex-col h-screen bg-gray-50'>
            {/* 헤더 스켈레톤 - iOS 스타일 */}
            <div className='sticky top-0 z-10 bg-white/80 backdrop-blur-md 
                border-b border-gray-200/60'>
                <div className='px-4 py-4 safe-area-pt'>
                    <div className='flex justify-between items-center'>
                        <div className='flex items-center space-x-3'>
                            <div className='w-24 h-6 bg-gray-200 rounded-lg 
                                animate-pulse'></div>
                            <div className='w-20 h-6 bg-gray-200 rounded-lg 
                                animate-pulse'></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='overflow-y-auto flex-1 pb-safe-area-pb'>
                <div className='px-4 py-6 mx-auto max-w-lg'>
                    {/* 기본 통계 스켈레톤 - iOS 카드 스타일 */}
                    <div className='space-y-6'>
                        <div className='grid grid-cols-3 gap-4'>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className='p-4 bg-white 
                                    rounded-2xl shadow-sm border border-gray-100'>
                                    <div className='flex flex-col items-center 
                                        space-y-3 text-center'>
                                        <div className='w-10 h-10 bg-gray-200 
                                            rounded-xl animate-pulse'></div>
                                        <div>
                                            <div className='w-12 h-3 bg-gray-200 
                                                rounded animate-pulse'></div>
                                            <div className='mt-2 w-16 h-6 
                                                bg-gray-200 rounded animate-pulse'></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 이달 현황 스켈레톤 - iOS 리스트 스타일 */}
                    <div className='mt-8'>
                        <div className='flex items-center mb-4 space-x-2'>
                            <div className='w-6 h-6 bg-gray-200 rounded-full 
                                animate-pulse'></div>
                            <div className='w-24 h-6 bg-gray-200 rounded-lg 
                                animate-pulse'></div>
                        </div>

                        <div className='space-y-3'>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className='p-4 bg-white 
                                    rounded-2xl shadow-sm border border-gray-100'>
                                    <div className='flex justify-between 
                                        items-center'>
                                        <div>
                                            <div className='w-20 h-4 bg-gray-200 
                                                rounded animate-pulse'></div>
                                            <div className='mt-2 w-16 h-6 
                                                bg-gray-200 rounded animate-pulse'></div>
                                        </div>
                                        <div className='w-12 h-6 bg-gray-200 
                                            rounded animate-pulse'></div>
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

// iOS 스타일 메인 페이지 컴포넌트
export default function AdminPage() {
    const { crewId } = useAdminContext();
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 년도/월 상태 관리 (기본값: 현재 년월)
    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(
        currentDate.getFullYear()
    );
    const [selectedMonth, setSelectedMonth] = useState(
        currentDate.getMonth() + 1
    );

    useEffect(() => {
        async function fetchStats() {
            try {
                setIsLoading(true);
                
                // 직접 Supabase 함수 호출
                const data = await getAdminStatsOptimized(
                    crewId,
                    selectedYear,
                    selectedMonth
                );
                setStats(data);
            } catch (err) {
                console.error("통계 데이터 조회 오류:", err);
                setError(
                    err instanceof Error 
                        ? err.message 
                        : "알 수 없는 오류가 발생했습니다."
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
            <div className='flex justify-center items-center min-h-screen 
                bg-gray-50'>
                <div className='p-6 text-center bg-white rounded-2xl 
                    border border-red-200 shadow-sm mx-4 max-w-sm'>
                    <div className='w-16 h-16 mx-auto mb-4 bg-red-100 
                        rounded-full flex items-center justify-center'>
                        <svg className='w-8 h-8 text-red-600' fill='none' 
                            stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' 
                                strokeWidth='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z' />
                        </svg>
                    </div>
                    <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                        오류 발생
                    </h3>
                    <p className='text-gray-600 text-sm'>{error}</p>
                </div>
            </div>
        );
    }

  if (!stats) {
    return <AdminDashboardSkeleton />;
  }

    // 년도 옵션 생성 (현재년도 기준 ±2년)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from(
        { length: 5 }, 
        (_, i) => currentYear - 2 + i
    );

    // 월 옵션 생성
    const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className='flex flex-col h-screen bg-gray-50'>
            {/* iOS 스타일 헤더 */}
            <div className='sticky top-0 z-10 bg-white/80 backdrop-blur-md 
                border-b border-gray-200/60'>
                <div className='px-4 py-4 safe-area-pt'>
                    <div className='flex justify-between items-center'>
                        {/* 년도/월 선택 드롭다운 - iOS 스타일 */}
                        <div className='flex items-center space-x-3'>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(
                                    parseInt(e.target.value)
                                )}
                                className='px-4 py-2 text-sm bg-white 
                                    rounded-2xl border border-gray-200 
                                    focus:outline-none focus:ring-2 
                                    focus:ring-blue-500 focus:border-transparent 
                                    shadow-sm transition-all duration-200'
                            >
                                {yearOptions.map((year) => (
                                    <option key={year} value={year}>
                                        {year}년
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(
                                    parseInt(e.target.value)
                                )}
                                className='px-4 py-2 text-sm bg-white 
                                    rounded-2xl border border-gray-200 
                                    focus:outline-none focus:ring-2 
                                    focus:ring-blue-500 focus:border-transparent 
                                    shadow-sm transition-all duration-200'
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
