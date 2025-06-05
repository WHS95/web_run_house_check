import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { type User } from "@supabase/supabase-js";

// 동적 렌더링 강제
export const dynamic = "force-dynamic";

// 서버용 Supabase 클라이언트
const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // API 라우트에서는 쿠키 설정 불필요
        },
        remove(name: string, options: any) {
          // API 라우트에서는 쿠키 제거 불필요
        },
      },
    }
  );
};

// getRankingData 함수 (기존 로직 재사용)
async function getRankingData(
  supabase: any,
  user: User,
  year: number,
  month: number
) {
  let crewId: string | null = null;
  let crewName: string | null = null;

  // 1. 사용자 크루 ID 및 크루 이름 조회
  const { data: userData, error: userError } = await supabase
    .schema("attendance")
    .from("users")
    .select("verified_crew_id")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    console.error("Error fetching user's verified_crew_id:", userError);
    return { attendanceRanking: [], hostingRanking: [], crewName: null };
  }

  crewId = userData.verified_crew_id;

  const { data: crewData, error: crewError } = await supabase
    .schema("attendance")
    .from("crews")
    .select("name")
    .eq("id", crewId)
    .single();

  crewName = crewData?.name || null;

  if (!crewId) {
    console.warn(
      "User does not have a verified_crew_id. Cannot fetch ranking."
    );
    return { attendanceRanking: [], hostingRanking: [], crewName: crewName };
  }

  // 해당 월의 시작일과 종료일 계산 (UTC 기준)
  const startDate = new Date(
    Date.UTC(year, month - 1, 1, 0, 0, 0)
  ).toISOString();
  const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString();

  // 출석 횟수 랭킹 데이터 조회
  const { data: attendanceRawData, error: attendanceError } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select(
      `
      user_id,
      users ( first_name, profile_image_url ),
      id 
    `
    )
    .eq("crew_id", crewId)
    .gte("attendance_timestamp", startDate)
    .lt("attendance_timestamp", endDate);

  // 출석 횟수 집계 로직
  let processedAttendanceData: {
    user_id: string;
    name: string | null;
    profile_image_url: string | null;
    value: number;
  }[] = [];

  if (attendanceRawData) {
    const attendanceCounts = attendanceRawData.reduce(
      (acc: any, record: any) => {
        acc[record.user_id] = (acc[record.user_id] || 0) + 1;
        return acc;
      },
      {}
    );

    const uniqueUserIdsForAttendance = Object.keys(attendanceCounts);
    processedAttendanceData = uniqueUserIdsForAttendance
      .map((uid) => {
        const userRecord = attendanceRawData.find(
          (r: any) => r.user_id === uid
        );
        return {
          user_id: uid,
          name: userRecord?.users?.first_name || null,
          profile_image_url: userRecord?.users?.profile_image_url || null,
          value: attendanceCounts[uid],
        };
      })
      .sort(
        (a, b) =>
          b.value - a.value || (a.name || " ").localeCompare(b.name || " ")
      );
  }

  // 모임 주최 횟수 랭킹 데이터 조회
  const { data: hostingRawData, error: hostingError } = await supabase
    .schema("attendance")
    .from("attendance_records")
    .select(
      `
      user_id,
      users ( first_name, profile_image_url )
    `
    )
    .eq("crew_id", crewId)
    .eq("is_host", true)
    .gte("attendance_timestamp", startDate)
    .lt("attendance_timestamp", endDate);

  if (attendanceError)
    console.error("Error fetching attendance raw data:", attendanceError);
  if (hostingError)
    console.error("Error fetching hosting raw data:", hostingError);

  // 모임 주최 횟수 집계 로직
  let processedHostingData: {
    user_id: string;
    name: string | null;
    profile_image_url: string | null;
    value: number;
  }[] = [];

  if (hostingRawData) {
    const hostCounts = hostingRawData.reduce((acc: any, record: any) => {
      acc[record.user_id] = (acc[record.user_id] || 0) + 1;
      return acc;
    }, {});

    const uniqueUserIdsForHosting = Object.keys(hostCounts);
    processedHostingData = uniqueUserIdsForHosting
      .map((uid) => {
        const userRecord = hostingRawData.find((r: any) => r.user_id === uid);
        return {
          user_id: uid,
          name: userRecord?.users?.first_name || null,
          profile_image_url: userRecord?.users?.profile_image_url || null,
          value: hostCounts[uid],
        };
      })
      .sort(
        (a, b) =>
          b.value - a.value || (a.name || " ").localeCompare(b.name || " ")
      );
  }

  const processRanking = (data: any[] | null, currentUserId: string) => {
    if (!data || !Array.isArray(data)) return [];
    return data.map((item: any, index: number) => ({
      user_id: item.user_id,
      rank: index + 1,
      name: item.name || "N/A",
      profile_image_url: item.profile_image_url || null,
      value:
        typeof item.value === "number"
          ? item.value
          : parseInt(item.value, 10) || 0,
      is_current_user: item.user_id === currentUserId,
    }));
  };

  const attendanceRanking = processRanking(processedAttendanceData, user.id);
  const hostingRanking = processRanking(processedHostingData, user.id);

  return { attendanceRanking, hostingRanking, crewName };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { user } = session;
    const { searchParams } = new URL(request.url);

    // URL 파라미터에서 년도와 월 추출
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    let year = parseInt(searchParams.get("year") || "", 10);
    let month = parseInt(searchParams.get("month") || "", 10);

    if (isNaN(year) || year < 1900 || year > 2200) {
      year = currentYear;
    }
    if (isNaN(month) || month < 1 || month > 12) {
      month = currentMonth;
    }

    const { attendanceRanking, hostingRanking, crewName } =
      await getRankingData(supabase, user, year, month);

    const rankingData = {
      selectedYear: year,
      selectedMonth: month,
      attendanceRanking,
      hostingRanking,
      crewName: crewName,
    };

    return NextResponse.json(rankingData);
  } catch (error) {
    console.error("랭킹 API 오류:", error);
    return NextResponse.json(
      { error: "랭킹 데이터를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
