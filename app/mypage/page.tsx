import React, { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

// 동적 로딩으로 번들 크기 최적화
const MemberDetailTemplate = dynamic(
    () => import("@/components/templates/MemberDetailTemplate"),
    { ssr: true }
);

// 로딩 스켈레톤 컴포넌트 (animate-pulse 없는 정적 스켈레톤)
const MyPageSkeleton = () => (
    <div className='flex flex-col h-screen bg-rh-bg-primary'>
        <div className='flex-shrink-0 h-20 bg-rh-bg-surface border-b border-rh-border'>
            <div className='flex justify-center items-center h-full'>
                <div className='w-20 h-[1.5rem] rounded bg-rh-bg-muted'></div>
            </div>
        </div>
        <div className='flex-1 p-4 space-y-3'>
            <div className='flex items-center space-x-2'>
                <div className='w-[4rem] h-[4rem] rounded-full bg-rh-bg-surface'></div>
                <div className='flex-1 space-y-1'>
                    <div className='w-[128px] h-[1.5rem] rounded bg-rh-bg-surface'></div>
                    <div className='w-24 h-[1rem] rounded bg-rh-bg-surface'></div>
                </div>
            </div>
            <div className='h-[160px] rounded-lg bg-rh-bg-surface'></div>
            <div className='space-y-1.5'>
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className='h-16 bg-rh-bg-muted rounded-lg'></div>
                ))}
            </div>
        </div>
    </div>
);

// 서버에서 마이페이지 데이터 사전 로딩
async function getMyPageData() {
    try {
        const supabase = await createClient();

        // 1. 사용자 인증 확인
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return { needsAuth: true };
        }

        // 2. 통합 마이페이지 데이터 + 인증 크루 ID 병렬 조회
        //    (RPC는 crewId를 반환하지 않아 푸시 토큰 등록에 필요한 값을 별도로 조회)
        const [rpcResponse, crewIdResponse] = await Promise.all([
            supabase
                .schema("attendance")
                .rpc("get_mypage_data_unified", { p_user_id: user.id }),
            supabase
                .schema("attendance")
                .from("users")
                .select("verified_crew_id")
                .eq("id", user.id)
                .single(),
        ]);

        const { data: result, error } = rpcResponse;

        if (error) {
            throw new Error(error.message);
        }

        // 3. 결과 처리
        if (!result.success) {
            if (result.error === "user_not_found") {
                return { needsAuth: true };
            }
            if (result.error === "crew_not_verified") {
                return { needsCrewVerification: true };
            }
            throw new Error(result.message || "알 수 없는 오류가 발생했습니다.");
        }

        // 4. 날짜 포맷 변환 + crewId 주입
        const { userProfile: profileData, activityData } = result.data;
        const userProfile = {
            ...profileData,
            crewId: crewIdResponse.data?.verified_crew_id ?? null,
            joinDate: profileData.joinDate
                ? new Date(profileData.joinDate).toLocaleDateString("ko-KR")
                : null,
        };

        return {
            userProfile,
            activityData,
            userId: user.id,
        };
    } catch (error) {
        console.error("마이페이지 데이터 로딩 오류:", error);
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "데이터를 불러오지 못했습니다.",
        };
    }
}

export default async function MyPage() {
    const data = await getMyPageData();

    // 인증이 필요한 경우
    if (data.needsAuth) {
        redirect("/auth/login");
    }

    // 크루 인증이 필요한 경우
    if (data.needsCrewVerification) {
        redirect("/auth/verify-crew");
    }

    return (
        <Suspense fallback={<MyPageSkeleton />}>
            <MemberDetailTemplate
                userProfile={data.userProfile ?? null}
                activityData={data.activityData ?? {
                    attendanceCount: 0,
                    meetingsCreatedCount: 0,
                    activities: [],
                }}
                userId={data.userId}
            />
        </Suspense>
    );
}
