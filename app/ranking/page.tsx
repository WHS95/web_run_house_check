import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import EnhancedRankingTemplate, {
  type RankingData,
  type RankItem,
} from "@/components/templates/EnhancedRankingTemplate";
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
        },
        remove(name: string, options: CookieOptions) {
          // 위와 동일
        },
      },
    }
  );
};

// 초기 랭킹 데이터 조회 (간소화된 버전)
async function getInitialRankingData(
  supabase: any,
  user: User,
  year: number,
  month: number
): Promise<RankingData> {
  let crewId: string | null = null;
  let crewName: string | null = null;

  try {
    // 사용자의 크루 정보 조회
    const { data: userData, error: userError } = await supabase
      .schema("attendance")
      .from("users")
      .select("verified_crew_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.verified_crew_id) {
      console.error("Error fetching user's verified_crew_id:", userError);
      return {
        selectedYear: year,
        selectedMonth: month,
        attendanceRanking: [],
        hostingRanking: [],
        crewName: null,
      };
    }

    crewId = userData.verified_crew_id;

    // 크루 이름 조회
    const { data: crewData } = await supabase
      .schema("attendance")
      .from("crews")
      .select("name")
      .eq("id", crewId)
      .single();

    crewName = crewData?.name || null;

    // API 라우트를 통해 실제 랭킹 데이터 조회
    const response = await fetch(
      `${
        process.env.NEXTAUTH_URL ||
        process.env.VERCEL_URL ||
        "http://localhost:3000"
      }/api/ranking?year=${year}&month=${month}`,
      {
        headers: {
          // 서버에서 API 호출 시 쿠키 전달
          Cookie: (await cookies()).toString(),
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        selectedYear: year,
        selectedMonth: month,
        attendanceRanking: data.attendanceRanking || [],
        hostingRanking: data.hostingRanking || [],
        crewName: data.crewName || crewName,
      };
    }

    // API 호출 실패 시 빈 데이터 반환
    return {
      selectedYear: year,
      selectedMonth: month,
      attendanceRanking: [],
      hostingRanking: [],
      crewName: crewName,
    };
  } catch (error) {
    console.error("초기 랭킹 데이터 조회 오류:", error);
    return {
      selectedYear: year,
      selectedMonth: month,
      attendanceRanking: [],
      hostingRanking: [],
      crewName: crewName,
    };
  }
}

// PageProps 타입 정의
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

  // URL 파라미터에서 년도와 월 추출
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  let year = parseInt(searchParams.year || "", 10);
  let month = parseInt(searchParams.month || "", 10);

  if (isNaN(year) || year < 1900 || year > 2200) {
    year = currentYear;
  }
  if (isNaN(month) || month < 1 || month > 12) {
    month = currentMonth;
  }

  // 초기 데이터만 서버에서 조회
  const initialRankingData = await getInitialRankingData(
    supabase,
    user,
    year,
    month
  );

  return (
    <EnhancedRankingTemplate
      initialData={initialRankingData}
      // onMonthChange는 더 이상 필요하지 않음 (클라이언트에서 처리)
    />
  );
}
