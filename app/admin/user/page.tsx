import { Suspense } from "react";
import AdminUserManagement from "@/components/organisms/AdminUserManagement";
import { getUsersByCrewId } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// 로딩 컴포넌트
function AdminUserManagementSkeleton() {
  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      {/* 헤더 스켈레톤 */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='w-20 h-6 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-16 h-4 mt-1 bg-gray-200 rounded animate-pulse'></div>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 스켈레톤 */}
      <div className='sticky top-[73px] z-10 bg-gray-50 px-4 py-4 space-y-4 border-b border-gray-100'>
        <div className='w-full h-10 bg-gray-200 rounded-lg animate-pulse'></div>
        <div className='flex items-center justify-between'>
          <div className='flex space-x-2'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='w-16 h-8 bg-gray-200 rounded-full animate-pulse'
              ></div>
            ))}
          </div>
          <div className='w-20 h-8 bg-gray-200 rounded-full animate-pulse'></div>
        </div>
      </div>

      {/* 사용자 목록 스켈레톤 */}
      <div className='flex-1 px-4 py-4 pb-24 overflow-y-auto'>
        <div className='space-y-3'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='p-4 bg-white border-gray-200 rounded-lg'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-20 h-5 bg-gray-200 rounded animate-pulse'></div>
                      <div className='w-12 h-5 bg-gray-200 rounded-full animate-pulse'></div>
                    </div>
                    <div className='w-6 h-6 bg-gray-200 rounded animate-pulse'></div>
                  </div>
                  <div className='space-y-1'>
                    {[1, 2, 3].map((j) => (
                      <div key={j} className='flex justify-between'>
                        <div className='w-16 h-4 bg-gray-200 rounded animate-pulse'></div>
                        <div className='w-24 h-4 bg-gray-200 rounded animate-pulse'></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 실제 데이터를 가져오는 컴포넌트
async function AdminUserManagementWithData() {
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

  // 3. 해당 크루의 사용자 목록 데이터 가져오기
  const { data: users, error } = await getUsersByCrewId(
    userData.verified_crew_id
  );

  if (error) {
    console.error("사용자 데이터 조회 실패:", error);
    return (
      <div className='flex flex-col h-screen bg-gray-50'>
        <div className='flex items-center justify-center flex-1'>
          <div className='text-center'>
            <h2 className='mb-2 text-lg font-semibold text-gray-900'>
              데이터를 불러올 수 없습니다
            </h2>
            <p className='text-gray-600'>
              사용자 정보를 가져오는 중 오류가 발생했습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <AdminUserManagement initialUsers={users || []} />;
}

export default function AdminUserPage() {
  return (
    <Suspense fallback={<AdminUserManagementSkeleton />}>
      <AdminUserManagementWithData />
    </Suspense>
  );
}
