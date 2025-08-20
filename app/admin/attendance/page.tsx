"use client";

import { useEffect, useState } from "react";
import { useAdminContext } from "../AdminContextProvider";
import AdminAttendanceManagement from "@/components/organisms/AdminAttendanceManagement";
import { getMonthlyAttendanceData } from "@/lib/supabase/admin";

// 로딩 스켈레톤 컴포넌트
function AttendanceLoadingSkeleton() {
  return (
    <div className='flex flex-col h-full bg-basic-black'>
      {/* 헤더 스켈레톤 */}
      <div className='sticky top-0 z-10 border-b bg-basic-black-gray border-basic-gray'>
        <div className='px-4 py-4'>
          <div className='flex justify-between items-center'>
            <div>
              <div className='w-24 h-6 rounded animate-pulse bg-basic-gray'></div>
              <div className='mt-1 w-32 h-4 rounded animate-pulse bg-basic-gray/70'></div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 스켈레톤 */}
      <div className='overflow-y-auto flex-1 px-4 py-4'>
        <div className='space-y-6'>
          {/* 달력 스켈레톤 */}
          <div className='p-4 rounded-lg border bg-basic-black-gray border-basic-gray'>
            <div className='flex justify-between items-center mb-4'>
              <div className='w-8 h-8 rounded animate-pulse bg-basic-gray'></div>
              <div className='w-32 h-6 rounded animate-pulse bg-basic-gray'></div>
              <div className='w-8 h-8 rounded animate-pulse bg-basic-gray'></div>
            </div>

            {/* 요일 헤더 */}
            <div className='grid grid-cols-7 gap-1 mb-2'>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className='py-2 text-center'>
                  <div className='mx-auto w-4 h-4 rounded animate-pulse bg-basic-gray'></div>
                </div>
              ))}
            </div>

            {/* 달력 날짜들 */}
            <div className='grid grid-cols-7 gap-1' style={{ height: "80%" }}>
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className='h-10 rounded animate-pulse bg-basic-gray/50'
                ></div>
              ))}
            </div>
          </div>

          {/* 안내 메시지 스켈레톤 */}
          <div className='p-4 rounded-lg border bg-basic-black-gray border-basic-gray'>
            <div className='text-center'>
              <div className='mx-auto mb-2 w-8 h-8 rounded animate-pulse bg-basic-gray'></div>
              <div className='mx-auto mb-1 w-48 h-4 rounded animate-pulse bg-basic-gray'></div>
              <div className='mx-auto w-40 h-4 rounded animate-pulse bg-basic-gray'></div>
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
        // //console.error("출석 데이터 조회 오류:", err);
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
      <div className='flex justify-center items-center min-h-screen bg-basic-black'>
        <div className='p-6 text-center rounded-lg border shadow-sm bg-basic-black-gray border-red-500/30'>
          <h3 className='mb-2 text-lg font-semibold text-white'>오류 발생</h3>
          <p className='text-gray-300'>{error}</p>
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
