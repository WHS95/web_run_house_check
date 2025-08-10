"use server";

import { createClient } from "./server";

/**
 * 서버 컴포넌트에서 사용자의 크루 인증 상태를 확인합니다.
 */
export async function checkUserCrewVerificationServer(userId: string) {
  try {
    const supabase = await createClient();

    // 사용자 정보 조회
    const { data: userData, error: dataError } = await supabase
      .from("users")
      .select(
        "is_crew_verified, verified_crew_id, crews:verified_crew_id(id, name)"
      )
      .eq("id", userId)
      .single();

    if (dataError) throw dataError;

    return {
      isVerified: userData.is_crew_verified,
      crewData: userData.is_crew_verified ? userData.crews : null,
      error: null,
    };
  } catch (error) {
    //console.error("서버에서 크루 인증 상태 확인 오류:", error);
    return { isVerified: false, crewData: null, error };
  }
}
