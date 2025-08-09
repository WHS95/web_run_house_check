"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useAdminContext } from "../AdminContextProvider";
import ChartWithAxis from "@/components/molecules/ChartWithAxis";
import LocationChart from "@/components/molecules/LocationChart";
import MemberAttendanceStatusChart from "@/components/molecules/MemberAttendanceStatusChart";
import AdminBottomNavigation from "@/components/organisms/AdminBottomNavigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PageHeader from "@/components/organisms/common/PageHeader";

// 요일별 참여율 분석 데이터 조회
async function getDayParticipationAnalysis(
  supabase: any,
  crewId: string,
  year: number,
  month: number
): Promise<DayParticipationData[]> {
  // 한국 시간 기준으로 해당 월의 첫째 날과 마지막 날 계산
  const startDateStr = `${year}-${month.toString().padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const endDateStr = `${year}-${month
    .toString()
    .padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

  // 한국 시간 기준으로 UTC 범위 계산
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // 한국 시간 00:00:00을 UTC로 변환 (UTC-9시간)
  const startUTC = new Date(startDate.getTime() - 9 * 60 * 60 * 1000);
  // 한국 시간 23:59:59를 UTC로 변환 (UTC-9시간, +24시간-1ms)
  const endUTC = new Date(
    endDate.getTime() + 24 * 60 * 60 * 1000 - 1 - 9 * 60 * 60 * 1000
  );

  // 1단계: 크루의 활성 멤버들의 user_id 조회
  const { data: activeMembers, error: memberError } = await supabase
    .schema("attendance")
    .from("user_crews")
    .select("user_id")
    .eq("crew_id", crewId)
    .eq("status", "ACTIVE");

  if (memberError) {
    throw new Error("활성 멤버 조회에 실패했습니다.");
  }

  if (!activeMembers || activeMembers.length === 0) {
    const dayInfo = [
      { name: "일요일", color: "bg-basic-black-gray" },
      { name: "월요일", color: "bg-basic-black-gray" },
      { name: "화요일", color: "bg-basic-black-gray" },
      { name: "수요일", color: "bg-basic-black-gray" },
      { name: "목요일", color: "bg-basic-black-gray" },
      { name: "금요일", color: "bg-basic-black-gray" },
      { name: "토요일", color: "bg-basic-black-gray" },
    ];

    return Array.from({ length: 7 }, (_, index) => ({
      dayName: dayInfo[index].name,
      dayIndex: index,
      participationRate: 0,
      participantCount: 0,
      totalMembers: 0,
      color: dayInfo[index].color,
    }));
  }

  const activeMemberIds = activeMembers.map((member: any) => member.user_id);

  // 2단계: 활성 멤버들의 출석 기록 조회
  const { data: attendanceData, error: attendanceError } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("user_id, attendance_timestamp")
    .eq("crew_id", crewId)
    .in("user_id", activeMemberIds)
    .is("deleted_at", null)
    .gte("attendance_timestamp", startUTC.toISOString())
    .lte("attendance_timestamp", endUTC.toISOString());

  if (attendanceError) {
    throw new Error("출석 데이터 조회에 실패했습니다.");
  }

  // 요일별 출석 횟수 집계
  const dayAttendanceCounts: { [key: number]: number } = {
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
  };

  let totalAttendanceCount = 0;

  attendanceData?.forEach((record: any) => {
    const utcDate = new Date(record.attendance_timestamp);
    const koreanDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
    const koreanYear = koreanDate.getUTCFullYear();
    const koreanMonth = koreanDate.getUTCMonth() + 1;

    if (koreanYear === year && koreanMonth === month) {
      const dayOfWeek = koreanDate.getUTCDay();
      dayAttendanceCounts[dayOfWeek]++;
      totalAttendanceCount++;
    }
  });

  const dayInfo = [
    { name: "일요일", color: "bg-basic-blue" },
    { name: "월요일", color: "bg-basic-blue" },
    { name: "화요일", color: "bg-basic-blue" },
    { name: "수요일", color: "bg-basic-blue" },
    { name: "목요일", color: "bg-basic-blue" },
    { name: "금요일", color: "bg-basic-blue" },
    { name: "토요일", color: "bg-basic-blue" },
  ];

  const result: DayParticipationData[] = Array.from(
    { length: 7 },
    (_, index) => {
      const dayAttendanceCount = dayAttendanceCounts[index];
      const participationRate =
        totalAttendanceCount > 0
          ? Math.round((dayAttendanceCount / totalAttendanceCount) * 100)
          : 0;

      return {
        dayName: dayInfo[index].name,
        dayIndex: index,
        participationRate,
        participantCount: dayAttendanceCount,
        totalMembers: totalAttendanceCount,
        color: dayInfo[index].color,
      };
    }
  );

  return result.sort((a, b) => b.participationRate - a.participationRate);
}

// 장소별 참여율 분석 데이터 조회
async function getLocationParticipationAnalysis(
  supabase: any,
  crewId: string,
  year: number,
  month: number
): Promise<LocationParticipationData[]> {
  const startDateStr = `${year}-${month.toString().padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const endDateStr = `${year}-${month
    .toString()
    .padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const startUTC = new Date(startDate.getTime() - 9 * 60 * 60 * 1000);
  const endUTC = new Date(
    endDate.getTime() + 24 * 60 * 60 * 1000 - 1 - 9 * 60 * 60 * 1000
  );

  const { data: activeMembers, error: memberError } = await supabase
    .schema("attendance")
    .from("user_crews")
    .select("user_id")
    .eq("crew_id", crewId)
    .eq("status", "ACTIVE");

  if (memberError) {
    throw new Error("활성 멤버 조회에 실패했습니다.");
  }

  if (!activeMembers || activeMembers.length === 0) {
    return [];
  }

  const activeMemberIds = activeMembers.map((member: any) => member.user_id);

  const { data: attendanceData, error: attendanceError } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("location, attendance_timestamp")
    .eq("crew_id", crewId)
    .in("user_id", activeMemberIds)
    .is("deleted_at", null)
    .gte("attendance_timestamp", startUTC.toISOString())
    .lte("attendance_timestamp", endUTC.toISOString());

  if (attendanceError) {
    throw new Error("출석 데이터 조회에 실패했습니다.");
  }

  const locationCounts: { [key: string]: number } = {};
  let totalAttendanceCount = 0;

  attendanceData?.forEach((record: any) => {
    const utcDate = new Date(record.attendance_timestamp);
    const koreanDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
    const koreanYear = koreanDate.getUTCFullYear();
    const koreanMonth = koreanDate.getUTCMonth() + 1;

    if (koreanYear === year && koreanMonth === month) {
      const location = record.location || "기타";
      locationCounts[location] = (locationCounts[location] || 0) + 1;
      totalAttendanceCount++;
    }
  });

  const generateColor = (locationName: string, index: number) => {
    const colors = [
      "bg-basic-blue",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-teal-500",
      "bg-orange-500",
    ];
    return colors[index % colors.length];
  };

  const result: LocationParticipationData[] = Object.entries(locationCounts)
    .map(([locationName, attendanceCount], index) => {
      const participationRate =
        totalAttendanceCount > 0
          ? Math.round((attendanceCount / totalAttendanceCount) * 100)
          : 0;

      return {
        locationName,
        participationRate,
        attendanceCount,
        totalAttendance: totalAttendanceCount,
        color: generateColor(locationName, index),
      };
    })
    .sort((a, b) => b.participationRate - a.participationRate);

  return result;
}

// 전체 인원 대비 출석 현황 분석
async function getMemberAttendanceStatus(
  supabase: any,
  crewId: string,
  year: number,
  month: number
): Promise<MemberAttendanceStatusData> {
  const startDateStr = `${year}-${month.toString().padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const endDateStr = `${year}-${month
    .toString()
    .padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const startUTC = new Date(startDate.getTime() - 9 * 60 * 60 * 1000);
  const endUTC = new Date(
    endDate.getTime() + 24 * 60 * 60 * 1000 - 1 - 9 * 60 * 60 * 1000
  );

  const { data: activeMembers, error: memberError } = await supabase
    .schema("attendance")
    .from("user_crews")
    .select("user_id")
    .eq("crew_id", crewId)
    .eq("status", "ACTIVE");

  if (memberError) {
    throw new Error("활성 멤버 조회에 실패했습니다.");
  }

  const totalActiveMembers = activeMembers?.length || 0;

  if (totalActiveMembers === 0) {
    return {
      totalActiveMembers: 0,
      attendedMembers: 0,
      attendanceRate: 0,
      absentMembers: 0,
      absentRate: 0,
    };
  }

  const activeMemberIds = activeMembers.map((member: any) => member.user_id);

  const { data: attendanceData, error: attendanceError } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("user_id, attendance_timestamp")
    .eq("crew_id", crewId)
    .in("user_id", activeMemberIds)
    .is("deleted_at", null)
    .gte("attendance_timestamp", startUTC.toISOString())
    .lte("attendance_timestamp", endUTC.toISOString());

  if (attendanceError) {
    throw new Error("출석 데이터 조회에 실패했습니다.");
  }

  const attendedMemberIds = new Set<string>();

  attendanceData?.forEach((record: any) => {
    const utcDate = new Date(record.attendance_timestamp);
    const koreanDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
    const koreanYear = koreanDate.getUTCFullYear();
    const koreanMonth = koreanDate.getUTCMonth() + 1;

    if (koreanYear === year && koreanMonth === month) {
      attendedMemberIds.add(record.user_id);
    }
  });

  const attendedMembers = attendedMemberIds.size;
  const absentMembers = totalActiveMembers - attendedMembers;
  const attendanceRate = Math.round(
    (attendedMembers / totalActiveMembers) * 100
  );
  const absentRate = Math.round((absentMembers / totalActiveMembers) * 100);

  return {
    totalActiveMembers,
    attendedMembers,
    attendanceRate,
    absentMembers,
    absentRate,
  };
}

interface DayParticipationData {
  dayName: string;
  dayIndex: number;
  participationRate: number;
  participantCount: number;
  totalMembers: number;
  color: string;
}

interface LocationParticipationData {
  locationName: string;
  participationRate: number;
  attendanceCount: number;
  totalAttendance: number;
  color: string;
}

interface MemberAttendanceStatusData {
  totalActiveMembers: number;
  attendedMembers: number;
  attendanceRate: number;
  absentMembers: number;
  absentRate: number;
}

interface AnalyzeData {
  dayParticipation: DayParticipationData[];
  locationParticipation: LocationParticipationData[];
  memberAttendanceStatus: MemberAttendanceStatusData;
  year: number;
  month: number;
}

// iOS 스타일 로딩 스켈레톤 컴포넌트
const AnalyzeLoadingSkeleton = React.memo(() => (
  <div className="space-y-[3vh] animate-pulse">
    {/* 헤더 스켈레톤 */}
    <div className='bg-basic-black-gray rounded-xl p-[4vw]'>
      <div className='flex justify-between items-center'>
        <div className='w-24 h-6 bg-gray-600 rounded'></div>
        <div className='flex space-x-2'>
          <div className='w-20 h-8 bg-gray-600 rounded-lg'></div>
          <div className='w-16 h-8 bg-gray-600 rounded-lg'></div>
        </div>
      </div>
    </div>

    {/* 차트 스켈레톤 */}
    {Array.from({ length: 3 }).map((_, chartIndex) => (
      <div key={chartIndex} className='bg-basic-black-gray rounded-xl p-[4vw]'>
        <div className='mb-[3vh]'>
          <div className='mb-[1vh] w-48 h-6 bg-gray-600 rounded'></div>
          <div className='w-32 h-4 bg-gray-600 rounded'></div>
        </div>

        {/* 차트 아이템들 스켈레톤 */}
        <div className='space-y-[2vh]'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-center py-[1vh] space-x-[2vw]'>
              <div className='w-12 h-4 bg-gray-600 rounded'></div>
              <div className='w-3 h-3 bg-gray-600 rounded-full'></div>
              <div className='w-16 h-4 bg-gray-600 rounded'></div>
              <div className='flex-1 h-2 bg-gray-600 rounded max-w-32'></div>
              <div className='w-16 h-4 bg-gray-600 rounded'></div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
));
AnalyzeLoadingSkeleton.displayName = 'AnalyzeLoadingSkeleton';

export default function AnalyzePage() {
  const { crewId } = useAdminContext();
  const [analyzeData, setAnalyzeData] = useState<AnalyzeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 년도/월 선택 상태 추가
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  // 년도 옵션 생성 (현재 실제 년도 기준 ±2년)
  const currentYear = now.getFullYear();
  const yearOptions: number[] = [];
  for (let i = currentYear - 2; i <= currentYear + 2; i++) {
    yearOptions.push(i);
  }

  // 월 옵션 생성
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  const fetchAnalyzeData = useCallback(
    async (year: number, month: number) => {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();
        
        // 직접 Supabase 함수 호출
        const [
          dayParticipationData,
          locationParticipationData,
          memberAttendanceStatus,
        ] = await Promise.all([
          getDayParticipationAnalysis(supabase, crewId, year, month),
          getLocationParticipationAnalysis(supabase, crewId, year, month),
          getMemberAttendanceStatus(supabase, crewId, year, month),
        ]);

        setAnalyzeData({
          dayParticipation: dayParticipationData,
          locationParticipation: locationParticipationData,
          memberAttendanceStatus: memberAttendanceStatus,
          year: year,
          month: month,
        });
      } catch (err) {
        console.error("분석 데이터 조회 오류:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [crewId]
  );

  useEffect(() => {
    if (crewId) {
      fetchAnalyzeData(selectedYear, selectedMonth);
    }
  }, [crewId, selectedYear, selectedMonth, fetchAnalyzeData]);

  const AnalyzeContent = () => {
    if (error) {
      return (
        <div className='flex flex-1 justify-center items-center'>
          <div className='text-center bg-basic-black-gray rounded-xl p-[6vw]'>
            <h3 className='mb-[1vh] text-lg font-semibold text-white'>
              오류 발생
            </h3>
            <p className='text-gray-300'>{error}</p>
          </div>
        </div>
      );
    }

    if (!analyzeData) {
      return (
        <div className='flex flex-1 justify-center items-center'>
          <div className='text-center bg-basic-black-gray rounded-xl p-[6vw]'>
            <h3 className='mb-[1vh] text-lg font-semibold text-white'>
              데이터 없음
            </h3>
            <p className='text-gray-300'>분석할 데이터가 없습니다.</p>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* 년도/월 선택 */}
        <div className='bg-basic-black-gray rounded-xl p-[4vw] mb-[3vh]'>
          <div className='flex justify-between items-center'>
            <h1 className='text-xl font-bold text-white'>통계</h1>
            <div className='flex space-x-2'>
              {/* 년도 선택 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='bg-gray-700 border-gray-600 text-white min-w-20 hover:bg-gray-600'
                  >
                    {selectedYear}년
                    <ChevronDown className='ml-1 w-4 h-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='bg-gray-800 border-gray-600'>
                  {yearOptions.map((year) => (
                    <DropdownMenuItem
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`text-white hover:bg-gray-700 ${selectedYear === year ? "bg-gray-700" : ""}`}
                    >
                      {year}년
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 월 선택 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='bg-gray-700 border-gray-600 text-white min-w-16 hover:bg-gray-600'
                  >
                    {selectedMonth}월
                    <ChevronDown className='ml-1 w-4 h-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='bg-gray-800 border-gray-600'>
                  {monthOptions.map((month) => (
                    <DropdownMenuItem
                      key={month}
                      onClick={() => setSelectedMonth(month)}
                      className={`text-white hover:bg-gray-700 ${selectedMonth === month ? "bg-gray-700" : ""}`}
                    >
                      {month}월
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* 차트들 */}
        <div className='space-y-[3vh]'>
          <MemberAttendanceStatusChart
            title='전체 인원 대비 출석 현황'
            data={analyzeData.memberAttendanceStatus}
            year={analyzeData.year}
            month={analyzeData.month}
          />

          <ChartWithAxis
            title='요일별 출석 분석'
            data={analyzeData.dayParticipation}
            year={analyzeData.year}
            month={analyzeData.month}
          />

          <LocationChart
            title='장소별 출석 분석'
            data={analyzeData.locationParticipation}
            year={analyzeData.year}
            month={analyzeData.month}
          />
        </div>
      </>
    );
  };

  return (
    <div className="h-screen bg-basic-black flex flex-col overflow-hidden relative">
      {/* 고정 헤더 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <PageHeader title="통계 분석" iconColor="white" borderColor="gray-500" />
      </div>

      {/* 메인 콘텐츠 - 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto native-scroll pt-[10vh] pb-[20vh] px-[4vw]">
        <Suspense fallback={<AnalyzeLoadingSkeleton />}>
          {isLoading ? (
            <AnalyzeLoadingSkeleton />
          ) : (
            <AnalyzeContent />
          )}
        </Suspense>
      </div>

      {/* 하단 네비게이션 */}
      <AdminBottomNavigation />
    </div>
  );
}
