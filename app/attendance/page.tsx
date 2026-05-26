import React, { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClientAttendancePage from "@/components/pages/ClientAttendancePage";
import { 사용자_컨텍스트_조회 } from "@/lib/access/user-context";
import * as 접근정책 from "@/lib/domain/access/policies";

// 페이지 메타데이터 최적화
export const metadata = {
  title: "출석 체크",
  description: "RUNHOUSE 출석 체크 페이지",
};

// 서버에서 출석 폼 데이터 사전 로딩
async function getAttendanceFormData() {
  try {
    // 1. 사용자 컨텍스트 조회 (auth + status + 인증 크루 정보 1회 조회)
    const ctx = await 사용자_컨텍스트_조회();
    if (!ctx) {
      return { needsAuth: true };
    }

    // 2. 활성 상태 가드 — 어드민이 비활성화한 유저는 / 로 강제 이동
    if (
      !접근정책.출석등록_가능한가({
        userStatus: ctx.userStatus,
        userCrewStatus: ctx.userCrewStatus,
      })
    ) {
      return { isDeactivated: true };
    }

    // 3. 출석 폼 데이터 RPC 조회
    const supabase = await createClient();
    const { data: result, error } = await supabase
      .schema("attendance")
      .rpc("get_attendance_form_data", {
        p_user_id: ctx.userId,
      });

    if (error) {
      throw new Error(error.message);
    }

    if (!result.success) {
      if (result.error === "user_not_found") {
        return { needsAuth: true };
      }
      if (result.error === "crew_not_verified") {
        return { needsCrewVerification: true };
      }
      throw new Error(result.message || "알 수 없는 오류가 발생했습니다.");
    }

    return {
      formData: result.data,
      userId: ctx.userId,
    };
  } catch (error) {
    console.error("출석 폼 데이터 로딩 오류:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "데이터를 불러오지 못했습니다.",
    };
  }
}

// 로딩 폴백 — v2 톤(정적 placeholder, animate-pulse 금지)
const AttendancePageFallback = () => (
  <div className='flex flex-col min-h-screen bg-rh-bg-primary'>
    <div className='pt-safe'>
      <div className='flex items-center justify-between w-full px-4 h-14 border-b border-rh-border'>
        <div className='w-20 h-4 rounded bg-rh-bg-surface'></div>
        <div className='w-12 h-3 rounded bg-rh-bg-surface'></div>
      </div>
    </div>
    <div className='flex-1 px-4 pt-3 pb-4 flex flex-col gap-4'>
      <div className='h-3 w-16 rounded bg-rh-bg-surface'></div>
      <div className='h-36 rounded-rh-md bg-rh-bg-inset border border-rh-border'></div>
      <div className='h-3 w-16 rounded bg-rh-bg-surface'></div>
      <div className='flex gap-2'>
        <div className='h-7 w-16 rounded-full bg-rh-bg-surface'></div>
        <div className='h-7 w-20 rounded-full bg-rh-bg-surface'></div>
        <div className='h-7 w-16 rounded-full bg-rh-bg-surface'></div>
      </div>
      <div className='h-3 w-16 rounded bg-rh-bg-surface'></div>
      <div className='grid grid-cols-2 gap-2'>
        <div className='h-16 rounded-rh-md bg-rh-bg-inset border border-rh-border'></div>
        <div className='h-16 rounded-rh-md bg-rh-bg-inset border border-rh-border'></div>
      </div>
      <div className='h-[52px] rounded-rh-lg bg-rh-bg-surface'></div>
    </div>
    <div className='shrink-0 px-4 pt-2 pb-3'>
      <div className='h-12 rounded-rh-lg bg-rh-bg-surface'></div>
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

  // 비활성화 유저는 홈으로 — 홈에서 ClientHomePage가 차단 모달 노출
  if (data.isDeactivated) {
    redirect("/");
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
