import { ReactNode } from "react";
// import { verifyAdminAuth } from "@/lib/admin-auth";
import { AdminContextProvider } from "./AdminContextProvider";

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

import { redirect } from "next/navigation";

export interface AdminAuthResult {
  userId: string;
  crewId: string;
  firstName: string;
}

/**
 * 서버 사이드에서 관리자 인증을 확인하는 공통 함수
 * @returns AdminAuthResult - 인증된 사용자 정보
 * @throws redirect - 인증 실패 시 적절한 페이지로 리다이렉트
 */
export async function verifyAdminAuth(): Promise<AdminAuthResult> {
  const supabase = await createClient();

  // 1. 사용자 인증 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // 2. 사용자의 crew 정보 조회
  const { data: userData, error: userDataError } = await supabase
    .schema("attendance")
    .from("users")
    .select("id, first_name, is_crew_verified, verified_crew_id")
    .eq("id", user.id)
    .single();

  if (userDataError || !userData) {
    redirect("/login");
  }

  // 3. crew 인증 확인
  if (!userData.is_crew_verified || !userData.verified_crew_id) {
    redirect("/crew-verification");
  }

  return {
    userId: userData.id,
    crewId: userData.verified_crew_id,
    firstName: userData.first_name || "",
  };
}

// 서버 컴포넌트 - Layout
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 서버사이드에서 한 번만 인증 체크
  const authData = await verifyAdminAuth();

  return (
    <AdminContextProvider
      crewId={authData.crewId}
      userId={authData.userId}
      firstName={authData.firstName}
    >
      {children}
    </AdminContextProvider>
  );
}
