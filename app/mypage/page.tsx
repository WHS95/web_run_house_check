import React, { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { 사용자_컨텍스트_조회 } from "@/lib/access/user-context";
import * as 접근정책 from "@/lib/domain/access/policies";

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
        // 1. 사용자 컨텍스트 조회 (auth + status + 인증 크루 정보 1회 조회)
        const ctx = await 사용자_컨텍스트_조회();
        if (!ctx) {
            return { needsAuth: true };
        }

        // 2. 활성 상태 가드 — 어드민이 비활성화한 유저는 / 로 강제 이동
        if (
            !접근정책.크루멤버_접근가능한가({
                userStatus: ctx.userStatus,
                userCrewStatus: ctx.userCrewStatus,
                isCrewVerified: ctx.isCrewVerified,
            })
        ) {
            return { isDeactivated: true };
        }

        // 3. 통합 마이페이지 데이터 RPC 조회
        //    verifiedCrewId 는 컨텍스트에서 이미 확보 (별도 SELECT 제거)
        const supabase = await createClient();
        const { data: result, error } = await supabase
            .schema("attendance")
            .rpc("get_mypage_data_unified", { p_user_id: ctx.userId });

        if (error) {
            throw new Error(error.message);
        }

        // 4. 결과 처리
        if (!result.success) {
            if (result.error === "user_not_found") {
                return { needsAuth: true };
            }
            if (result.error === "crew_not_verified") {
                return { needsCrewVerification: true };
            }
            throw new Error(result.message || "알 수 없는 오류가 발생했습니다.");
        }

        // 5. 날짜 포맷 변환 + crewId 주입 (컨텍스트의 verifiedCrewId 사용)
        const { userProfile: profileData, activityData } = result.data;
        const userProfile = {
            ...profileData,
            crewId: ctx.verifiedCrewId,
            joinDate: profileData.joinDate
                ? new Date(profileData.joinDate).toLocaleDateString("ko-KR")
                : null,
        };

        return {
            userProfile,
            activityData,
            userId: ctx.userId,
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

    // 비활성화 유저는 홈으로 — 홈에서 ClientHomePage가 차단 모달 노출
    if (data.isDeactivated) {
        redirect("/");
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
