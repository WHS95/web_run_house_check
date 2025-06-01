import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMonthlyAttendanceData } from "@/lib/supabase/admin";
import AdminAttendanceManagement from "@/components/organisms/AdminAttendanceManagement";

// 로딩 스켈레톤 컴포넌트
function AttendanceLoadingSkeleton() {
  return (
    <div className='flex flex-col h-screen bg-gray-50'>
      {/* 헤더 스켈레톤 */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200'>
        <div className='px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='w-24 h-6 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-32 h-4 mt-1 bg-gray-100 rounded animate-pulse'></div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 스켈레톤 */}
      <div className='flex-1 px-4 py-4 pb-24 overflow-y-auto'>
        <div className='space-y-6'>
          {/* 달력 스켈레톤 */}
          <div className='p-4 bg-white border border-gray-200 rounded-lg'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-8 h-8 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-32 h-6 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-8 h-8 bg-gray-200 rounded animate-pulse'></div>
            </div>

            {/* 요일 헤더 */}
            <div className='grid grid-cols-7 gap-1 mb-2'>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className='py-2 text-center'>
                  <div className='w-4 h-4 mx-auto bg-gray-200 rounded animate-pulse'></div>
                </div>
              ))}
            </div>

            {/* 달력 날짜들 */}
            <div className='grid grid-cols-7 gap-1' style={{ height: "80%" }}>
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className='h-10 bg-gray-100 rounded animate-pulse'
                ></div>
              ))}
            </div>
          </div>

          {/* 안내 메시지 스켈레톤 */}
          <div className='p-4 bg-white border border-gray-200 rounded-lg'>
            <div className='text-center'>
              <div className='w-8 h-8 mx-auto mb-2 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-48 h-4 mx-auto mb-1 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-40 h-4 mx-auto bg-gray-200 rounded animate-pulse'></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 출석 관리 컴포넌트
async function AttendanceManagementContent() {
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

  // 현재 날짜 기준으로 월별 출석 데이터 조회
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const {
    summary,
    detailData,
    error: attendanceError,
  } = await getMonthlyAttendanceData(
    userData.verified_crew_id,
    currentYear,
    currentMonth
  );

  if (attendanceError) {
    console.error("출석 데이터 조회 오류:", attendanceError);
    // 에러가 발생해도 빈 데이터로 렌더링
  }

  return (
    <AdminAttendanceManagement
      attendanceSummary={summary || []}
      attendanceDetailData={detailData || {}}
    />
  );
}

// 메인 페이지 컴포넌트
export default function AttendancePage() {
  return (
    <Suspense fallback={<AttendanceLoadingSkeleton />}>
      <AttendanceManagementContent />
    </Suspense>
  );
}
