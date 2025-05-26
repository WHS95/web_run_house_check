import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr"; // middleware.ts와 동일한 방식으로 임시 사용
import HomeTemplate from "@/components/templates/HomeTemplate";
import { type User } from "@supabase/supabase-js";

// 서버용 Supabase 클라이언트 인스턴스를 생성하는 헬퍼 함수
// 실제 프로덕션에서는 @/lib/supabase/server.ts와 같은 별도 파일로 분리하는 것이 좋습니다.
const createSupabaseServerClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // 서버 컴포넌트에서는 쿠키 set/remove 직접 호출 불가 (응답 객체 필요)
          // 이 부분은 API 라우트나 미들웨어와 다름. 여기서는 get만 필요.
          // 필요시 NextRequest, NextResponse 객체를 다루는 방식 연구 필요.
        },
        remove(name: string, options: any) {
          // 위와 동일
        },
      },
    }
  );
};

async function getHomePageData(supabaseClient: any, user: User) {
  let userName: string | null = null;
  let crewName: string | null = null;
  let rankName: string | null = null;
  let noticeText: string | null = null;

  const { data: userData, error: userError } = await supabaseClient
    .schema("attendance")
    .from("users")
    .select("first_name, verified_crew_id, is_crew_verified")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    console.error("Error fetching user data for homepage:", userError);
    if (!userData?.is_crew_verified || !userData?.verified_crew_id) {
      // 회원가입/크루인증 미완료 사용자는 signup 또는 verify-crew로
      // 미들웨어에서 /auth/verify-crew로 보내므로, 여기서는 signup으로 유도 가능
      redirect("/auth/signup");
    }
    // 오류 발생 또는 데이터 없음 (그러나 리다이렉트되지 않은 경우)
    return {
      userName: user.user_metadata?.full_name || user.email || "사용자",
      crewName,
      rankName,
      noticeText,
    };
  }

  userName = userData.first_name;

  if (!userData.is_crew_verified || !userData.verified_crew_id) {
    redirect("/auth/verify-crew");
  }

  const currentCrewId = userData.verified_crew_id;

  if (currentCrewId) {
    const { data: crewData, error: crewError } = await supabaseClient
      .schema("attendance")
      .from("crews")
      .select("name")
      .eq("id", currentCrewId)
      .single();

    if (crewError) console.error("Error fetching crew name:", crewError);
    else crewName = crewData?.name || null;

    const { data: userCrewData, error: userCrewError } = await supabaseClient
      .schema("attendance")
      .from("user_crews")
      .select(
        "crew_grade_id, crew_grades(name_override, grade_id, grades(name))"
      )
      .eq("user_id", user.id)
      .eq("crew_id", currentCrewId)
      .single();

    if (userCrewError) {
      console.error("Error fetching user_crew data:", userCrewError);
      // user_crews 정보가 없더라도 기본 등급 부여
      const { data: defaultGrade } = await supabaseClient
        .schema("attendance")
        .from("grades")
        .select("name")
        .eq("name", "Beginer")
        .single();
      rankName = defaultGrade?.name || "Beginer";
    } else if (userCrewData?.crew_grades) {
      rankName =
        userCrewData.crew_grades.name_override ||
        userCrewData.crew_grades.grades?.name ||
        "Beginer";
    } else {
      // crew_grade_id가 null이거나, join된 crew_grades가 없는 경우
      const { data: defaultGrade } = await supabaseClient
        .schema("attendance")
        .from("grades")
        .select("name")
        .eq("name", "Beginer")
        .single();
      rankName = defaultGrade?.name || "Beginer";
    }
  } else {
    // verified_crew_id가 없는 경우, 기본 등급
    rankName = "Beginer";
  }

  // 공지사항 (해당 크루 우선, 없으면 전체 공지)
  const noticeQuery = supabaseClient
    .schema("attendance")
    .from("notices")
    .select("content")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (currentCrewId) {
    noticeQuery.or("crew_id.eq." + currentCrewId + ",crew_id.is.null");
  } else {
    noticeQuery.is("crew_id", null);
  }

  const { data: noticeData, error: noticeError } =
    await noticeQuery.maybeSingle();
  if (noticeError) console.error("Error fetching notice:", noticeError);
  else noticeText = noticeData?.content || null;

  return { userName, crewName, rankName, noticeText };
}

export default async function HomePage() {
  const supabase = createSupabaseServerClient(); // 여기서 클라이언트 생성

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    // session?.user 대신 session으로 확인
    console.log("No active session, redirecting to login.");
    redirect("/auth/login");
  }

  const { user } = session;
  if (!user) {
    // 한번 더 명시적으로 user 객체 확인
    console.log("Session exists, but no user object. Redirecting to login.");
    redirect("/auth/login");
  }

  const pageData = await getHomePageData(supabase, user);

  return (
    <HomeTemplate
      username={pageData.userName}
      crewName={pageData.crewName}
      rankName={pageData.rankName}
      noticeText={pageData.noticeText}
    />
  );
}
