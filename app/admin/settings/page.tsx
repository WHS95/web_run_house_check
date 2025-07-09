"use client";

import { useEffect, useState } from "react";
import { useAdminContext } from "../AdminContextProvider";
import AdminSettingsManagement from "@/components/organisms/AdminSettingsManagement";
import { getCrewLocations, getCrewById } from "@/lib/supabase/admin";

// 로딩 스켈레톤 컴포넌트
function SettingsLoadingSkeleton() {
  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      {/* 헤더 스켈레톤 */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='px-4 py-4'>
          <div className='flex items-center space-x-3'>
            <div>
              <div className='w-24 h-6 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-32 h-4 mt-1 bg-gray-100 rounded animate-pulse'></div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 스켈레톤 */}
      <div className='flex-1 px-4 py-4 pb-24 space-y-6 overflow-y-auto'>
        {/* 활동장소 관리 카드 스켈레톤 */}
        <div className='p-6 bg-white border border-gray-200 rounded-lg'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center space-x-2'>
              <div className='w-5 h-5 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-32 h-6 bg-gray-200 rounded animate-pulse'></div>
            </div>
            <div className='w-20 h-8 bg-gray-200 rounded animate-pulse'></div>
          </div>

          {/* 검색창 스켈레톤 */}
          <div className='mb-4'>
            <div className='w-full h-10 bg-gray-100 rounded animate-pulse'></div>
          </div>

          {/* 테이블 스켈레톤 */}
          <div className='space-y-3'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className='flex items-center justify-between p-3 rounded bg-gray-50'
              >
                <div className='w-40 h-4 bg-gray-200 rounded animate-pulse'></div>
                <div className='w-8 h-8 bg-gray-200 rounded animate-pulse'></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function AdminSettingsPage() {
  const { crewId } = useAdminContext();
  const [settingsData, setSettingsData] = useState<{
    crewData: any;
    locations: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettingsData() {
      try {
        setIsLoading(true);
        
        // 직접 Supabase 함수 호출
        const [
          { data: crewData, error: crewError },
          { data: locations, error: locationsError }
        ] = await Promise.all([
          getCrewById(crewId),
          getCrewLocations(crewId)
        ]);

        if (crewError) {
          throw crewError;
        }
        
        if (locationsError) {
          throw locationsError;
        }

        setSettingsData({
          crewData,
          locations: locations || [],
        });
      } catch (err) {
        console.error("설정 데이터 조회 오류:", err);
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (crewId) {
      fetchSettingsData();
    }
  }, [crewId]);

  if (isLoading) {
    return <SettingsLoadingSkeleton />;
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
    <AdminSettingsManagement
      initialLocations={settingsData?.locations || []}
      crewId={crewId}
    />
  );
}
