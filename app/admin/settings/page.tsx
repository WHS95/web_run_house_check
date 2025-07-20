"use client";

import { useEffect, useState } from "react";
import { useAdminContext } from "../AdminContextProvider";
import AdminSettingsManagementNew from "@/components/organisms/AdminSettingsManagementNew";
import { getCrewLocations, getCrewById } from "@/lib/supabase/admin";

// iOS 스타일 로딩 스켈레톤 컴포넌트
function SettingsLoadingSkeleton() {
  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      <div className='flex-1 px-[4vw] py-[3vh] pb-[20vh] space-y-[3vh] overflow-y-auto animate-pulse'>
        {/* 탭 네비게이션 스켈레톤 */}
        <div className='bg-white rounded-[0.75rem] p-[1vw] shadow-sm border border-gray-100'>
          <div className='flex rounded-[0.5rem] bg-gray-100 p-[0.5vw]'>
            <div className='flex-1 py-[2vh] px-[4vw] bg-gray-200 rounded-[0.5rem]'></div>
            <div className='flex-1 py-[2vh] px-[4vw] bg-gray-200 rounded-[0.5rem] ml-[1vw]'></div>
          </div>
        </div>
        
        {/* 컨텐츠 스켈레톤 */}
        <div className='bg-white rounded-[0.75rem] shadow-sm border border-gray-100'>
          <div className='p-[4vw] border-b border-gray-100'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-[2vw]'>
                <div className='w-[1.25rem] h-[1.25rem] bg-gray-200 rounded'></div>
                <div className='w-[20vw] h-[1.125rem] bg-gray-200 rounded'></div>
                <div className='w-[8vw] h-[1.5rem] bg-gray-200 rounded-full'></div>
              </div>
              <div className='w-[20vw] h-[3vh] bg-gray-200 rounded-[0.75rem]'></div>
            </div>
          </div>
          
          <div className='p-[4vw] space-y-[3vh]'>
            {/* 검색 스켈레톤 */}
            <div className='w-full h-[6vh] bg-gray-200 rounded-[0.75rem]'></div>
            
            {/* 목록 스켈레톤 */}
            <div className='space-y-[2vh]'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='bg-gray-50 rounded-[0.75rem] p-[4vw]'>
                  <div className='flex items-center justify-between'>
                    <div className='w-[40vw] h-[1rem] bg-gray-200 rounded'></div>
                    <div className='flex space-x-[1vw]'>
                      <div className='w-[3rem] h-[3rem] bg-gray-200 rounded-[0.5rem]'></div>
                      <div className='w-[3rem] h-[3rem] bg-gray-200 rounded-[0.5rem]'></div>
                    </div>
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
    <AdminSettingsManagementNew
      initialLocations={settingsData?.locations || []}
      crewId={crewId}
    />
  );
}
