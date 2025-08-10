import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-admin";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// 요일별 출석 비율 데이터 타입 정의
interface DayParticipationData {
  dayName: string;
  dayIndex: number;
  participationRate: number; // 전체 출석 대비 해당 요일 비율
  totalMembers: number; // 전체 출석 횟수 (멤버 수가 아님)
  color: string;
}

// 장소별 출석 비율 데이터 타입 정의
interface LocationParticipationData {
  locationName: string;
  participationRate: number; // 전체 출석 대비 해당 장소 비율
  attendanceCount: number; // 해당 장소 출석 횟수
  totalAttendance: number; // 전체 출석 횟수
  color: string;
}

// 전체 인원 대비 출석 현황 데이터 타입 정의
interface MemberAttendanceStatusData {
  totalActiveMembers: number; // 전체 활성 멤버 수
  attendedMembers: number; // 해당월에 출석한 고유 멤버 수
  attendanceRate: number; // 출석율 (%)
  absentMembers: number; // 해당월에 출석하지 않은 멤버 수 (유령회원)
  absentRate: number; // 유령회원 비율 (%)
}

// 요일별 참여율 분석 데이터 조회
async function getDayParticipationAnalysis(
  crewId: string,
  year: number,
  month: number
): Promise<DayParticipationData[]> {
  const supabase = await createClient();

  // 한국 시간 기준으로 해당 월의 첫째 날과 마지막 날 계산
  const startDateStr = `${year}-${month.toString().padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const endDateStr = `${year}-${month
    .toString()
    .padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

  // 한국 시간 기준으로 UTC 범위 계산
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // 한국 시간 00:00:00을 UTC로 변환 (UTC-9시간)
  const startUTC = new Date(startDate.getTime() - 9 * 60 * 60 * 1000);
  // 한국 시간 23:59:59를 UTC로 변환 (UTC-9시간, +24시간-1ms)
  const endUTC = new Date(
    endDate.getTime() + 24 * 60 * 60 * 1000 - 1 - 9 * 60 * 60 * 1000
  );

  // 1단계: 크루의 활성 멤버들의 user_id 조회
  const { data: activeMembers, error: memberError } = await supabase
    .schema("attendance")
    .from("user_crews")
    .select("user_id")
    .eq("crew_id", crewId)
    .eq("status", "ACTIVE");

  if (memberError) {
    //console.error("Error fetching active members:", memberError);
    throw new Error("활성 멤버 조회에 실패했습니다.");
  }

  if (!activeMembers || activeMembers.length === 0) {
    // 활성 멤버가 없으면 빈 결과 반환
    const dayInfo = [
      { name: "일요일", color: "bg-basic-black-gray" },
      { name: "월요일", color: "bg-basic-black-gray" },
      { name: "화요일", color: "bg-basic-black-gray" },
      { name: "수요일", color: "bg-basic-black-gray" },
      { name: "목요일", color: "bg-basic-black-gray" },
      { name: "금요일", color: "bg-basic-black-gray" },
      { name: "토요일", color: "bg-basic-black-gray" },
    ];

    return Array.from({ length: 7 }, (_, index) => ({
      dayName: dayInfo[index].name,
      dayIndex: index,
      participationRate: 0,
      totalMembers: 0,
      color: dayInfo[index].color,
    }));
  }

  // 활성 멤버들의 user_id 목록 추출
  const activeMemberIds = activeMembers.map((member) => member.user_id);

  // 2단계: 활성 멤버들의 출석 기록 조회
  const { data: attendanceData, error: attendanceError } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("user_id, attendance_timestamp")
    .eq("crew_id", crewId)
    .in("user_id", activeMemberIds) // 활성 멤버들의 출석만
    .is("deleted_at", null) // 삭제되지 않은 기록만
    .gte("attendance_timestamp", startUTC.toISOString())
    .lte("attendance_timestamp", endUTC.toISOString());

  if (attendanceError) {
    //console.error("Error fetching attendance data:", attendanceError);
    throw new Error("출석 데이터 조회에 실패했습니다.");
  }

  // 요일별 출석 횟수 집계
  const dayAttendanceCounts: { [key: number]: number } = {
    0: 0, // 일요일
    1: 0, // 월요일
    2: 0, // 화요일
    3: 0, // 수요일
    4: 0, // 목요일
    5: 0, // 금요일
    6: 0, // 토요일
  };

  let totalAttendanceCount = 0;

  // 출석 데이터를 요일별로 분류 (한국 시간 기준 추가 필터링)
  attendanceData?.forEach((record) => {
    const utcDate = new Date(record.attendance_timestamp);
    // UTC 시간에서 9시간을 더해서 한국 시간으로 변환
    const koreanDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

    // 한국 시간 기준으로 해당 월에 속하는지 확인
    const koreanYear = koreanDate.getUTCFullYear();
    const koreanMonth = koreanDate.getUTCMonth() + 1;

    // 요청된 년월과 일치하는 기록만 처리
    if (koreanYear === year && koreanMonth === month) {
      const dayOfWeek = koreanDate.getUTCDay(); // 0=일요일, 1=월요일, ..., 6=토요일
      dayAttendanceCounts[dayOfWeek]++;
      totalAttendanceCount++;
    }
  });

  // 요일 이름과 색상 정의
  const dayInfo = [
    { name: "일요일", color: "bg-basic-blue" },
    { name: "월요일", color: "bg-basic-blue" },
    { name: "화요일", color: "bg-basic-blue" },
    { name: "수요일", color: "bg-basic-blue" },
    { name: "목요일", color: "bg-basic-blue" },
    { name: "금요일", color: "bg-basic-blue" },
    { name: "토요일", color: "bg-basic-blue" },
  ];

  // 결과 데이터 생성 (전체 출석 횟수 대비 요일별 비율)
  const result: DayParticipationData[] = Array.from(
    { length: 7 },
    (_, index) => {
      const dayAttendanceCount = dayAttendanceCounts[index];
      const participationRate =
        totalAttendanceCount > 0
          ? Math.round((dayAttendanceCount / totalAttendanceCount) * 100)
          : 0;

      return {
        dayName: dayInfo[index].name,
        dayIndex: index,
        participationRate,
        totalMembers: totalAttendanceCount, // 이제 전체 출석 횟수를 의미
        color: dayInfo[index].color,
      };
    }
  );

  // 참여율 순으로 정렬
  return result.sort((a, b) => b.participationRate - a.participationRate);
}

// 장소별 참여율 분석 데이터 조회
async function getLocationParticipationAnalysis(
  crewId: string,
  year: number,
  month: number
): Promise<LocationParticipationData[]> {
  const supabase = await createClient();

  // 한국 시간 기준으로 해당 월의 첫째 날과 마지막 날 계산
  const startDateStr = `${year}-${month.toString().padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const endDateStr = `${year}-${month
    .toString()
    .padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

  // 한국 시간 기준으로 UTC 범위 계산
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // 한국 시간 00:00:00을 UTC로 변환 (UTC-9시간)
  const startUTC = new Date(startDate.getTime() - 9 * 60 * 60 * 1000);
  // 한국 시간 23:59:59를 UTC로 변환 (UTC-9시간, +24시간-1ms)
  const endUTC = new Date(
    endDate.getTime() + 24 * 60 * 60 * 1000 - 1 - 9 * 60 * 60 * 1000
  );

  // 1단계: 크루의 활성 멤버들의 user_id 조회
  const { data: activeMembers, error: memberError } = await supabase
    .schema("attendance")
    .from("user_crews")
    .select("user_id")
    .eq("crew_id", crewId)
    .eq("status", "ACTIVE");

  if (memberError) {
    //console.error("Error fetching active members:", memberError);
    throw new Error("활성 멤버 조회에 실패했습니다.");
  }

  if (!activeMembers || activeMembers.length === 0) {
    return [];
  }

  // 활성 멤버들의 user_id 목록 추출
  const activeMemberIds = activeMembers.map((member) => member.user_id);

  // 2단계: 활성 멤버들의 출석 기록 조회
  const { data: attendanceData, error: attendanceError } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("location, attendance_timestamp")
    .eq("crew_id", crewId)
    .in("user_id", activeMemberIds) // 활성 멤버들의 출석만
    .is("deleted_at", null) // 삭제되지 않은 기록만
    .gte("attendance_timestamp", startUTC.toISOString())
    .lte("attendance_timestamp", endUTC.toISOString());

  if (attendanceError) {
    //console.error("Error fetching attendance data:", attendanceError);
    throw new Error("출석 데이터 조회에 실패했습니다.");
  }

  // 장소별 출석 횟수 집계
  const locationCounts: { [key: string]: number } = {};
  let totalAttendanceCount = 0;

  // 출석 데이터를 장소별로 분류 (한국 시간 기준 추가 필터링)
  attendanceData?.forEach((record) => {
    const utcDate = new Date(record.attendance_timestamp);
    // UTC 시간에서 9시간을 더해서 한국 시간으로 변환
    const koreanDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

    // 한국 시간 기준으로 해당 월에 속하는지 확인
    const koreanYear = koreanDate.getUTCFullYear();
    const koreanMonth = koreanDate.getUTCMonth() + 1;

    // 요청된 년월과 일치하는 기록만 처리
    if (koreanYear === year && koreanMonth === month) {
      const location = record.location || "기타";
      locationCounts[location] = (locationCounts[location] || 0) + 1;
      totalAttendanceCount++;
    }
  });

  // 장소별 색상 생성 (해시 기반)
  const generateColor = (locationName: string, index: number) => {
    const colors = [
      "bg-basic-blue",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-teal-500",
      "bg-orange-500",
    ];
    return colors[index % colors.length];
  };

  // 결과 데이터 생성 (전체 출석 횟수 대비 장소별 비율)
  const result: LocationParticipationData[] = Object.entries(locationCounts)
    .map(([locationName, attendanceCount], index) => {
      const participationRate =
        totalAttendanceCount > 0
          ? Math.round((attendanceCount / totalAttendanceCount) * 100)
          : 0;

      return {
        locationName,
        participationRate,
        attendanceCount,
        totalAttendance: totalAttendanceCount,
        color: generateColor(locationName, index),
      };
    })
    .sort((a, b) => b.participationRate - a.participationRate); // 참여율 순으로 정렬

  return result;
}

// 전체 인원 대비 출석 현황 분석
async function getMemberAttendanceStatus(
  crewId: string,
  year: number,
  month: number
): Promise<MemberAttendanceStatusData> {
  const supabase = await createClient();

  // 한국 시간 기준으로 해당 월의 첫째 날과 마지막 날 계산
  const startDateStr = `${year}-${month.toString().padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const endDateStr = `${year}-${month
    .toString()
    .padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`;

  // 한국 시간 기준으로 UTC 범위 계산
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // 한국 시간 00:00:00을 UTC로 변환 (UTC-9시간)
  const startUTC = new Date(startDate.getTime() - 9 * 60 * 60 * 1000);
  // 한국 시간 23:59:59를 UTC로 변환 (UTC-9시간, +24시간-1ms)
  const endUTC = new Date(
    endDate.getTime() + 24 * 60 * 60 * 1000 - 1 - 9 * 60 * 60 * 1000
  );

  // 1단계: 크루의 전체 활성 멤버 수 조회
  const { data: activeMembers, error: memberError } = await supabase
    .schema("attendance")
    .from("user_crews")
    .select("user_id")
    .eq("crew_id", crewId)
    .eq("status", "ACTIVE");

  if (memberError) {
    //console.error("Error fetching active members:", memberError);
    throw new Error("활성 멤버 조회에 실패했습니다.");
  }

  const totalActiveMembers = activeMembers?.length || 0;

  if (totalActiveMembers === 0) {
    return {
      totalActiveMembers: 0,
      attendedMembers: 0,
      attendanceRate: 0,
      absentMembers: 0,
      absentRate: 0,
    };
  }

  // 활성 멤버들의 user_id 목록 추출
  const activeMemberIds = activeMembers.map((member) => member.user_id);

  // 2단계: 해당월에 출석한 고유 멤버들 조회
  const { data: attendanceData, error: attendanceError } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select("user_id, attendance_timestamp")
    .eq("crew_id", crewId)
    .in("user_id", activeMemberIds) // 활성 멤버들만
    .is("deleted_at", null) // 삭제되지 않은 기록만
    .gte("attendance_timestamp", startUTC.toISOString())
    .lte("attendance_timestamp", endUTC.toISOString());

  if (attendanceError) {
    //console.error("Error fetching attendance data:", attendanceError);
    throw new Error("출석 데이터 조회에 실패했습니다.");
  }

  // 해당월에 출석한 고유 사용자 집계
  const attendedMemberIds = new Set<string>();

  attendanceData?.forEach((record) => {
    const utcDate = new Date(record.attendance_timestamp);
    // UTC 시간에서 9시간을 더해서 한국 시간으로 변환
    const koreanDate = new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);

    // 한국 시간 기준으로 해당 월에 속하는지 확인
    const koreanYear = koreanDate.getUTCFullYear();
    const koreanMonth = koreanDate.getUTCMonth() + 1;

    // 요청된 년월과 일치하는 기록만 처리
    if (koreanYear === year && koreanMonth === month) {
      attendedMemberIds.add(record.user_id);
    }
  });

  const attendedMembers = attendedMemberIds.size;
  const absentMembers = totalActiveMembers - attendedMembers;
  const attendanceRate = Math.round(
    (attendedMembers / totalActiveMembers) * 100
  );
  const absentRate = Math.round((absentMembers / totalActiveMembers) * 100);

  return {
    totalActiveMembers,
    attendedMembers,
    attendanceRate,
    absentMembers,
    absentRate,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const crewId = searchParams.get("crewId");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!crewId) {
      return NextResponse.json(
        { error: "crewId가 필요합니다." },
        { status: 400 }
      );
    }

    if (!year || !month) {
      return NextResponse.json(
        { error: "year와 month가 필요합니다." },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: "유효하지 않은 년도 또는 월입니다." },
        { status: 400 }
      );
    }

    const [
      dayParticipationData,
      locationParticipationData,
      memberAttendanceStatus,
    ] = await Promise.all([
      getDayParticipationAnalysis(crewId, yearNum, monthNum),
      getLocationParticipationAnalysis(crewId, yearNum, monthNum),
      getMemberAttendanceStatus(crewId, yearNum, monthNum),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        dayParticipation: dayParticipationData,
        locationParticipation: locationParticipationData,
        memberAttendanceStatus: memberAttendanceStatus,
        year: yearNum,
        month: monthNum,
      },
    });
  } catch (error) {
    //console.error("Analyze API 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "분석 데이터를 가져오는데 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
