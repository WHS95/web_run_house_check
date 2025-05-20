"use client";

import { createClient } from "./client";
import { createClient as createServerClient } from "./server";

/**
 * 랜덤한 7자리 크루 초대 코드를 생성합니다.
 * 영문 대문자만 포함합니다.
 */
export function generateInviteCode(length: number = 7): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * 크루 초대 코드를 생성합니다. (관리자 전용)
 */
export async function createCrewInviteCode(
  crewId: string,
  options?: {
    description?: string;
    maxUses?: number;
    expiresAt?: Date;
  }
) {
  try {
    const supabase = createClient();
    const inviteCode = generateInviteCode();

    const { data, error } = await supabase
      .from("crew_invite_codes")
      .insert({
        crew_id: crewId,
        invite_code: inviteCode,
        description: options?.description || null,
        max_uses: options?.maxUses || null,
        expires_at: options?.expiresAt || null,
      })
      .select("*")
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("크루 초대 코드 생성 오류:", error);
    return { data: null, error };
  }
}

/**
 * 크루 초대 코드의 유효성을 검증합니다.
 */
export async function verifyCrewInviteCode(inviteCode: string) {
  try {
    const supabase = createClient();

    // 코드 조회
    const { data: codeData, error: codeError } = await supabase
      .from("crew_invite_codes")
      .select("*, crews:crew_id(id, name)")
      .eq("invite_code", inviteCode)
      .single();

    if (codeError) throw codeError;

    // 유효성 검증
    const now = new Date();
    const isExpired =
      codeData.expires_at && new Date(codeData.expires_at) < now;
    const isUsedUp =
      codeData.max_uses && codeData.used_count >= codeData.max_uses;

    if (!codeData.is_active) {
      return {
        isValid: false,
        reason: "비활성화된 초대 코드입니다.",
        data: null,
      };
    }

    if (isExpired) {
      return { isValid: false, reason: "만료된 초대 코드입니다.", data: null };
    }

    if (isUsedUp) {
      return {
        isValid: false,
        reason: "사용 횟수가 초과된 초대 코드입니다.",
        data: null,
      };
    }

    return {
      isValid: true,
      reason: null,
      data: {
        id: codeData.id,
        crewId: codeData.crew_id,
        crewName: codeData.crews.name,
      },
    };
  } catch (error) {
    console.error("크루 초대 코드 검증 오류:", error);
    return {
      isValid: false,
      reason: "유효하지 않은 초대 코드입니다.",
      data: null,
    };
  }
}

/**
 * 크루 초대 코드를 사용하여 사용자를 크루에 인증합니다.
 */
export async function verifyUserWithCrewCode(
  userId: string,
  inviteCodeId: number,
  crewId: string
) {
  try {
    const supabase = createClient();

    // 1. 사용자 테이블 업데이트
    const { error: userError } = await supabase
      .from("users")
      .update({
        verified_crew_id: crewId,
        is_crew_verified: true,
      })
      .eq("id", userId);

    if (userError) throw userError;

    // 2. 사용자-크루 매핑 테이블에 추가 (이미 있으면 무시)
    const { error: mappingError } = await supabase.rpc("upsert_user_crew", {
      p_user_id: userId,
      p_crew_id: crewId,
    });

    if (mappingError) throw mappingError;

    // 3. 코드 사용 로그 기록
    const { error: logError } = await supabase
      .from("invite_code_usage_logs")
      .insert({
        invite_code_id: inviteCodeId,
        user_id: userId,
        user_agent: window.navigator.userAgent,
      });

    if (logError) throw logError;

    return { success: true, error: null };
  } catch (error) {
    console.error("크루 인증 오류:", error);
    return { success: false, error };
  }
}

/**
 * 현재 사용자의 크루 인증 상태를 확인합니다.
 */
export async function checkUserCrewVerification() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { isVerified: false, crewData: null, error: userError };
    }

    // 사용자 정보 조회
    const { data: userData, error: dataError } = await supabase
      .from("users")
      .select(
        "is_crew_verified, verified_crew_id, crews:verified_crew_id(id, name)"
      )
      .eq("id", user.id)
      .single();

    if (dataError) throw dataError;

    return {
      isVerified: userData.is_crew_verified,
      crewData: userData.is_crew_verified ? userData.crews : null,
      error: null,
    };
  } catch (error) {
    console.error("크루 인증 상태 확인 오류:", error);
    return { isVerified: false, crewData: null, error };
  }
}

/**
 * 서버 컴포넌트에서 사용자의 크루 인증 상태를 확인합니다.
 */
export async function checkUserCrewVerificationServer(userId: string) {
  try {
    const supabase = await createServerClient();

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
    console.error("서버에서 크루 인증 상태 확인 오류:", error);
    return { isVerified: false, crewData: null, error };
  }
}
