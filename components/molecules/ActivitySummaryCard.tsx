"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { CurrentMonthStats } from "@/lib/supabase/admin";
import MonthYearPicker from "./MonthYearPicker";

interface ActivitySummaryCardProps {
  userId: string;
  className?: string;
}

const ActivitySummaryCard: React.FC<ActivitySummaryCardProps> = ({
  userId,
  className = "",
}) => {
  const [stats, setStats] = useState<CurrentMonthStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 현재 날짜를 기본값으로 설정
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (userId) {
      loadMonthStats();
    }
  }, [userId, selectedYear, selectedMonth]);

  const loadMonthStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 현재 월인지 확인하여 적절한 함수 호출
      const isCurrentMonth =
        selectedYear === currentDate.getFullYear() &&
        selectedMonth === currentDate.getMonth() + 1;

      const { data, error } = await supabase.schema("attendance").rpc(
        isCurrentMonth ? "get_current_month_stats" : "get_specific_month_stats",
        isCurrentMonth
          ? { p_user_id: userId }
          : {
              p_user_id: userId,
              p_year: selectedYear,
              p_month: selectedMonth,
            }
      );

      if (error) {
        throw new Error(error.message);
      }

      // 첫 번째 결과만 사용 (UNION ALL로 인해 배열로 반환됨)
      const result = data?.[0] || null;
      setStats(result);
    } catch (err) {
      //console.error("통계 로딩 오류:", err);
      setError(
        err instanceof Error ? err.message : "통계를 불러올 수 없습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const getRankDisplay = (rank: number, total: number) => {
    if (rank === 0 || total === 0) return "전체";
    return `${rank}`;
  };

  if (isLoading) {
    return (
      <div
        className={`bg-basic-black-gray rounded-[1rem] p-[6vw] ${className}`}
      >
        <div className='animate-pulse'>
          <div className='flex items-center justify-between mb-[4vh]'>
            <div className='h-[1.5rem] bg-gray-600 rounded w-[40vw]'></div>
            <div className='h-[1rem] bg-gray-600 rounded w-[4vw]'></div>
          </div>
          <div className='h-[6rem] bg-gray-600 rounded mb-[4vh]'></div>
          <div className='grid grid-cols-3 gap-[4vw]'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='text-center'>
                <div className='h-[2rem] bg-gray-600 rounded mb-[1vh]'></div>
                <div className='h-[1rem] bg-gray-600 rounded'></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div
        className={`text-center bg-basic-black-gray rounded-[1rem] p-[6vw] ${className}`}
      >
        <p className='text-gray-400 text-[0.875rem] mb-[2vh]'>
          {error || "통계를 불러올 수 없습니다."}
        </p>
        <button
          onClick={loadMonthStats}
          className='px-[4vw] py-[1vh] bg-blue-600 text-white rounded-[0.5rem] text-[0.875rem] hover:bg-blue-700 transition-colors'
        >
          다시 시도
        </button>
      </div>
    );
  }

  const totalActivities = stats.attendance_count + stats.meetings_created_count;

  return (
    <div className={`bg-basic-black-gray rounded-[1rem] p-[6vw] ${className}`}>
      {/* 헤더 - 월 선택기 */}
      <div className='mb-[6vh]'>
        <MonthYearPicker
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onDateChange={handleDateChange}
        />
      </div>

      {/* 메인 숫자 - NRC 스타일 큰 숫자 */}
      <div className='mb-[6vh]'>
        <div className='text-white text-[4rem] font-bold leading-none mb-[1vh]'>
          {totalActivities}
        </div>
        <div className='text-gray-400 text-[0.875rem]'>총 활동</div>
      </div>

      {/* 하단 통계 3개 */}
      <div className='grid grid-cols-2 gap-[4vw]'>
        <div className='text-center'>
          <div className='text-white text-[1.25rem] font-bold mb-[0.5vh]'>
            {stats.attendance_count}
          </div>
          <div className='text-gray-400 text-[0.75rem]'>참여</div>
        </div>

        <div className='text-center'>
          <div className='text-white text-[1.25rem] font-bold mb-[0.5vh]'>
            {stats.meetings_created_count}
          </div>
          <div className='text-gray-400 text-[0.75rem]'>개설</div>
        </div>
      </div>
    </div>
  );
};

export default ActivitySummaryCard;
