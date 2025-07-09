"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import MemberDetailTemplate from "@/components/templates/MemberDetailTemplate";

// ⚡ 타입 정의
interface UserProfileForMyPage {
  firstName: string | null;
  birthYear: number | null;
  joinDate: string | null;
  rankName: string | null;
  email: string | null;
  phone: string | null;
  profileImageUrl?: string | null;
  isAdmin: boolean;
}

interface Activity {
  type: "attendance" | "create_meeting";
  date: string;
  location: string;
  exerciseType: string;
}

interface ActivityData {
  attendanceCount: number;
  meetingsCreatedCount: number;
  activities: Activity[];
}

// ⚡ 로딩 스켈레톤 컴포넌트
const MyPageSkeleton = React.memo(() => (
  <div className='flex flex-col h-screen bg-basic-black'>
    <div className='flex-shrink-0 h-[80px] bg-basic-black-gray border-b border-gray-200 animate-pulse'>
      <div className='flex justify-center items-center h-full'>
        <div className='w-20 h-6 rounded bg-basic-black-gray'></div>
      </div>
    </div>
    <div className='flex-1 p-4 space-y-6 animate-pulse'>
      {/* 프로필 영역 */}
      <div className='flex items-center space-x-4'>
        <div className='w-16 h-16 rounded-full bg-basic-black-gray'></div>
        <div className='flex-1 space-y-2'>
          <div className='w-32 h-6 rounded bg-basic-black-gray'></div>
          <div className='w-24 h-4 rounded bg-basic-black-gray'></div>
        </div>
      </div>

      {/* 활동 그래프 영역 */}
      <div className='h-32 rounded-lg bg-basic-black-gray'></div>

      {/* 활동 내역 영역 */}
      <div className='space-y-3'>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className='h-16 bg-gray-200 rounded-lg'></div>
        ))}
      </div>
    </div>
  </div>
));
MyPageSkeleton.displayName = "MyPageSkeleton";

// ⚡ 메인 마이페이지 컴포넌트
export default function MyPage() {
  const router = useRouter();

  // ⚡ 상태 관리
  const [userProfile, setUserProfile] = useState<UserProfileForMyPage | null>(
    null
  );
  const [activityData, setActivityData] = useState<ActivityData>({
    attendanceCount: 0,
    meetingsCreatedCount: 0,
    activities: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ⚡ Supabase 클라이언트 (메모화)
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // ⚡ 데이터 로딩 - 통합 함수 사용으로 대폭 간소화
  useEffect(() => {
    const loadMyPageData = async () => {
      try {
        // 1. 사용자 인증 확인
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push("/auth/login");
          return;
        }

        // 2. 통합 마이페이지 데이터 조회 (4-5번 통신 → 1번 통신)
        const { data: result, error } = await supabase
          .schema("attendance")
          .rpc("get_mypage_data_unified", {
            p_user_id: user.id,
          });

        if (error) {
          console.error("마이페이지 데이터 조회 오류:", error);
          throw new Error(error.message);
        }

        // 3. 결과 처리
        if (!result.success) {
          if (result.error === "user_not_found") {
            router.push("/auth/login");
            return;
          }
          if (result.error === "crew_not_verified") {
            router.push("/auth/verify-crew");
            return;
          }
          throw new Error(result.message || "알 수 없는 오류가 발생했습니다.");
        }

        // 4. 상태 업데이트
        const { userProfile: profileData, activityData: activityInfo } =
          result.data;

        // 날짜 포맷 변환 (YYYY-MM-DD → 한국어 형식)
        const formattedProfile = {
          ...profileData,
          joinDate: profileData.joinDate
            ? new Date(profileData.joinDate).toLocaleDateString("ko-KR")
            : null,
        };

        setUserProfile(formattedProfile);
        console.log("1231231", activityInfo);
        setActivityData(activityInfo);
      } catch (error) {
        console.error("마이페이지 데이터 로딩 오류:", error);
        setError(
          error instanceof Error
            ? error.message
            : "데이터를 불러오지 못했습니다."
        );

        // 에러 발생 시 기본값 설정
        setUserProfile({
          firstName: "사용자",
          email: null,
          birthYear: null,
          joinDate: null,
          phone: null,
          rankName: "Beginer",
          profileImageUrl: null,
          isAdmin: false,
        });
        setActivityData({
          attendanceCount: 0,
          meetingsCreatedCount: 0,
          activities: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMyPageData();
  }, [supabase, router]);

  // ⚡ 로딩 중일 때 스켈레톤 표시
  if (isLoading) {
    return <MyPageSkeleton />;
  }

  // ⚡ 에러 상태 처리
  if (error) {
    console.warn("마이페이지 에러:", error);
    // 에러가 있어도 기본 데이터로 렌더링 (사용자 경험 개선)
  }

  return (
    <MemberDetailTemplate
      userProfile={userProfile}
      activityData={activityData}
    />
  );
}
