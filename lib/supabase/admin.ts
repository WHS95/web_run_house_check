"use server";

import { createClient } from "./server";
import { generateInviteCode } from "./crew-auth";

/**
 * 모든 크루 목록을 가져옵니다.
 */
export async function getAllCrews() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("crews")
      .select(
        `
                id,
                name,
                description,
                created_at,
                updated_at,
                crew_members:user_crews(count),
                invite_codes:crew_invite_codes(count)
            `
      )
      .order("name");

    if (error) {
      console.error("크루 목록 조회 오류 (Supabase):", error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error("크루 목록 조회 오류 (Catch):", error);
    return {
      data: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 특정 크루 정보를 가져옵니다.
 */
export async function getCrewById(crewId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("crews")
      .select(
        `
                id,
                name,
                description,
                created_at,
                updated_at
            `
      )
      .eq("id", crewId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("크루 정보 조회 오류:", error);
    return { data: null, error };
  }
}

/**
 * 새 크루를 생성합니다.
 */
export async function createCrew(name: string, description?: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("crews")
      .insert({
        name,
        description: description || null,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("크루 생성 오류:", error);
    return { data: null, error };
  }
}

/**
 * 크루 정보를 업데이트합니다.
 */
export async function updateCrew(
  crewId: string,
  updates: { name?: string; description?: string }
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("crews")
      .update(updates)
      .eq("id", crewId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("크루 업데이트 오류:", error);
    return { data: null, error };
  }
}

/**
 * 특정 크루의 초대 코드 목록을 가져옵니다.
 */
export async function getCrewInviteCodes(crewId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("crew_invite_codes")
      .select(
        `
                id,
                invite_code,
                description,
                is_active,
                max_uses,
                used_count,
                expires_at,
                created_at,
                created_by,
                users:created_by(email, display_name)
            `
      )
      .eq("crew_id", crewId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("초대 코드 목록 조회 오류 (Supabase):", error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error("초대 코드 목록 조회 오류 (Catch):", error);
    return {
      data: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 크루 초대 코드를 생성합니다.
 */
export async function createCrewInviteCode(
  crewId: string,
  userId: string,
  options?: {
    description?: string;
    maxUses?: number;
    expiresAt?: Date;
  }
) {
  try {
    const supabase = await createClient();
    const inviteCode = generateInviteCode();

    const { data, error } = await supabase
      .from("crew_invite_codes")
      .insert({
        crew_id: crewId,
        invite_code: inviteCode,
        description: options?.description || null,
        max_uses: options?.maxUses || null,
        expires_at: options?.expiresAt || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("초대 코드 생성 오류:", error);
    return { data: null, error };
  }
}

/**
 * 초대 코드 상태를 토글합니다 (활성/비활성).
 */
export async function toggleInviteCodeStatus(
  codeId: number,
  isActive: boolean
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("crew_invite_codes")
      .update({ is_active: isActive })
      .eq("id", codeId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("초대 코드 상태 변경 오류:", error);
    return { data: null, error };
  }
}

interface UserForCrew {
  id: string;
  email: string | null;
  display_name: string | null;
  profile_image_url: string | null;
  is_crew_verified: boolean;
  verified_crew_id: string | null;
  created_at: string;
}

export interface CrewMember extends UserForCrew {
  user_crew_id: string;
}

interface GetCrewMembersReturn {
  data: CrewMember[] | null;
  error: Error | null;
}

/**
 * 크루에 소속된 회원 목록을 가져옵니다.
 */
export async function getCrewMembers(
  crewId: string
): Promise<GetCrewMembersReturn> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_crews")
      .select(
        `
                id,
                users (
                    id,
                    email,
                    display_name,
                    profile_image_url,
                    is_crew_verified,
                    verified_crew_id,
                    created_at
                )
            `
      )
      .eq("crew_id", crewId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("크루 회원 목록 조회 오류 (Supabase):", error);
      return { data: null, error: new Error(error.message) };
    }
    if (!data) return { data: [], error: null };

    const members: CrewMember[] = data
      .filter((item) => item.users !== null)
      .map((item) => ({
        ...(item.users as unknown as UserForCrew),
        user_crew_id: item.id,
      }));

    return { data: members, error: null };
  } catch (error: any) {
    console.error("크루 회원 목록 조회 오류 (Catch):", error);
    return {
      data: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 사용자의 크루 소속을 제거합니다.
 */
export async function removeUserFromCrew(userCrewId: string) {
  try {
    const supabase = await createClient();

    // 1. 유저-크루 매핑 삭제
    const { error } = await supabase
      .from("user_crews")
      .delete()
      .eq("id", userCrewId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("크루 회원 제거 오류:", error);
    return { success: false, error };
  }
}

/**
 * 초대 코드 사용 로그를 조회합니다.
 */
export async function getInviteCodeUsageLogs(codeId: number) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("invite_code_usage_logs")
      .select(
        `
                id,
                used_at,
                user_ip,
                user_agent,
                users:user_id (
                    id,
                    email,
                    display_name,
                    profile_image_url
                )
            `
      )
      .eq("invite_code_id", codeId)
      .order("used_at", { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("초대 코드 사용 로그 조회 오류:", error);
    return { data: null, error };
  }
}

/**
 * 사용자가 슈퍼 관리자인지 확인합니다.
 */
export async function checkIsSuperAdmin(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("admin_roles")
      .select("is_super_admin")
      .eq("user_id", userId)
      .single();

    if (error) {
      // 데이터가 없는 경우 (관리자가 아님)
      if (error.code === "PGRST116") {
        return { isSuperAdmin: false, error: null };
      }
      throw error;
    }

    return { isSuperAdmin: data?.is_super_admin || false, error: null };
  } catch (error) {
    console.error("슈퍼 관리자 확인 오류:", error);
    return { isSuperAdmin: false, error };
  }
}
