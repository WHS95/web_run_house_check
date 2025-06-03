import React from "react";

import { redirect } from "next/navigation";
import CrewVerificationForm from "@/components/auth/CrewVerificationForm";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // 서버 컴포넌트에서 쿠키를 설정하려고 할 때 발생하는 오류입니다.
            // Next.js 미들웨어가 세션을 새로고침해야 하므로 이 오류는 무시할 수 있습니다.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // 서버 컴포넌트에서 쿠키를 제거하려고 할 때 발생하는 오류입니다.
            // Next.js 미들웨어가 세션을 새로고침해야 하므로 이 오류는 무시할 수 있습니다.
          }
        },
      },
    }
  );
}

export default async function VerifyCrewPage() {
  const supabase = await createClient();

  // 현재 인증된 사용자 가져오기
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("user", user);

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
    console.error("사용자 정보를 가져오는 중 오류:", userDataError);
    redirect("/auth/signup");
  }

  // 이미 인증된 사용자는 홈페이지로 리다이렉트
  if (userData.is_crew_verified) {
    redirect("/");
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50'>
      <div className='w-full max-w-md space-y-8'>
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
