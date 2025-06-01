import { Suspense } from "react";
import AdminDashboard from "@/components/organisms/AdminDashboard";
import { getAdminStats } from "@/lib/admin-stats";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// 로딩 컴포넌트
function AdminDashboardSkeleton() {
  return (
    <div className='flex flex-col h-screen'>
      {/* 헤더 스켈레톤 */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='w-20 h-8 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-16 h-4 mt-1 bg-gray-200 rounded animate-pulse'></div>
            </div>
          </div>
        </div>
      </div>

      <div className='flex-1 pb-24 overflow-y-auto bg-gray-50'>
        <div className='max-w-md px-4 py-3 mx-auto'>
          {/* 기본 통계 스켈레톤 */}
          <div className='space-y-4'>
            <div className='grid grid-cols-3 gap-3'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='p-3 bg-white rounded-lg shadow-sm'>
                  <div className='flex flex-col items-center space-y-2 text-center'>
                    <div className='w-8 h-8 bg-gray-200 rounded-xl animate-pulse'></div>
                    <div>
                      <div className='w-12 h-3 bg-gray-200 rounded animate-pulse'></div>
                      <div className='w-16 h-6 mt-1 bg-gray-200 rounded animate-pulse'></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 이달 현황 스켈레톤 */}
          <div className='mt-6'>
            <div className='flex items-center p-2 space-x-2'>
              <div className='w-5 h-5 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-20 h-6 bg-gray-200 rounded animate-pulse'></div>
            </div>

            <div className='space-y-3'>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className='p-3 bg-white rounded-lg shadow-sm'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='w-20 h-4 bg-gray-200 rounded animate-pulse'></div>
                      <div className='w-16 h-6 mt-1 bg-gray-200 rounded animate-pulse'></div>
                    </div>
                    <div className='w-12 h-6 bg-gray-200 rounded animate-pulse'></div>
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

// 실제 데이터를 가져오는 컴포넌트
async function AdminDashboardWithData() {
  // 1. 사용자 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // 2. 사용자의 crew 정보 직접 조회
  const { data: userData, error: userDataError } = await supabase
    .schema("attendance")
    .from("users")
    .select("is_crew_verified, verified_crew_id")
    .eq("id", user.id)
    .single();

  if (
    userDataError ||
    !userData?.is_crew_verified ||
    !userData?.verified_crew_id
  ) {
    redirect("/crew-verification");
  }

  // 3. crew 기준으로 통계 데이터 가져오기
  const stats = await getAdminStats(userData.verified_crew_id);

  return <AdminDashboard stats={stats} />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboardWithData />
    </Suspense>
  );
}
