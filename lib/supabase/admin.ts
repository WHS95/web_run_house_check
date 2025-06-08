"use server";

// import { createClient } from "./server";
import { generateInviteCode } from "./crew-auth";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

/**
 * 모든 크루 목록을 가져옵니다.
 */
export async function getAllCrews() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("attendance")
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
      .schema("attendance")
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
      .schema("attendance")
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
      .schema("attendance")
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
      .schema("attendance")
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
                users:created_by(email, first_name)
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
      .schema("attendance")
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
      .schema("attendance")
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
  first_name: string;
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
      .schema("attendance")
      .from("user_crews")
      .select(
        `
                id,
                users (
                    id,
                    email,
                    first_name,
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
      .schema("attendance")
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
      .schema("attendance")
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
                    first_name,
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
      .schema("attendance")
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

export interface UserForAdmin {
  id: string;
  email: string | null;
  first_name: string;
  birth_year: number | null;
  phone: string | null;
  profile_image_url: string | null;
  is_crew_verified: boolean;
  verified_crew_id: string | null;
  created_at: string;
  join_date: string | null;
  status: string | null; // NULL이면 활성, 'suspended' 등이면 비활성
  last_attendance_date: string | null;
}

interface GetAllUsersReturn {
  data: UserForAdmin[] | null;
  error: Error | null;
}

/**
 * 모든 사용자 목록을 가져옵니다 (관리자용).
 */
export async function getAllUsers(): Promise<GetAllUsersReturn> {
  try {
    const supabase = await createClient();

    // 사용자 기본 정보와 최근 출석 정보를 함께 조회
    const { data, error } = await supabase
      .schema("attendance")
      .from("users")
      .select(
        `
        id,
        email,
        first_name,
        birth_year,
        phone,
        profile_image_url,
        is_crew_verified,
        verified_crew_id,
        created_at,
        join_date,
        status
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("사용자 목록 조회 오류 (Supabase):", error);
      return { data: null, error: new Error(error.message) };
    }

    if (!data) return { data: [], error: null };

    // 각 사용자의 최근 출석 정보를 별도로 조회 (삭제되지 않은 기록만)
    const usersWithAttendance: UserForAdmin[] = [];

    for (const user of data) {
      // 최근 출석 정보 조회 (soft delete 적용)
      const { data: attendanceData } = await supabase
        .schema("attendance")
        .from("attendance_records")
        .select("attendance_timestamp")
        .eq("user_id", user.id)
        .is("deleted_at", null) // 삭제되지 않은 기록만
        .order("attendance_timestamp", { ascending: false })
        .limit(1);

      const userWithAttendance: UserForAdmin = {
        ...user,
        last_attendance_date: attendanceData?.[0]?.attendance_timestamp || null,
      };

      usersWithAttendance.push(userWithAttendance);
    }

    return { data: usersWithAttendance, error: null };
  } catch (error: any) {
    console.error("사용자 목록 조회 오류 (Catch):", error);
    return {
      data: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 사용자 상태를 업데이트합니다 (활성/비활성)
 */
export async function updateUserStatus(userId: string, isActive: boolean) {
  try {
    const supabase = await createClient();

    const updateData: any = {
      status: isActive ? "active" : "suspended",
      updated_at: new Date().toISOString(),
    };

    if (!isActive) {
      updateData.suspended_at = new Date().toISOString();
    } else {
      updateData.suspended_at = null;
    }

    const { data, error } = await supabase
      .schema("attendance")
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("사용자 상태 업데이트 오류:", error);
    return { data: null, error };
  }
}

/**
 * 사용자 정보를 업데이트합니다 (이름, 연락처, 출생년도)
 */
export async function updateUserInfo(
  userId: string,
  updates: {
    first_name?: string;
    phone?: string;
    birth_year?: number;
  }
) {
  try {
    const supabase = await createClient();

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .schema("attendance")
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("사용자 정보 업데이트 오류:", error);
    return { data: null, error };
  }
}

/**
 * 특정 크루의 사용자 목록을 가져옵니다.
 */
export async function getUsersByCrewId(
  crewId: string
): Promise<GetAllUsersReturn> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("attendance")
      .from("users")
      .select(
        `
        id,
        email,
        first_name,
        birth_year,
        phone,
        profile_image_url,
        is_crew_verified,
        verified_crew_id,
        created_at,
        join_date,
        status
      `
      )
      .eq("verified_crew_id", crewId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("크루별 사용자 목록 조회 오류 (Supabase):", error);
      return { data: null, error: new Error(error.message) };
    }

    if (!data) return { data: [], error: null };

    // 각 사용자의 최근 출석 정보를 별도로 조회 (삭제되지 않은 기록만)
    const usersWithAttendance: UserForAdmin[] = [];

    for (const user of data) {
      // 최근 출석 정보 조회 (soft delete 적용)
      const { data: attendanceData } = await supabase
        .schema("attendance")
        .from("attendance_records")
        .select("attendance_timestamp")
        .eq("user_id", user.id)
        .eq("crew_id", crewId) // 크루 ID 조건 추가
        .is("deleted_at", null) // 삭제되지 않은 기록만
        .order("attendance_timestamp", { ascending: false })
        .limit(1);
      // console.log("--------------------------------");
      // console.log("user.id", user.id);
      // console.log("attendanceData", attendanceData);

      const userWithAttendance: UserForAdmin = {
        ...user,
        last_attendance_date: attendanceData?.[0]?.attendance_timestamp || null,
      };

      usersWithAttendance.push(userWithAttendance);
    }

    return { data: usersWithAttendance, error: null };
  } catch (error: any) {
    console.error("크루별 사용자 목록 조회 오류 (Catch):", error);
    return {
      data: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

// ==================== 출석 관리 관련 함수들 ====================

/**
 * 출석 기록 인터페이스
 */
export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  checkInTime: string;
  location: string;
  exerciseType: string;
  status: "present" | "absent";
  isHost: boolean;
  deletedAt?: string | null; // soft delete 필드 추가
}

/**
 * 날짜별 출석 요약 인터페이스
 */
export interface AttendanceSummary {
  date: string; // yyyy-mm-dd 형식
  count: number; // 출석자 수
}

/**
 * 날짜별 출석 상세 데이터 타입
 */
export type AttendanceDetailData = {
  [key: string]: AttendanceRecord[];
};

/**
 * 특정 크루의 월별 출석 요약을 가져옵니다. (삭제되지 않은 기록만)
 */
export async function getMonthlyAttendanceSummary(
  crewId: string,
  year: number,
  month: number
): Promise<{ data: AttendanceSummary[] | null; error: Error | null }> {
  try {
    const supabase = await createClient();

    // 해당 월의 시작일과 종료일 계산
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const { data, error } = await supabase
      .schema("attendance")
      .from("attendance_records")
      .select(
        `
        attendance_timestamp
      `
      )
      .eq("crew_id", crewId)
      .is("deleted_at", null) // 삭제되지 않은 기록만
      .gte("attendance_timestamp", startDateStr)
      .lte("attendance_timestamp", endDateStr + "T23:59:59.999Z")
      .order("attendance_timestamp");

    if (error) {
      console.error("월별 출석 요약 조회 오류:", error);
      return { data: null, error: new Error(error.message) };
    }

    // 날짜별로 그룹화하여 카운트
    const summaryMap: { [key: string]: number } = {};

    data.forEach((record) => {
      const date = new Date(record.attendance_timestamp)
        .toISOString()
        .split("T")[0];
      summaryMap[date] = (summaryMap[date] || 0) + 1;
    });

    const summary: AttendanceSummary[] = Object.entries(summaryMap).map(
      ([date, count]) => ({
        date,
        count,
      })
    );

    return { data: summary, error: null };
  } catch (error: any) {
    console.error("월별 출석 요약 조회 오류:", error);
    return {
      data: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 특정 날짜의 출석 상세 기록을 가져옵니다. (삭제되지 않은 기록만)
 */
export async function getDailyAttendanceDetails(
  crewId: string,
  date: string // yyyy-mm-dd 형식
): Promise<{ data: AttendanceRecord[] | null; error: Error | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("attendance")
      .from("attendance_records")
      .select(
        `
        id,
        user_id,
        attendance_timestamp,
        location,
        is_host,
        deleted_at,
        users:user_id (
          first_name
        ),
        exercise_types!attendance_records_exercise_type_id_fkey (
          name
        )
      `
      )
      .eq("crew_id", crewId)
      .is("deleted_at", null) // 삭제되지 않은 기록만
      .gte("attendance_timestamp", date + "T00:00:00.000Z")
      .lte("attendance_timestamp", date + "T23:59:59.999Z")
      .order("attendance_timestamp");

    if (error) {
      console.error("일별 출석 상세 조회 오류:", error);
      return { data: null, error: new Error(error.message) };
    }

    // 데이터 변환
    const attendanceRecords: AttendanceRecord[] = data.map((record: any) => ({
      id: record.id,
      userId: record.user_id,
      userName: record.users?.first_name || "알 수 없음",
      checkInTime: record.attendance_timestamp,
      location: record.location || "위치 정보 없음",
      exerciseType: record.exercise_types?.name || "기타",
      status: "present" as const, // 출석 기록이 있으면 출석으로 간주
      isHost: record.is_host,
      deletedAt: record.deleted_at,
    }));

    return { data: attendanceRecords, error: null };
  } catch (error: any) {
    console.error("일별 출석 상세 조회 오류:", error);
    return {
      data: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 특정 크루의 월별 출석 데이터를 모두 가져옵니다. (삭제되지 않은 기록만)
 */
export async function getMonthlyAttendanceData(
  crewId: string,
  year: number,
  month: number
): Promise<{
  summary: AttendanceSummary[] | null;
  detailData: AttendanceDetailData | null;
  error: Error | null;
}> {
  try {
    // 월별 요약 데이터 가져오기
    const { data: summary, error: summaryError } =
      await getMonthlyAttendanceSummary(crewId, year, month);

    if (summaryError) {
      return { summary: null, detailData: null, error: summaryError };
    }

    // 각 날짜별 상세 데이터 가져오기
    const detailData: AttendanceDetailData = {};

    if (summary) {
      for (const item of summary) {
        const { data: dailyData, error: dailyError } =
          await getDailyAttendanceDetails(crewId, item.date);

        if (dailyError) {
          console.error(`${item.date} 출석 상세 조회 오류:`, dailyError);
          continue;
        }

        if (dailyData) {
          detailData[item.date] = dailyData;
        }
      }
    }

    return { summary, detailData, error: null };
  } catch (error: any) {
    console.error("월별 출석 데이터 조회 오류:", error);
    return {
      summary: null,
      detailData: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 출석 기록을 soft delete 합니다.
 */
export async function deleteAttendanceRecord(recordId: string) {
  try {
    const supabase = await createClient();

    // 실제 삭제 대신 deleted_at 필드를 현재 시간으로 설정
    const { data, error } = await supabase
      .schema("attendance")
      .from("attendance_records")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", recordId)
      .is("deleted_at", null) // 이미 삭제된 기록은 제외
      .select();

    if (error) {
      console.error("출석 기록 삭제 오류:", error);
      return { success: false, error: new Error(error.message) };
    }

    // 업데이트된 행이 없으면 이미 삭제되었거나 존재하지 않는 기록
    if (!data || data.length === 0) {
      return {
        success: false,
        error: new Error("삭제할 출석 기록을 찾을 수 없습니다."),
      };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("출석 기록 삭제 오류:", error);
    return {
      success: false,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 삭제된 출석 기록을 복원합니다.
 */
export async function restoreAttendanceRecord(recordId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("attendance")
      .from("attendance_records")
      .update({
        deleted_at: null,
      })
      .eq("id", recordId)
      .not("deleted_at", "is", null) // 삭제된 기록만 복원
      .select();

    if (error) {
      console.error("출석 기록 복원 오류:", error);
      return { success: false, error: new Error(error.message) };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: new Error("복원할 출석 기록을 찾을 수 없습니다."),
      };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("출석 기록 복원 오류:", error);
    return {
      success: false,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 삭제된 출석 기록들을 조회합니다. (관리자용)
 */
export async function getDeletedAttendanceRecords(
  crewId: string,
  limit: number = 50
): Promise<{ data: AttendanceRecord[] | null; error: Error | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("attendance")
      .from("attendance_records")
      .select(
        `
        id,
        user_id,
        attendance_timestamp,
        location,
        is_host,
        deleted_at,
        users:user_id (
          first_name
        ),
        exercise_types!attendance_records_exercise_type_id_fkey (
          name
        )
      `
      )
      .eq("crew_id", crewId)
      .not("deleted_at", "is", null) // 삭제된 기록만
      .order("deleted_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("삭제된 출석 기록 조회 오류:", error);
      return { data: null, error: new Error(error.message) };
    }

    // 데이터 변환
    const attendanceRecords: AttendanceRecord[] = data.map((record: any) => ({
      id: record.id,
      userId: record.user_id,
      userName: record.users?.first_name || "알 수 없음",
      checkInTime: record.attendance_timestamp,
      location: record.location || "위치 정보 없음",
      exerciseType: record.exercise_types?.name || "기타",
      status: "present" as const,
      isHost: record.is_host,
      deletedAt: record.deleted_at,
    }));

    return { data: attendanceRecords, error: null };
  } catch (error: any) {
    console.error("삭제된 출석 기록 조회 오류:", error);
    return {
      data: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

// ==================== 크루 설정 관리 관련 함수들 ====================

/**
 * 크루 모임 장소 인터페이스
 */
export interface CrewLocation {
  id: number;
  crewId: string;
  name: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GetCrewLocationsReturn {
  data: CrewLocation[] | null;
  error: Error | null;
}

/**
 * 특정 크루의 모임 장소 목록을 가져옵니다.
 */
export async function getCrewLocations(
  crewId: string
): Promise<GetCrewLocationsReturn> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("attendance")
      .from("crew_locations")
      .select(
        `
        id,
        crew_id,
        name,
        description,
        latitude,
        longitude,
        is_active,
        created_at,
        updated_at
      `
      )
      .eq("crew_id", crewId)
      .eq("is_active", true) // 활성화된 장소만
      .order("name");

    if (error) {
      console.error("크루 모임 장소 조회 오류:", error);
      return { data: null, error: new Error(error.message) };
    }

    if (!data) return { data: [], error: null };

    const locations: CrewLocation[] = data.map((location) => ({
      id: location.id,
      crewId: location.crew_id,
      name: location.name,
      description: location.description,
      latitude: location.latitude,
      longitude: location.longitude,
      isActive: location.is_active,
      createdAt: location.created_at,
      updatedAt: location.updated_at,
    }));

    return { data: locations, error: null };
  } catch (error: any) {
    console.error("크루 모임 장소 조회 오류:", error);
    return {
      data: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 새로운 크루 모임 장소를 추가합니다.
 */
export async function createCrewLocation(
  crewId: string,
  locationData: {
    name: string;
    description?: string;
    latitude?: number;
    longitude?: number;
  }
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("attendance")
      .from("crew_locations")
      .insert({
        crew_id: crewId,
        name: locationData.name,
        description: locationData.description || null,
        latitude: locationData.latitude || null,
        longitude: locationData.longitude || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("크루 모임 장소 생성 오류:", error);
      return { data: null, error: new Error(error.message) };
    }

    const location: CrewLocation = {
      id: data.id,
      crewId: data.crew_id,
      name: data.name,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { data: location, error: null };
  } catch (error: any) {
    console.error("크루 모임 장소 생성 오류:", error);
    return {
      data: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 크루 모임 장소 정보를 업데이트합니다.
 */
export async function updateCrewLocation(
  locationId: number,
  updates: {
    name?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
  }
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("attendance")
      .from("crew_locations")
      .update(updates)
      .eq("id", locationId)
      .select()
      .single();

    if (error) {
      console.error("크루 모임 장소 업데이트 오류:", error);
      return { data: null, error: new Error(error.message) };
    }

    const location: CrewLocation = {
      id: data.id,
      crewId: data.crew_id,
      name: data.name,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { data: location, error: null };
  } catch (error: any) {
    console.error("크루 모임 장소 업데이트 오류:", error);
    return {
      data: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 크루 모임 장소를 비활성화합니다 (soft delete).
 */
export async function deleteCrewLocation(locationId: number) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("attendance")
      .from("crew_locations")
      .update({ is_active: false })
      .eq("id", locationId)
      .select()
      .single();

    if (error) {
      console.error("크루 모임 장소 삭제 오류:", error);
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("크루 모임 장소 삭제 오류:", error);
    return {
      success: false,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 크루 기본 정보를 업데이트합니다.
 */
export async function updateCrewSettings(
  crewId: string,
  updates: {
    name?: string;
    description?: string;
    profileImageUrl?: string;
  }
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("attendance")
      .from("crews")
      .update({
        name: updates.name,
        description: updates.description,
        profile_image_url: updates.profileImageUrl,
      })
      .eq("id", crewId)
      .select()
      .single();

    if (error) {
      console.error("크루 설정 업데이트 오류:", error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error("크루 설정 업데이트 오류:", error);
    return {
      data: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 크루에서 사용 가능한 운동 종류 목록을 가져옵니다.
 */
export async function getCrewExerciseTypes(crewId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("attendance")
      .from("crew_exercise_types")
      .select(
        `
        exercise_types:exercise_type_id (
          id,
          name
        )
      `
      )
      .eq("crew_id", crewId);

    if (error) {
      console.error("크루 운동 종류 조회 오류:", error);
      return { data: null, error: new Error(error.message) };
    }

    const exerciseTypes = data
      .map((item: any) => item.exercise_types)
      .filter(Boolean);

    return { data: exerciseTypes, error: null };
  } catch (error: any) {
    console.error("크루 운동 종류 조회 오류:", error);
    return {
      data: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 모든 운동 종류 목록을 가져옵니다.
 */
export async function getAllExerciseTypes() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("attendance")
      .from("exercise_types")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("운동 종류 조회 오류:", error);
      return { data: null, error: new Error(error.message) };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error("운동 종류 조회 오류:", error);
    return {
      data: null,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 크루에 운동 종류를 추가합니다.
 */
export async function addCrewExerciseType(
  crewId: string,
  exerciseTypeId: number
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .schema("attendance")
      .from("crew_exercise_types")
      .insert({
        crew_id: crewId,
        exercise_type_id: exerciseTypeId,
      })
      .select();

    if (error) {
      console.error("크루 운동 종류 추가 오류:", error);
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("크루 운동 종류 추가 오류:", error);
    return {
      success: false,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 크루에서 운동 종류를 제거합니다.
 */
export async function removeCrewExerciseType(
  crewId: string,
  exerciseTypeId: number
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .schema("attendance")
      .from("crew_exercise_types")
      .delete()
      .eq("crew_id", crewId)
      .eq("exercise_type_id", exerciseTypeId);

    if (error) {
      console.error("크루 운동 종류 제거 오류:", error);
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("크루 운동 종류 제거 오류:", error);
    return {
      success: false,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}

/**
 * 출석 기록 정보를 업데이트합니다.
 */
export async function updateAttendanceRecord(
  recordId: string,
  updates: {
    checkInTime?: string;
    location?: string;
    isHost?: boolean;
  }
) {
  try {
    const supabase = await createClient();

    const updateData: any = {};

    if (updates.checkInTime) {
      updateData.attendance_timestamp = updates.checkInTime;
    }
    if (updates.location !== undefined) {
      updateData.location = updates.location;
    }
    if (updates.isHost !== undefined) {
      updateData.is_host = updates.isHost;
    }

    const { data, error } = await supabase
      .schema("attendance")
      .from("attendance_records")
      .update(updateData)
      .eq("id", recordId)
      .is("deleted_at", null) // 삭제되지 않은 기록만 업데이트
      .select()
      .single();

    if (error) {
      console.error("출석 기록 업데이트 오류:", error);
      return { success: false, error: new Error(error.message) };
    }

    if (!data) {
      return {
        success: false,
        error: new Error("업데이트할 출석 기록을 찾을 수 없습니다."),
      };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("출석 기록 업데이트 오류:", error);
    return {
      success: false,
      error: new Error(error.message || "알 수 없는 오류 발생"),
    };
  }
}
