import { createClient } from "./supabase-admin";

export interface AdminStats {
  totalMembers: number;
  todayAttendance: number;
  todayMeetingCount: number;
  newMembersThisMonth: number;
  newMembersThisMonthChange: number | null;
  monthlyMeetingCount: number;
  monthlyMeetingCountChange: number | null;
  monthlyParticipationCount: number;
  monthlyParticipationCountChange: number | null;
  monthlyParticipantCount: number;
  monthlyParticipantCountChange: number | null;
  monthlyHostCount: number;
  monthlyHostCountChange: number | null;
}

// 총 회원 수 조회 (해당 crew에 속한 회원)
export async function getTotalMembers(crewId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .schema("attendance")
    .from("user_crews")
    .select("*", { count: "exact", head: true })
    .eq("crew_id", crewId);

  if (error) {
    console.error("Error fetching total members:", error);
    return 0;
  }

  return count || 0;
}

// 오늘 출석 수 조회 (해당 crew 기준)
export async function getTodayAttendance(crewId: string): Promise<number> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { count, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("*", { count: "exact", head: true })
    .eq("crew_id", crewId)
    .gte("attendance_timestamp", `${today}T00:00:00.000Z`)
    .lt("attendance_timestamp", `${today}T23:59:59.999Z`);

  if (error) {
    console.error("Error fetching today attendance:", error);
    return 0;
  }

  return count || 0;
}

// 오늘 모임 건수 조회 (해당 crew의 호스트 기준)
export async function getTodayMeetingCount(crewId: string): Promise<number> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { count, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("*", { count: "exact", head: true })
    .eq("crew_id", crewId)
    .eq("is_host", true)
    .gte("attendance_timestamp", `${today}T00:00:00.000Z`)
    .lt("attendance_timestamp", `${today}T23:59:59.999Z`);

  if (error) {
    console.error("Error fetching today meeting count:", error);
    return 0;
  }

  return count || 0;
}

// 이달 신규 가입자 수 조회 (해당 crew 기준)
export async function getNewMembersThisMonth(crewId: string): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { count, error } = await supabase
    .schema("attendance")
    .from("user_crews")
    .select("*", { count: "exact", head: true })
    .eq("crew_id", crewId)
    .gte("joined_at", firstDayOfMonth.toISOString())
    .lte("joined_at", lastDayOfMonth.toISOString());

  if (error) {
    console.error("Error fetching new members this month:", error);
    return 0;
  }

  return count || 0;
}

// 지난달 신규 가입자 수 조회 (해당 crew 기준, 증감률 계산용)
export async function getNewMembersLastMonth(crewId: string): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const firstDayOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const { count, error } = await supabase
    .schema("attendance")
    .from("user_crews")
    .select("*", { count: "exact", head: true })
    .eq("crew_id", crewId)
    .gte("joined_at", firstDayOfLastMonth.toISOString())
    .lte("joined_at", lastDayOfLastMonth.toISOString());

  if (error) {
    console.error("Error fetching new members last month:", error);
    return 0;
  }

  return count || 0;
}

// 이달 모임 건수 조회 (해당 crew 기준)
export async function getMonthlyMeetingCount(crewId: string): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { count, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("*", { count: "exact", head: true })
    .eq("crew_id", crewId)
    .eq("is_host", true)
    .gte("attendance_timestamp", firstDayOfMonth.toISOString())
    .lte("attendance_timestamp", lastDayOfMonth.toISOString());

  if (error) {
    console.error("Error fetching monthly meeting count:", error);
    return 0;
  }

  return count || 0;
}

// 지난달 모임 건수 조회 (해당 crew 기준)
export async function getLastMonthMeetingCount(
  crewId: string
): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const firstDayOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const { count, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("*", { count: "exact", head: true })
    .eq("crew_id", crewId)
    .eq("is_host", true)
    .gte("attendance_timestamp", firstDayOfLastMonth.toISOString())
    .lte("attendance_timestamp", lastDayOfLastMonth.toISOString());

  if (error) {
    console.error("Error fetching last month meeting count:", error);
    return 0;
  }

  return count || 0;
}

// 이달 모임 참여 횟수 조회 (해당 crew 기준)
export async function getMonthlyParticipationCount(
  crewId: string
): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { count, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("*", { count: "exact", head: true })
    .eq("crew_id", crewId)
    .gte("attendance_timestamp", firstDayOfMonth.toISOString())
    .lte("attendance_timestamp", lastDayOfMonth.toISOString());

  if (error) {
    console.error("Error fetching monthly participation count:", error);
    return 0;
  }

  return count || 0;
}

// 지난달 모임 참여 횟수 조회 (해당 crew 기준)
export async function getLastMonthParticipationCount(
  crewId: string
): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const firstDayOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const { count, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("*", { count: "exact", head: true })
    .eq("crew_id", crewId)
    .gte("attendance_timestamp", firstDayOfLastMonth.toISOString())
    .lte("attendance_timestamp", lastDayOfLastMonth.toISOString());

  if (error) {
    console.error("Error fetching last month participation count:", error);
    return 0;
  }

  return count || 0;
}

// 이달 참여 크루원 수 조회 (해당 crew의 고유 사용자 수)
export async function getMonthlyParticipantCount(
  crewId: string
): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("user_id")
    .eq("crew_id", crewId)
    .gte("attendance_timestamp", firstDayOfMonth.toISOString())
    .lte("attendance_timestamp", lastDayOfMonth.toISOString());

  if (error) {
    console.error("Error fetching monthly participant count:", error);
    return 0;
  }

  // 고유 사용자 수 계산
  const uniqueUsers = new Set(data?.map((record) => record.user_id) || []);
  return uniqueUsers.size;
}

// 지난달 참여 크루원 수 조회 (해당 crew 기준)
export async function getLastMonthParticipantCount(
  crewId: string
): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const firstDayOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const { data, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("user_id")
    .eq("crew_id", crewId)
    .gte("attendance_timestamp", firstDayOfLastMonth.toISOString())
    .lte("attendance_timestamp", lastDayOfLastMonth.toISOString());

  if (error) {
    console.error("Error fetching last month participant count:", error);
    return 0;
  }

  // 고유 사용자 수 계산
  const uniqueUsers = new Set(data?.map((record) => record.user_id) || []);
  return uniqueUsers.size;
}

// 이달 모임개설 크루원 수 조회 (해당 crew의 호스트 고유 사용자 수)
export async function getMonthlyHostCount(crewId: string): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("user_id")
    .eq("crew_id", crewId)
    .eq("is_host", true)
    .gte("attendance_timestamp", firstDayOfMonth.toISOString())
    .lte("attendance_timestamp", lastDayOfMonth.toISOString());

  if (error) {
    console.error("Error fetching monthly host count:", error);
    return 0;
  }

  // 고유 호스트 사용자 수 계산
  const uniqueHosts = new Set(data?.map((record) => record.user_id) || []);
  return uniqueHosts.size;
}

// 지난달 모임개설 크루원 수 조회 (해당 crew 기준)
export async function getLastMonthHostCount(crewId: string): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const firstDayOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const { data, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("user_id")
    .eq("crew_id", crewId)
    .eq("is_host", true)
    .gte("attendance_timestamp", firstDayOfLastMonth.toISOString())
    .lte("attendance_timestamp", lastDayOfLastMonth.toISOString());

  if (error) {
    console.error("Error fetching last month host count:", error);
    return 0;
  }

  // 고유 호스트 사용자 수 계산
  const uniqueHosts = new Set(data?.map((record) => record.user_id) || []);
  return uniqueHosts.size;
}

// 증감률 계산 함수
function calculateChangePercentage(
  current: number,
  previous: number
): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// 모든 통계 데이터를 가져오는 메인 함수 (crew 기준)
export async function getAdminStats(crewId: string): Promise<AdminStats> {
  try {
    // 병렬로 모든 데이터 가져오기
    const [
      totalMembers,
      todayAttendance,
      todayMeetingCount,
      newMembersThisMonth,
      newMembersLastMonth,
      monthlyMeetingCount,
      lastMonthMeetingCount,
      monthlyParticipationCount,
      lastMonthParticipationCount,
      monthlyParticipantCount,
      lastMonthParticipantCount,
      monthlyHostCount,
      lastMonthHostCount,
    ] = await Promise.all([
      getTotalMembers(crewId),
      getTodayAttendance(crewId),
      getTodayMeetingCount(crewId),
      getNewMembersThisMonth(crewId),
      getNewMembersLastMonth(crewId),
      getMonthlyMeetingCount(crewId),
      getLastMonthMeetingCount(crewId),
      getMonthlyParticipationCount(crewId),
      getLastMonthParticipationCount(crewId),
      getMonthlyParticipantCount(crewId),
      getLastMonthParticipantCount(crewId),
      getMonthlyHostCount(crewId),
      getLastMonthHostCount(crewId),
    ]);

    return {
      totalMembers,
      todayAttendance,
      todayMeetingCount,
      newMembersThisMonth,
      newMembersThisMonthChange: calculateChangePercentage(
        newMembersThisMonth,
        newMembersLastMonth
      ),
      monthlyMeetingCount,
      monthlyMeetingCountChange: calculateChangePercentage(
        monthlyMeetingCount,
        lastMonthMeetingCount
      ),
      monthlyParticipationCount,
      monthlyParticipationCountChange: calculateChangePercentage(
        monthlyParticipationCount,
        lastMonthParticipationCount
      ),
      monthlyParticipantCount,
      monthlyParticipantCountChange: calculateChangePercentage(
        monthlyParticipantCount,
        lastMonthParticipantCount
      ),
      monthlyHostCount,
      monthlyHostCountChange: calculateChangePercentage(
        monthlyHostCount,
        lastMonthHostCount
      ),
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    // 에러 발생 시 기본값 반환
    return {
      totalMembers: 0,
      todayAttendance: 0,
      todayMeetingCount: 0,
      newMembersThisMonth: 0,
      newMembersThisMonthChange: null,
      monthlyMeetingCount: 0,
      monthlyMeetingCountChange: null,
      monthlyParticipationCount: 0,
      monthlyParticipationCountChange: null,
      monthlyParticipantCount: 0,
      monthlyParticipantCountChange: null,
      monthlyHostCount: 0,
      monthlyHostCountChange: null,
    };
  }
}
