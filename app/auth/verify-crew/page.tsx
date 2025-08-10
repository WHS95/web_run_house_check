import React from "react";
import { redirect } from "next/navigation";
import CrewVerificationForm from "@/components/auth/CrewVerificationForm";
import { createClient } from "@/lib/supabase-admin";

export default async function VerifyCrewPage() {
  const supabase = await createClient();

  // 현재 인증된 사용자 가져오기
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // console.log("user", user);

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
    // //console.error("사용자 정보를 가져오는 중 오류:", userDataError);
    redirect("/auth/signup");
  }

  // 이미 인증된 사용자는 홈페이지로 리다이렉트
  if (userData.is_crew_verified) {
    redirect("/");
  }

  return (
    <div className='flex flex-col justify-center items-center p-4 min-h-screen bg-gray-50'>
      <div className='space-y-8 w-full max-w-md'>
        <div className='text-center'>
          <p className='mt-2 text-sm text-gray-500'>
            크루 인증을 완료하여 런하우스 서비스를 이용하세요.
          </p>
        </div>

        <div className='mt-8'>
          <CrewVerificationForm />
        </div>
      </div>
    </div>
  );
}
