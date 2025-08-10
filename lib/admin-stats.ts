import { createClient } from "./supabase/client";

export interface AdminStats {
  totalMembers: number;
  todayAttendance: number;
  todayMeetingCount: number;
  newMembersThisMonth: number;
  newMembersThisMonthChange: number | null;
  lastMonthNewMembers: number;
  monthlyMeetingCount: number;
  monthlyMeetingCountChange: number | null;
  lastMonthMeetingCount: number;
  monthlyParticipationCount: number;
  monthlyParticipationCountChange: number | null;
  lastMonthParticipationCount: number;
  monthlyParticipantCount: number;
  monthlyParticipantCountChange: number | null;
  lastMonthParticipantCount: number;
  monthlyHostCount: number;
  monthlyHostCountChange: number | null;
  lastMonthHostCount: number;
}

// 총 회원 수 조회 (해당 crew에 속한 회원)
export async function getTotalMembers(crewId: string): Promise<number> {
  const supabase = createClient();
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

// 오늘 출석 통계 통합 조회 (단일 쿼리로 출석 수와 모임 건수 동시 계산)
interface TodayStats {
  attendanceCount: number;
  meetingCount: number;
}

export async function getTodayStats(crewId: string): Promise<TodayStats> {
  const supabase = createClient();

  // 한국 시간 기준으로 오늘 날짜 계산 (daily API 방식과 동일)
  const koreanNow = new Date();
  koreanNow.setHours(koreanNow.getHours() + 9); // UTC+9
  const today = koreanNow.toISOString().split("T")[0];

  // daily API와 동일한 UTC 범위 계산
  const targetDate = new Date(today);
  const startUTC = new Date(targetDate.getTime() - 9 * 60 * 60 * 1000); // UTC-9시간
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000 - 1); // +24시간 -1ms

  // daily API와 동일한 쿼리 (삭제된 기록 제외)
  const { data, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("location, attendance_timestamp")
    .eq("crew_id", crewId)
    .is("deleted_at", null) // 삭제되지 않은 기록만 (daily API와 동일)
    .gte("attendance_timestamp", startUTC.toISOString())
    .lte("attendance_timestamp", endUTC.toISOString());

  if (error) {
    console.error("Error fetching today stats:", error);
    return { attendanceCount: 0, meetingCount: 0 };
  }

  if (!data || data.length === 0) {
    return { attendanceCount: 0, meetingCount: 0 };
  }

  // daily API와 동일한 클라이언트 사이드 필터링
  const filteredData = data.filter((record) => {
    const utcDate = new Date(record.attendance_timestamp);
    // UTC 시간에서 9시간을 더해서 한국 시간으로 변환
    const koreanDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
    const year = koreanDate.getUTCFullYear();
    const month = (koreanDate.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = koreanDate.getUTCDate().toString().padStart(2, "0");
    const koreanDateStr = `${year}-${month}-${day}`;
    return koreanDateStr === today;
  });

  // Debug: 조회 결과 로그 (개발 환경에서만) - daily API와 동일
  if (process.env.NODE_ENV === "development") {
    // console.log(`오늘(${today}) 통계 조회 결과:`, {
    //   totalRecords: data.length,
    //   filteredRecords: filteredData.length,
    // });
  }

  // 1. 출석 건수: 필터링된 기록 수
  const attendanceCount = filteredData.length;

  // 2. 모임 건수: 장소 + 시간(분 단위)으로 그룹핑 (attendance 페이지와 동일)
  const meetings = new Set();
  filteredData.forEach((record) => {
    const timestamp = new Date(record.attendance_timestamp);
    // 한국 시간으로 변환
    timestamp.setHours(timestamp.getHours() + 9);

    // HH:MM 형식으로 시간 생성 (attendance 페이지와 동일)
    const time = timestamp.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const meetingKey = `${record.location}_${time}`;
    meetings.add(meetingKey);
  });

  const meetingCount = meetings.size;

  return { attendanceCount, meetingCount };
}

// 호환성을 위한 개별 함수들 (getTodayStats 사용)
export async function getTodayAttendance(crewId: string): Promise<number> {
  const { attendanceCount } = await getTodayStats(crewId);
  return attendanceCount;
}

export async function getTodayMeetingCount(crewId: string): Promise<number> {
  const { meetingCount } = await getTodayStats(crewId);
  return meetingCount;
}

// 이달 신규 가입자 수 조회 (해당 crew 기준)
export async function getNewMembersThisMonth(crewId: string): Promise<number> {
  const supabase = createClient();
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
  const supabase = createClient();
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

// 이달 모임 건수 조회 (daily API 방식 적용)
export async function getMonthlyMeetingCount(crewId: string): Promise<number> {
  const supabase = createClient();

  // 한국 시간 기준으로 이달 계산
  const koreanNow = new Date();
  koreanNow.setHours(koreanNow.getHours() + 9); // UTC+9

  const year = koreanNow.getUTCFullYear();
  const month = koreanNow.getUTCMonth() + 1;

  // 월별 데이터 조회와 동일한 방식
  const startDateStr = `${year}-${month.toString().padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const endDateStr = `${year}-${month
    .toString()
    .padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

  // daily API와 동일한 쿼리 방식
  const { data, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("location, attendance_timestamp")
    .eq("crew_id", crewId)
    .is("deleted_at", null) // 삭제되지 않은 기록만
    .gte("attendance_timestamp", startDateStr + "T00:00:00Z")
    .lte("attendance_timestamp", endDateStr + "T23:59:59Z");

  if (error) {
    console.error("Error fetching monthly meeting count:", error);
    return 0;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  // 모임 건수 계산: 장소 + 시간(분 단위)으로 그룹핑
  const meetings = new Set();
  data.forEach((record) => {
    const utcDate = new Date(record.attendance_timestamp);
    // UTC 시간에서 9시간을 더해서 한국 시간으로 변환
    const koreanDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

    // HH:MM 형식으로 시간 생성 (attendance 페이지와 동일)
    const time = koreanDate.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const meetingKey = `${record.location}_${time}`;
    meetings.add(meetingKey);
  });

  return meetings.size;
}

// 지난달 모임 건수 조회 (daily API 방식 적용)
export async function getLastMonthMeetingCount(
  crewId: string
): Promise<number> {
  const supabase = createClient();

  // 한국 시간 기준으로 지난달 계산
  const koreanNow = new Date();
  koreanNow.setHours(koreanNow.getHours() + 9); // UTC+9

  const year = koreanNow.getUTCFullYear();
  const lastMonth = koreanNow.getUTCMonth(); // 현재 월 - 1

  let targetYear = year;
  let targetMonth = lastMonth;

  // 1월인 경우 작년 12월로 조정
  if (lastMonth === 0) {
    targetYear = year - 1;
    targetMonth = 12;
  }

  // 월별 데이터 조회와 동일한 방식
  const startDateStr = `${targetYear}-${targetMonth
    .toString()
    .padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(targetYear, targetMonth, 0).getDate();
  const endDateStr = `${targetYear}-${targetMonth
    .toString()
    .padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

  // daily API와 동일한 쿼리 방식
  const { data, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("location, attendance_timestamp")
    .eq("crew_id", crewId)
    .is("deleted_at", null) // 삭제되지 않은 기록만
    .gte("attendance_timestamp", startDateStr + "T00:00:00Z")
    .lte("attendance_timestamp", endDateStr + "T23:59:59Z");

  if (error) {
    console.error("Error fetching last month meeting count:", error);
    return 0;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  // 모임 건수 계산: 장소 + 시간(분 단위)으로 그룹핑
  const meetings = new Set();
  data.forEach((record) => {
    const utcDate = new Date(record.attendance_timestamp);
    // UTC 시간에서 9시간을 더해서 한국 시간으로 변환
    const koreanDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

    // HH:MM 형식으로 시간 생성 (attendance 페이지와 동일)
    const time = koreanDate.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const meetingKey = `${record.location}_${time}`;
    meetings.add(meetingKey);
  });

  return meetings.size;
}

// 이달 모임 참여 횟수 조회 (daily API 방식 적용)
export async function getMonthlyParticipationCount(
  crewId: string
): Promise<number> {
  const supabase = createClient();

  // 한국 시간 기준으로 이달 계산
  const koreanNow = new Date();
  koreanNow.setHours(koreanNow.getHours() + 9); // UTC+9

  const year = koreanNow.getUTCFullYear();
  const month = koreanNow.getUTCMonth() + 1;

  // 월별 데이터 조회와 동일한 방식
  const startDateStr = `${year}-${month.toString().padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const endDateStr = `${year}-${month
    .toString()
    .padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

  const { count, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("*", { count: "exact", head: true })
    .eq("crew_id", crewId)
    .is("deleted_at", null) // 삭제되지 않은 기록만
    .gte("attendance_timestamp", startDateStr + "T00:00:00Z")
    .lte("attendance_timestamp", endDateStr + "T23:59:59Z");

  if (error) {
    console.error("Error fetching monthly participation count:", error);
    return 0;
  }

  return count || 0;
}

// 지난달 모임 참여 횟수 조회 (daily API 방식 적용)
export async function getLastMonthParticipationCount(
  crewId: string
): Promise<number> {
  const supabase = createClient();

  // 한국 시간 기준으로 지난달 계산
  const koreanNow = new Date();
  koreanNow.setHours(koreanNow.getHours() + 9); // UTC+9

  const year = koreanNow.getUTCFullYear();
  const lastMonth = koreanNow.getUTCMonth(); // 현재 월 - 1

  let targetYear = year;
  let targetMonth = lastMonth;

  // 1월인 경우 작년 12월로 조정
  if (lastMonth === 0) {
    targetYear = year - 1;
    targetMonth = 12;
  }

  // 월별 데이터 조회와 동일한 방식
  const startDateStr = `${targetYear}-${targetMonth
    .toString()
    .padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(targetYear, targetMonth, 0).getDate();
  const endDateStr = `${targetYear}-${targetMonth
    .toString()
    .padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

  const { count, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("*", { count: "exact", head: true })
    .eq("crew_id", crewId)
    .is("deleted_at", null) // 삭제되지 않은 기록만
    .gte("attendance_timestamp", startDateStr + "T00:00:00Z")
    .lte("attendance_timestamp", endDateStr + "T23:59:59Z");

  if (error) {
    console.error("Error fetching last month participation count:", error);
    return 0;
  }

  return count || 0;
}

// 이달 참여 크루원 수 조회 (서브쿼리 방식)
export async function getMonthlyParticipantCount(
  crewId: string
): Promise<number> {
  const supabase = createClient();

  // 한국 시간 기준으로 이달 계산
  const koreanNow = new Date();
  koreanNow.setHours(koreanNow.getHours() + 9); // UTC+9

  const year = koreanNow.getUTCFullYear();
  const month = koreanNow.getUTCMonth() + 1;

  // 월별 데이터 조회와 동일한 방식
  const startDateStr = `${year}-${month.toString().padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const endDateStr = `${year}-${month
    .toString()
    .padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

  // 1단계: 해당 크루의 활성 멤버 ID 목록 조회
  const { data: crewMembers, error: crewError } = await supabase
    .schema("attendance")
    .from("user_crews")
    .select("user_id")
    .eq("crew_id", crewId);

  if (crewError) {
    console.error("Error fetching crew members:", crewError);
    return 0;
  }

  if (!crewMembers || crewMembers.length === 0) {
    return 0;
  }

  const memberIds = crewMembers.map((member) => member.user_id);

  // 2단계: 해당 멤버들의 이달 출석 기록 조회
  const { data, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("user_id")
    .eq("crew_id", crewId)
    .in("user_id", memberIds) // 크루 멤버만 필터링
    .is("deleted_at", null) // 삭제되지 않은 출석 기록만
    .gte("attendance_timestamp", startDateStr + "T00:00:00Z")
    .lte("attendance_timestamp", endDateStr + "T23:59:59Z");

  if (error) {
    console.error("Error fetching monthly participant count:", error);
    return 0;
  }

  // 고유 크루원 수 계산 (user_crews에 등록된 멤버만)
  const uniqueUsers = new Set(data?.map((record) => record.user_id) || []);
  return uniqueUsers.size;
}

// 지난달 참여 크루원 수 조회 (서브쿼리 방식)
export async function getLastMonthParticipantCount(
  crewId: string
): Promise<number> {
  const supabase = createClient();

  // 한국 시간 기준으로 지난달 계산
  const koreanNow = new Date();
  koreanNow.setHours(koreanNow.getHours() + 9); // UTC+9

  const year = koreanNow.getUTCFullYear();
  const lastMonth = koreanNow.getUTCMonth(); // 현재 월 - 1

  let targetYear = year;
  let targetMonth = lastMonth;

  // 1월인 경우 작년 12월로 조정
  if (lastMonth === 0) {
    targetYear = year - 1;
    targetMonth = 12;
  }

  // 월별 데이터 조회와 동일한 방식
  const startDateStr = `${targetYear}-${targetMonth
    .toString()
    .padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(targetYear, targetMonth, 0).getDate();
  const endDateStr = `${targetYear}-${targetMonth
    .toString()
    .padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

  // 1단계: 해당 크루의 활성 멤버 ID 목록 조회
  const { data: crewMembers, error: crewError } = await supabase
    .schema("attendance")
    .from("user_crews")
    .select("user_id")
    .eq("crew_id", crewId);

  if (crewError) {
    console.error("Error fetching crew members:", crewError);
    return 0;
  }

  if (!crewMembers || crewMembers.length === 0) {
    return 0;
  }

  const memberIds = crewMembers.map((member) => member.user_id);

  // 2단계: 해당 멤버들의 지난달 출석 기록 조회
  const { data, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("user_id")
    .eq("crew_id", crewId)
    .in("user_id", memberIds) // 크루 멤버만 필터링
    .is("deleted_at", null) // 삭제되지 않은 출석 기록만
    .gte("attendance_timestamp", startDateStr + "T00:00:00Z")
    .lte("attendance_timestamp", endDateStr + "T23:59:59Z");

  if (error) {
    console.error("Error fetching last month participant count:", error);
    return 0;
  }

  // 고유 크루원 수 계산 (user_crews에 등록된 멤버만)
  const uniqueUsers = new Set(data?.map((record) => record.user_id) || []);
  return uniqueUsers.size;
}

// 이달 모임개설 크루원 수 조회 (서브쿼리 방식)
export async function getMonthlyHostCount(crewId: string): Promise<number> {
  const supabase = createClient();

  // 한국 시간 기준으로 이달 계산
  const koreanNow = new Date();
  koreanNow.setHours(koreanNow.getHours() + 9); // UTC+9

  const year = koreanNow.getUTCFullYear();
  const month = koreanNow.getUTCMonth() + 1;

  // 월별 데이터 조회와 동일한 방식
  const startDateStr = `${year}-${month.toString().padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const endDateStr = `${year}-${month
    .toString()
    .padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

  // 1단계: 해당 크루의 활성 멤버 ID 목록 조회
  const { data: crewMembers, error: crewError } = await supabase
    .schema("attendance")
    .from("user_crews")
    .select("user_id")
    .eq("crew_id", crewId);

  if (crewError) {
    console.error("Error fetching crew members:", crewError);
    return 0;
  }

  if (!crewMembers || crewMembers.length === 0) {
    return 0;
  }

  const memberIds = crewMembers.map((member) => member.user_id);

  // 2단계: 해당 멤버들의 이달 호스트 기록 조회
  const { data, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("user_id")
    .eq("crew_id", crewId)
    .eq("is_host", true)
    .in("user_id", memberIds) // 크루 멤버만 필터링
    .is("deleted_at", null) // 삭제되지 않은 출석 기록만
    .gte("attendance_timestamp", startDateStr + "T00:00:00Z")
    .lte("attendance_timestamp", endDateStr + "T23:59:59Z");

  if (error) {
    console.error("Error fetching monthly host count:", error);
    return 0;
  }

  // 고유 호스트 크루원 수 계산 (user_crews에 등록된 멤버만)
  const uniqueHosts = new Set(data?.map((record) => record.user_id) || []);
  return uniqueHosts.size;
}

// 지난달 모임개설 크루원 수 조회 (서브쿼리 방식)
export async function getLastMonthHostCount(crewId: string): Promise<number> {
  const supabase = createClient();

  // 한국 시간 기준으로 지난달 계산
  const koreanNow = new Date();
  koreanNow.setHours(koreanNow.getHours() + 9); // UTC+9

  const year = koreanNow.getUTCFullYear();
  const lastMonth = koreanNow.getUTCMonth(); // 현재 월 - 1

  let targetYear = year;
  let targetMonth = lastMonth;

  // 1월인 경우 작년 12월로 조정
  if (lastMonth === 0) {
    targetYear = year - 1;
    targetMonth = 12;
  }

  // 월별 데이터 조회와 동일한 방식
  const startDateStr = `${targetYear}-${targetMonth
    .toString()
    .padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(targetYear, targetMonth, 0).getDate();
  const endDateStr = `${targetYear}-${targetMonth
    .toString()
    .padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

  // 1단계: 해당 크루의 활성 멤버 ID 목록 조회
  const { data: crewMembers, error: crewError } = await supabase
    .schema("attendance")
    .from("user_crews")
    .select("user_id")
    .eq("crew_id", crewId);

  if (crewError) {
    console.error("Error fetching crew members:", crewError);
    return 0;
  }

  if (!crewMembers || crewMembers.length === 0) {
    return 0;
  }

  const memberIds = crewMembers.map((member) => member.user_id);

  // 2단계: 해당 멤버들의 지난달 호스트 기록 조회
  const { data, error } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("user_id")
    .eq("crew_id", crewId)
    .eq("is_host", true)
    .in("user_id", memberIds) // 크루 멤버만 필터링
    .is("deleted_at", null) // 삭제되지 않은 출석 기록만
    .gte("attendance_timestamp", startDateStr + "T00:00:00Z")
    .lte("attendance_timestamp", endDateStr + "T23:59:59Z");

  if (error) {
    console.error("Error fetching last month host count:", error);
    return 0;
  }

  // 고유 호스트 크루원 수 계산 (user_crews에 등록된 멤버만)
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
      todayStats, // 통합된 오늘 통계 (출석 수 + 모임 건수)
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
      getTodayStats(crewId), // 단일 쿼리로 두 값 모두 계산
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
      todayAttendance: todayStats.attendanceCount,
      todayMeetingCount: todayStats.meetingCount,
      newMembersThisMonth,
      newMembersThisMonthChange: calculateChangePercentage(
        newMembersThisMonth,
        newMembersLastMonth
      ),
      lastMonthNewMembers: newMembersLastMonth,
      monthlyMeetingCount,
      monthlyMeetingCountChange: calculateChangePercentage(
        monthlyMeetingCount,
        lastMonthMeetingCount
      ),
      lastMonthMeetingCount,
      monthlyParticipationCount,
      monthlyParticipationCountChange: calculateChangePercentage(
        monthlyParticipationCount,
        lastMonthParticipationCount
      ),
      lastMonthParticipationCount,
      monthlyParticipantCount,
      monthlyParticipantCountChange: calculateChangePercentage(
        monthlyParticipantCount,
        lastMonthParticipantCount
      ),
      lastMonthParticipantCount,
      monthlyHostCount,
      monthlyHostCountChange: calculateChangePercentage(
        monthlyHostCount,
        lastMonthHostCount
      ),
      lastMonthHostCount,
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
      lastMonthNewMembers: 0,
      monthlyMeetingCount: 0,
      monthlyMeetingCountChange: null,
      lastMonthMeetingCount: 0,
      monthlyParticipationCount: 0,
      monthlyParticipationCountChange: null,
      lastMonthParticipationCount: 0,
      monthlyParticipantCount: 0,
      monthlyParticipantCountChange: null,
      lastMonthParticipantCount: 0,
      monthlyHostCount: 0,
      monthlyHostCountChange: null,
      lastMonthHostCount: 0,
    };
  }
}

// PostgreSQL 함수를 사용한 최적화된 Admin 통계 조회
export async function getAdminStatsOptimized(
  crewId: string,
  targetYear?: number,
  targetMonth?: number
): Promise<AdminStats> {
  const supabase = createClient();

  try {
    // PostgreSQL 함수 호출
    const { data, error } = await supabase
      .schema("attendance")
      .rpc("get_admin_stats", {
        p_crew_id: crewId,
        p_year: targetYear || null,
        p_month: targetMonth || null,
      });

    if (error) {
      console.error("Error calling get_admin_stats function:", error);
      // fallback to existing function
      return getAdminStats(crewId);
    }

    if (!data || !data.success) {
      console.error("get_admin_stats function returned error:", data?.error);
      // fallback to existing function
      return getAdminStats(crewId);
    }

    const statsData = data.data;

    return {
      totalMembers: statsData.totalMembers,
      todayAttendance: statsData.todayAttendance,
      todayMeetingCount: statsData.todayMeetingCount,
      newMembersThisMonth: statsData.newMembersThisMonth,
      newMembersThisMonthChange: calculateChangePercentage(
        statsData.newMembersThisMonth,
        statsData.lastMonthNewMembers
      ),
      lastMonthNewMembers: statsData.lastMonthNewMembers,
      monthlyMeetingCount: statsData.monthlyMeetingCount,
      monthlyMeetingCountChange: calculateChangePercentage(
        statsData.monthlyMeetingCount,
        statsData.lastMonthMeetingCount
      ),
      lastMonthMeetingCount: statsData.lastMonthMeetingCount,
      monthlyParticipationCount: statsData.monthlyParticipationCount,
      monthlyParticipationCountChange: calculateChangePercentage(
        statsData.monthlyParticipationCount,
        statsData.lastMonthParticipationCount
      ),
      lastMonthParticipationCount: statsData.lastMonthParticipationCount,
      monthlyParticipantCount: statsData.monthlyParticipantCount,
      monthlyParticipantCountChange: calculateChangePercentage(
        statsData.monthlyParticipantCount,
        statsData.lastMonthParticipantCount
      ),
      lastMonthParticipantCount: statsData.lastMonthParticipantCount,
      monthlyHostCount: statsData.monthlyHostCount,
      monthlyHostCountChange: calculateChangePercentage(
        statsData.monthlyHostCount,
        statsData.lastMonthHostCount
      ),
      lastMonthHostCount: statsData.lastMonthHostCount,
    };
  } catch (error) {
    console.error("Error in optimized admin stats:", error);
    // fallback to existing function
    return getAdminStats(crewId);
  }
}
