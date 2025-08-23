import React, { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClientAttendancePage from "@/components/pages/ClientAttendancePage";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";

// 페이지 메타데이터 최적화
export const metadata = {
  title: "출석 체크",
  description: "RUNHOUSE 출석 체크 페이지",
};

// 서버에서 출석 폼 데이터 사전 로딩
async function getAttendanceFormData() {
  try {
    const supabase = await createClient();

    // 1. 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { needsAuth: true };
    }

    // 2. 통합 폼 데이터 조회
    const { data: result, error } = await supabase
      .schema('attendance')
      .rpc('get_attendance_form_data', {
        p_user_id: user.id
      });

    if (error) {
      throw new Error(error.message);
    }

    if (!result.success) {
      if (result.error === 'user_not_found') {
        return { needsAuth: true };
      }
      if (result.error === 'crew_not_verified') {
        return { needsCrewVerification: true };
      }
      throw new Error(result.message || '알 수 없는 오류가 발생했습니다.');
    }

    return {
      formData: result.data,
      userId: user.id
    };

  } catch (error) {
    console.error('출석 폼 데이터 로딩 오류:', error);
    return {
      error: error instanceof Error ? error.message : '데이터를 불러오지 못했습니다.'
    };
  }
}

// 로딩 폴백 컴포넌트
const AttendancePageFallback = () => (
  <div className='min-h-screen bg-basic-black'>
    <div className='pt-safe'>
      <div className='flex items-center justify-between w-full px-[4vw] py-[2vh] border-b border-gray-300'>
        <div className='w-[20vw] h-[1.5rem] rounded animate-pulse bg-basic-black-gray'></div>
        <div className='w-[1.5rem] h-[1.5rem] rounded animate-pulse bg-basic-black-gray'></div>
      </div>
    </div>
    <div className='px-[4vw] pt-[3vh] space-y-[3vh]'>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className='animate-pulse'>
          <div className='mb-[1.5vh] w-[24vw] h-[1rem] rounded bg-basic-black-gray'></div>
          <div className='h-[6vh] rounded-xl bg-basic-black-gray'></div>
        </div>
      ))}
    </div>
  </div>
);

export default async function AttendancePage() {
  const data = await getAttendanceFormData();

  // 인증이 필요한 경우
  if (data.needsAuth) {
    redirect("/auth/login");
  }

  // 크루 인증이 필요한 경우
  if (data.needsCrewVerification) {
    redirect("/auth/verify-crew");
  }

  // 에러가 있는 경우 클라이언트에서 처리
  if (data.error) {
    return (
      <Suspense fallback={<AttendancePageFallback />}>
        <ClientAttendancePage error={data.error} />
      </Suspense>
    );
  }

  // 정상 데이터로 렌더링
  return (
    <Suspense fallback={<AttendancePageFallback />}>
      <ClientAttendancePage 
        initialFormData={data.formData!}
        userId={data.userId!}
      />
    </Suspense>
  );
}
