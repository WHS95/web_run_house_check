import React, { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import ClientHomePage from "@/components/pages/ClientHomePage";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";

// 동적 로딩으로 번들 크기 최적화 (클라이언트 전용)
const EnhancedHomeTemplate = dynamic(
  () => import("@/components/templates/EnhancedHomeTemplate"),
  {
    ssr: false,
    loading: () => <LoadingSpinner size='sm' color='white' />,
  }
);

// 서버 컴포넌트로 초기 데이터 로딩 최적화
async function getInitialHomeData() {
  try {
    const supabase = await createClient();

    // 서버에서 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { needsAuth: true };
    }

    // 서버에서 홈페이지 데이터 조회
    const { data: functionResult, error: functionError } = await supabase
      .schema("attendance")
      .rpc("get_home_page_data", {
        p_user_id: user.id,
      });

    if (functionError) {
      throw functionError;
    }

    if (!functionResult.success) {
      if (functionResult.error === "crew_not_verified") {
        return { needsCrewVerification: true };
      }

      // 기본 데이터 반환
      return {
        pageData: {
          userName: user.user_metadata?.full_name || user.email || "사용자",
          crewName: null,
          noticeText: null,
        },
      };
    }

    return {
      pageData: functionResult.data,
    };
  } catch (error) {
    // 오류 발생 시 기본 데이터 반환
    return {
      pageData: {
        userName: "사용자",
        crewName: null,
        noticeText: null,
      },
    };
  }
}

export default async function HomePage() {
  const initialData = await getInitialHomeData();

  // 인증이 필요한 경우
  if (initialData.needsAuth) {
    redirect("/auth/login");
  }

  // 크루 인증이 필요한 경우
  if (initialData.needsCrewVerification) {
    redirect("/auth/verify-crew");
  }

  // 클라이언트 컴포넌트에 초기 데이터 전달
  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center min-h-screen bg-basic-black'>
          <div className='flex space-x-2'>
            <div className='w-2 h-2 bg-white rounded-full splash-dot'></div>
            <div className='w-2 h-2 bg-white rounded-full splash-dot'></div>
            <div className='w-2 h-2 bg-white rounded-full splash-dot'></div>
          </div>
        </div>
      }
    >
      <ClientHomePage initialData={initialData.pageData!} />
    </Suspense>
  );
}
