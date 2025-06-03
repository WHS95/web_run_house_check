import { createClient } from "@/lib/supabase/server";
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
