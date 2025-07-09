"use client";

import { useEffect, useState } from "react";
import { useAdminContext } from "../AdminContextProvider";
import AdminAttendanceManagement from "@/components/organisms/AdminAttendanceManagement";
import { getMonthlyAttendanceData } from "@/lib/supabase/admin";

// 로딩 스켈레톤 컴포넌트
function AttendanceLoadingSkeleton() {
  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      {/* 헤더 스켈레톤 */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='w-24 h-6 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-32 h-4 mt-1 bg-gray-100 rounded animate-pulse'></div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 스켈레톤 */}
      <div className='flex-1 px-4 py-4 pb-24 overflow-y-auto'>
        <div className='space-y-6'>
          {/* 달력 스켈레톤 */}
          <div className='p-4 bg-white border border-gray-200 rounded-lg'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-8 h-8 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-32 h-6 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-8 h-8 bg-gray-200 rounded animate-pulse'></div>
            </div>

            {/* 요일 헤더 */}
            <div className='grid grid-cols-7 gap-1 mb-2'>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className='py-2 text-center'>
                  <div className='w-4 h-4 mx-auto bg-gray-200 rounded animate-pulse'></div>
                </div>
              ))}
            </div>

            {/* 달력 날짜들 */}
            <div className='grid grid-cols-7 gap-1' style={{ height: "80%" }}>
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className='h-10 bg-gray-100 rounded animate-pulse'
                ></div>
              ))}
            </div>
          </div>

          {/* 안내 메시지 스켈레톤 */}
          <div className='p-4 bg-white border border-gray-200 rounded-lg'>
            <div className='text-center'>
              <div className='w-8 h-8 mx-auto mb-2 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-48 h-4 mx-auto mb-1 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-40 h-4 mx-auto bg-gray-200 rounded animate-pulse'></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function AttendancePage() {
  const { crewId } = useAdminContext();
  const [attendanceData, setAttendanceData] = useState<{
    summary: any[];
    detailData: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAttendanceData() {
      try {
        setIsLoading(true);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // 직접 Supabase 함수 호출
        const {
          summary,
          detailData,
          error: attendanceError,
        } = await getMonthlyAttendanceData(crewId, currentYear, currentMonth);

        if (attendanceError) {
          throw attendanceError;
        }

        setAttendanceData({
          summary: summary || [],
          detailData: detailData || {},
        });
      } catch (err) {
        console.error("출석 데이터 조회 오류:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (crewId) {
      fetchAttendanceData();
    }
  }, [crewId]);

  if (isLoading) {
    return <AttendanceLoadingSkeleton />;
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

  return (
    <AdminAttendanceManagement
      attendanceSummary={attendanceData?.summary || []}
      attendanceDetailData={attendanceData?.detailData || {}}
    />
  );
}
