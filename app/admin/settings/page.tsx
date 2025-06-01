import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCrewLocations, getCrewById } from "@/lib/supabase/admin";
import AdminSettingsManagement from "@/components/organisms/AdminSettingsManagement";

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

// 메인 설정 관리 컴포넌트
async function SettingsManagementContent() {
  const supabase = await createClient();

  // 사용자 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 사용자 정보 조회
  const { data: userData, error: userError } = await supabase
    .schema("attendance")
    .from("users")
    .select("id, first_name, is_crew_verified, verified_crew_id")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    redirect("/login");
  }

  // 크루 인증 확인
  if (!userData.is_crew_verified || !userData.verified_crew_id) {
    redirect("/crew-verification");
  }

  // 크루 정보 조회
  const { data: crewData, error: crewError } = await getCrewById(
    userData.verified_crew_id
  );

  if (crewError || !crewData) {
    console.error("크루 정보 조회 오류:", crewError);
    redirect("/admin");
  }

  // 크루 모임 장소 목록 조회
  const { data: locations, error: locationsError } = await getCrewLocations(
    userData.verified_crew_id
  );

  if (locationsError) {
    console.error("크루 모임 장소 조회 오류:", locationsError);
    // 에러가 발생해도 빈 배열로 렌더링
  }

  return (
    <AdminSettingsManagement
      crewData={crewData}
      initialLocations={locations || []}
      crewId={userData.verified_crew_id}
    />
  );
}

// 메인 페이지 컴포넌트
export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<SettingsLoadingSkeleton />}>
      <SettingsManagementContent />
    </Suspense>
  );
}
