import React from "react";
import { redirect } from "next/navigation";
import CrewVerificationForm from "@/components/auth/CrewVerificationForm";
import { createClient } from "@/lib/supabase-admin";
import PageHeader from "@/components/organisms/common/PageHeader";

export default async function VerifyCrewPage() {
    const supabase = await createClient();

    // 현재 인증된 사용자 가져오기
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    if (userError || !user) {
        redirect("/auth/login");
    }

    // 사용자가 이미 크루에 인증되어 있는지 확인
    const { data: userData, error: userDataError } = await supabase
        .schema("attendance")
        .from("users")
        .select(
            `is_crew_verified,
       verified_crew_id,
       crews:verified_crew_id (id, name)`
        )
        .eq("id", user.id)
        .single();

    // 사용자 데이터를 가져오는데 오류가 있으면 로그인 페이지로 리다이렉트
    if (userDataError) {
        redirect("/auth/signup");
    }

    // 이미 인증된 사용자는 홈페이지로 리다이렉트
    if (userData.is_crew_verified) {
        redirect("/");
    }

    return (
        <div className='flex flex-col h-screen bg-rh-bg-primary'>
            {/* 헤더 */}
            <div className='flex-shrink-0 bg-rh-bg-surface border-b border-rh-border'>
                <PageHeader
                    title='크루 인증'
                    backLink='/auth/login'
                    iconColor='white'
                    borderColor='border-rh-border'
                    backgroundColor='bg-rh-bg-surface'
                />
            </div>

            {/* 콘텐츠 */}
            <div className='flex-1 flex items-center justify-center px-6'>
                <CrewVerificationForm />
            </div>
        </div>
    );
}
