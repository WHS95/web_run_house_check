"use client";

import { useEffect, useState } from "react";
import { useAdminContext } from "../AdminContextProvider";
import ChartWithAxis from "@/components/molecules/ChartWithAxis";
import LocationChart from "@/components/molecules/LocationChart";
import MemberAttendanceStatusChart from "@/components/molecules/MemberAttendanceStatusChart";
import AdminBottomNavigation from "@/components/organisms/AdminBottomNavigation";

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

// 로딩 스켈레톤 컴포넌트
function AnalyzeLoadingSkeleton() {
  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      {/* 헤더 스켈레톤 */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='px-4 py-4'>
          <div className='flex justify-between items-center'>
            <div>
              <div className='w-24 h-6 bg-gray-200 rounded animate-pulse'></div>
              <div className='mt-1 w-32 h-4 bg-gray-100 rounded animate-pulse'></div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 스켈레톤 */}
      <div className='overflow-y-auto flex-1 px-4 py-4 pb-24'>
        <div className='space-y-6'>
          {/* 차트 스켈레톤 */}
          <div className='p-6 bg-white rounded-lg border border-gray-200'>
            <div className='mb-6'>
              <div className='mb-2 w-48 h-6 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-32 h-4 bg-gray-100 rounded animate-pulse'></div>
            </div>

            {/* 차트 아이템들 스켈레톤 */}
            <div className='space-y-3'>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className='flex items-center py-3 space-x-4'>
                  <div className='w-12 h-4 bg-gray-200 rounded animate-pulse'></div>
                  <div className='w-3 h-3 bg-gray-200 rounded-full animate-pulse'></div>
                  <div className='w-16 h-4 bg-gray-200 rounded animate-pulse'></div>
                  <div className='flex-1 h-2 bg-gray-200 rounded animate-pulse max-w-32'></div>
                  <div className='w-16 h-4 bg-gray-200 rounded animate-pulse'></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const { crewId } = useAdminContext();
  const [analyzeData, setAnalyzeData] = useState<AnalyzeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalyzeData() {
      try {
        setIsLoading(true);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const response = await fetch(
          `/api/admin/analyze?crewId=${"5a9315f4-7e2d-45fb-b22a-2510426e6055"}&year=${currentYear}&month=${currentMonth}`
        );

        if (!response.ok) {
          throw new Error("통계 데이터를 가져오는데 실패했습니다.");
        }

        const result = await response.json();

        if (result.success) {
          setAnalyzeData(result.data);
        } else {
          throw new Error(result.error || "알 수 없는 오류가 발생했습니다.");
        }
      } catch (err) {
        console.error("분석 데이터 조회 오류:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (crewId) {
      fetchAnalyzeData();
    }
  }, [crewId]);

  if (isLoading) {
    return <AnalyzeLoadingSkeleton />;
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

  if (!analyzeData) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-gray-50'>
        <div className='p-6 text-center bg-white rounded-lg border border-gray-200 shadow-sm'>
          <h3 className='mb-2 text-lg font-semibold text-gray-900'>
            데이터 없음
          </h3>
          <p className='text-gray-600'>분석할 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      {/* 헤더 */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='px-4 py-4'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-xl font-bold text-gray-900'>통계 분석</h1>
              <p className='text-sm text-gray-500'>크루 활동 패턴 분석</p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className='overflow-y-auto flex-1 px-4 py-4 pb-24'>
        <div className='space-y-6'>
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
      </div>

      {/* 하단 네비게이션 */}
      <AdminBottomNavigation />
    </div>
  );
}
