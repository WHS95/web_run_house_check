"use client";

import { useEffect, useState } from "react";
import { useAdminContext } from "../AdminContextProvider";
import AdminSettingsManagementNew from "@/components/organisms/AdminSettingsManagementNew";
import { getCrewLocations, getCrewById } from "@/lib/supabase/admin";

// iOS 스타일 로딩 스켈레톤 컴포넌트
function SettingsLoadingSkeleton() {
  return (
    <div className='flex flex-col h-full bg-rh-bg-primary'>
      <div className='flex-1 px-4 py-6 pb-40 space-y-3 overflow-y-auto animate-pulse'>
        {/* 탭 네비게이션 스켈레톤 */}
        <div className='bg-rh-bg-surface rounded-rh-lg p-1 shadow-sm border border-rh-border'>
          <div className='flex rounded-rh-md bg-rh-bg-muted/30 p-0.5'>
            <div className='flex-1 py-4 px-4 bg-rh-bg-muted rounded-rh-md'></div>
            <div className='flex-1 py-4 px-4 bg-rh-bg-muted rounded-rh-md ml-1'></div>
          </div>
        </div>

        {/* 컨텐츠 스켈레톤 */}
        <div className='bg-rh-bg-surface rounded-rh-lg shadow-sm border border-rh-border'>
          <div className='p-4 border-b border-rh-border'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center space-x-2'>
                <div className='w-[1.25rem] h-[1.25rem] bg-rh-bg-muted rounded'></div>
                <div className='w-20 h-[1.125rem] bg-rh-bg-muted rounded'></div>
                <div className='w-8 h-[1.5rem] bg-rh-bg-muted rounded-full'></div>
              </div>
              <div className='w-20 h-6 bg-rh-bg-muted rounded-rh-lg'></div>
            </div>
          </div>

          <div className='p-4 space-y-3'>
            {/* 검색 스켈레톤 */}
            <div className='w-full h-12 bg-rh-bg-muted rounded-rh-lg'></div>

            {/* 목록 스켈레톤 */}
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className='bg-rh-bg-muted/20 rounded-rh-lg p-4'
                >
                  <div className='flex justify-between items-center'>
                    <div className='w-[160px] h-[1rem] bg-rh-bg-muted rounded'></div>
                    <div className='flex space-x-1'>
                      <div className='w-[3rem] h-[3rem] bg-rh-bg-muted rounded-rh-md'></div>
                      <div className='w-[3rem] h-[3rem] bg-rh-bg-muted rounded-rh-md'></div>
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
          { data: locations, error: locationsError },
        ] = await Promise.all([getCrewById(crewId), getCrewLocations(crewId)]);

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
        // //console.error("설정 데이터 조회 오류:", err);
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
      <div className='flex justify-center items-center min-h-screen bg-rh-bg-primary'>
        <div className='p-6 text-center rounded-lg border shadow-sm bg-rh-bg-surface border-red-500/30'>
          <h3 className='mb-2 text-lg font-semibold text-white'>오류 발생</h3>
          <p className='text-rh-text-secondary'>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <AdminSettingsManagementNew
      initialLocations={settingsData?.locations || []}
      crewId={crewId}
      locationBasedAttendance={settingsData?.crewData?.location_based_attendance || false}
    />
  );
}
