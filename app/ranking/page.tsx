import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import RankingTemplate, {
  type RankingData,
  type RankItem,
} from "@/components/templates/RankingTemplate";
import { type User } from "@supabase/supabase-js";

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
        set(name: string, value: string, options: CookieOptions) {
          // 서버 컴포넌트에서는 쿠키를 직접 설정하려고 시도하지 않도록 비워둡니다.
          // 필요하다면 Route Handler나 Server Action을 사용해야 합니다.
        },
        remove(name: string, options: CookieOptions) {
          // 위와 동일
        },
      },
    }
  );
};

// getRankingData 함수 정의 (이전 로직 기반)
async function getRankingData(
  supabase: any,
  user: User,
  year: number,
  month: number
): Promise<
  Omit<RankingData, "selectedYear" | "selectedMonth"> & {
    crewName: string | null;
  }
> {
  let crewId: string | null = null;
  let crewName: string | null = null;

  // 1. 사용자 크루 ID 및 크루 이름 조회
  // 1-1. users 테이블에서 verified_crew_id 조회
  const { data: userData, error: userError } = await supabase
    .schema("attendance")
    .from("users")
    .select("verified_crew_id") // crews 테이블에서 name도 함께 조회
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    console.error(
      "Error fetching user's verified_crew_id or crew name:",
      userError
    );
    // verified_crew_id가 없을 경우, 랭킹을 보여줄 수 없으므로 빈 배열과 null 반환
    return { attendanceRanking: [], hostingRanking: [], crewName: null };
  }

  crewId = userData.verified_crew_id;
  // userData.crews가 객체일 경우 name을 가져오고, 아니면 null 처리 (타입 안정성)

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
    return { attendanceRanking: [], hostingRanking: [], crewName: crewName }; // 크루 이름은 있을 수 있으므로 전달
  }

  // 해당 월의 시작일과 종료일 계산 (UTC 기준)
  const startDate = new Date(
    Date.UTC(year, month - 1, 1, 0, 0, 0)
  ).toISOString();
  const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString(); // 다음 달 1일 0시 (미만으로 비교)

  // 출석 횟수 랭킹 데이터 조회 (직접 쿼리)
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

  // 출석 횟수 집계 로직 (코드에서 처리)
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
    // 사용자 정보를 가져오기 위해 attendanceRawData에서 사용자 정보를 매핑 (이미 select에 포함되어 있다면 활용)
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
      ); // 정렬
  }

  // 모임 주최 횟수 랭킹 데이터 조회 (raw 데이터만 가져오기)
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

  // 모임 주최 횟수 집계 로직 (코드에서 처리)
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
    // 사용자 정보를 가져오기 위해 hostingRawData에서 사용자 정보를 매핑
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
      ); // 주최 횟수, 이름으로 정렬
  }

  const processRanking = (
    data: any[] | null,
    currentUserId: string
  ): RankItem[] => {
    if (!data || !Array.isArray(data)) return [];
    // data는 이미 { user_id, name, profile_image_url, value } 형태의 배열로 가정 (위에서 가공됨)
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

  // 이미 정렬된 processedData를 processRanking에 전달
  const attendanceRanking = processRanking(processedAttendanceData, user.id);
  const hostingRanking = processRanking(processedHostingData, user.id);

  return { attendanceRanking, hostingRanking, crewName };
}

// PageProps 타입 정의 (searchParams를 사용하기 위함)
interface RankingPageProps {
  searchParams: {
    year?: string;
    month?: string;
  };
}

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/auth/login");
  }
  const { user } = session;

  // searchParams에서 year와 month를 가져오거나 기본값 설정
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // JavaScript의 getMonth()는 0부터 시작

  let year = parseInt(searchParams.year || "", 10);
  let month = parseInt(searchParams.month || "", 10);

  if (isNaN(year) || year < 1900 || year > 2200) {
    // 간단한 유효성 검사
    year = currentYear;
  }
  if (isNaN(month) || month < 1 || month > 12) {
    month = currentMonth;
  }

  const { attendanceRanking, hostingRanking, crewName } = await getRankingData(
    supabase,
    user,
    year,
    month
  );

  const rankingPageData: RankingData = {
    selectedYear: year,
    selectedMonth: month,
    attendanceRanking,
    hostingRanking,
    crewName: crewName,
  };

  // RankingTemplate으로 전달할 onMonthChange 핸들러
  const handleMonthChange = async (direction: "prev" | "next") => {
    "use server"; // 서버 액션으로 표시 (redirect를 서버 사이드에서 수행)

    let newYear = year;
    let newMonth = month;

    if (direction === "prev") {
      newMonth -= 1;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
    } else {
      // 'next'
      newMonth += 1;
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
    }
    // 연도 제한 (예: 1900 ~ 2200년)
    if (newYear < 1900) newYear = 1900;
    if (newYear > 2200) newYear = 2200;

    redirect(`/ranking?year=${newYear}&month=${newMonth}`);
  };

  return (
    <RankingTemplate
      initialData={rankingPageData}
      onMonthChange={handleMonthChange}
    />
  );
}
