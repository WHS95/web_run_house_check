"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAdminContext } from "../AdminContextProvider";
import AdminSettingsManagementNew from "@/components/organisms/AdminSettingsManagementNew";
import { getCrewLocations, getCrewById } from "@/lib/supabase/admin";
import PageHeader from "@/components/organisms/common/PageHeader";

// iOS 스타일 로딩 스켈레톤 컴포넌트
const SettingsLoadingSkeleton = React.memo(() => (
  <div className="space-y-[3vh] animate-pulse">
    {/* 탭 네비게이션 스켈레톤 */}
    <div className='bg-basic-black-gray rounded-xl p-[4vw]'>
      <div className='flex rounded-[0.75rem] bg-gray-600 p-[1vw]'>
        <div className='flex-1 py-[2vh] px-[4vw] bg-gray-500 rounded-[0.75rem]'></div>
        <div className='flex-1 py-[2vh] px-[4vw] bg-gray-500 rounded-[0.75rem] ml-[1vw]'></div>
      </div>
    </div>
    
    {/* 컨텐츠 스켈레톤 */}
    <div className='bg-basic-black-gray rounded-xl p-[4vw] space-y-[3vh]'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-[2vw]'>
          <div className='w-[1.25rem] h-[1.25rem] bg-gray-600 rounded'></div>
          <div className='w-[20vw] h-[1.125rem] bg-gray-600 rounded'></div>
          <div className='w-[8vw] h-[1.5rem] bg-gray-600 rounded-full'></div>
        </div>
        <div className='w-[20vw] h-[3vh] bg-gray-600 rounded-[0.75rem]'></div>
      </div>
      
      {/* 검색 스켈레톤 */}
      <div className='w-full h-[6vh] bg-gray-600 rounded-[0.75rem]'></div>
      
      {/* 목록 스켈레톤 */}
      <div className='space-y-[2vh]'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='bg-gray-700 rounded-[0.75rem] p-[4vw]'>
            <div className='flex items-center justify-between'>
              <div className='w-[40vw] h-[1rem] bg-gray-600 rounded'></div>
              <div className='flex space-x-[1vw]'>
                <div className='w-[3rem] h-[3rem] bg-gray-600 rounded-[0.5rem]'></div>
                <div className='w-[3rem] h-[3rem] bg-gray-600 rounded-[0.5rem]'></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
));
SettingsLoadingSkeleton.displayName = 'SettingsLoadingSkeleton';

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

  const SettingsContent = () => {
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
    
    return (
      <AdminSettingsManagementNew
        initialLocations={settingsData?.locations || []}
        crewId={crewId}
      />
    );
  };

  return (
    <div className="h-screen bg-basic-black flex flex-col overflow-hidden relative">
      {/* 고정 헤더 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <PageHeader title="설정 관리" iconColor="white" borderColor="gray-500" />
      </div>

      {/* 메인 콘텐츠 - 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto native-scroll pt-[10vh] pb-[20vh] px-[4vw]">
        <Suspense fallback={<SettingsLoadingSkeleton />}>
          {isLoading ? (
            <SettingsLoadingSkeleton />
          ) : (
            <SettingsContent />
          )}
        </Suspense>
      </div>
    </div>
  );
}
