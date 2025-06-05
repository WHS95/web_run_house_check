import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import MemberDetailTemplate from "@/components/templates/MemberDetailTemplate";
import { type User } from "@supabase/supabase-js";

// ⚡ 서버용 Supabase 클라이언트 (캐시된 인스턴스)
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
          // 서버 컴포넌트에서 직접 사용 불가
        },
        remove(name: string, options: CookieOptions) {
          // 서버 컴포넌트에서 직접 사용 불가
        },
      },
    }
  );
};

// ⚡ 타입 정의 (인터페이스 통합)
interface UserProfileForMyPage {
  firstName: string | null;
  birthYear: number | null;
  joinDate: string | null;
  rankName: string | null;
  email: string | null;
  phone: string | null;
  profileImageUrl?: string | null;
  isAdmin: boolean;
}

interface Activity {
  type: "attendance" | "create_meeting";
  date: string;
  location: string;
  exerciseType: string;
}

interface ActivityData {
  attendanceCount: number;
  meetingsCreatedCount: number;
  activities: Activity[];
}

// ⚡ 통합된 데이터 조회 함수 (병렬 처리로 성능 최적화)
async function getOptimizedMyPageData(
  supabaseClient: any,
  user: User
): Promise<{ userProfile: UserProfileForMyPage; activityData: ActivityData }> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // ⚡ 모든 쿼리를 병렬로 실행하여 성능 최적화
  const [userDataResult, userRoleResult, activityResult] =
    await Promise.allSettled([
      // 1. 기본 사용자 정보
      supabaseClient
        .schema("attendance")
        .from("users")
        .select(
          "first_name, birth_year, phone, join_date, profile_image_url, verified_crew_id, is_crew_verified"
        )
        .eq("id", user.id)
        .single(),

      // 2. 사용자 권한 정보
      supabaseClient
        .schema("attendance")
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id),

      // 3. 활동 데이터 (최적화된 쿼리)
      supabaseClient
        .schema("attendance")
        .from("attendance_records")
        .select(
          "attendance_timestamp, is_host, location, exercise_types!attendance_records_exercise_type_id_fkey(name)"
        )
        .eq("user_id", user.id)
        .gte("attendance_timestamp", ninetyDaysAgo.toISOString())
        .order("attendance_timestamp", { ascending: false })
        .limit(100), // ⚡ 성능을 위해 최대 100개로 제한
    ]);

  // ⚡ 기본 사용자 프로필 초기화
  let userProfile: UserProfileForMyPage = {
    firstName: null,
    email: user.email || null,
    birthYear: null,
    profileImageUrl: user.user_metadata?.avatar_url || null,
    rankName: "Beginer",
    joinDate: null,
    phone: null,
    isAdmin: false,
  };

  // ⚡ 기본 활동 데이터 초기화
  let activityData: ActivityData = {
    attendanceCount: 0,
    meetingsCreatedCount: 0,
    activities: [],
  };

  // 1. 사용자 데이터 처리
  if (userDataResult.status === "fulfilled" && userDataResult.value.data) {
    const userData = userDataResult.value.data;

    if (!userData.is_crew_verified || !userData.verified_crew_id) {
      redirect("/auth/verify-crew");
    }

    userProfile.firstName = userData.first_name;
    userProfile.birthYear = userData.birth_year;
    userProfile.phone = userData.phone;
    if (userData.join_date) {
      userProfile.joinDate = new Date(userData.join_date).toLocaleDateString(
        "ko-KR"
      );
    }
    if (userData.profile_image_url) {
      userProfile.profileImageUrl = userData.profile_image_url;
    }

    // ⚡ 등급 정보를 별도로 조회 (필요한 경우에만)
    const userCrewResult = await supabaseClient
      .schema("attendance")
      .from("user_crews")
      .select(
        "crew_grade_id, crew_grades(name_override, grade_id, grades(name))"
      )
      .eq("user_id", user.id)
      .eq("crew_id", userData.verified_crew_id)
      .single();

    if (userCrewResult.data?.crew_grades) {
      userProfile.rankName =
        userCrewResult.data.crew_grades.name_override ||
        userCrewResult.data.crew_grades.grades?.name ||
        "Beginer";
    }
  } else {
    redirect("/auth/signup");
  }

  // 2. 권한 정보 처리
  if (userRoleResult.status === "fulfilled" && userRoleResult.value.data) {
    userProfile.isAdmin = userRoleResult.value.data.some(
      (role: any) => role.roles?.name === "ADMIN"
    );
  }

  // 3. 활동 데이터 처리
  if (activityResult.status === "fulfilled" && activityResult.value.data) {
    const records = activityResult.value.data;

    activityData.attendanceCount = records.length;
    activityData.meetingsCreatedCount = records.filter(
      (record: { is_host: boolean }) => record.is_host
    ).length;

    // ⚡ 활동 내역 매핑 최적화
    activityData.activities = records.map((record: any) => ({
      type: record.is_host
        ? ("create_meeting" as const)
        : ("attendance" as const),
      date: record.attendance_timestamp,
      location: record.location || "알 수 없음",
      exerciseType: record.exercise_types?.name || "알 수 없음",
    }));
  }

  return { userProfile, activityData };
}

// ⚡ 메인 페이지 컴포넌트 (최적화됨)
export default async function MyPage() {
  const supabase = await createSupabaseServerClient();

  // ⚡ 세션 확인 최적화
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    redirect("/auth/login");
  }

  try {
    // ⚡ 통합 데이터 조회 (병렬 처리)
    const { userProfile, activityData } = await getOptimizedMyPageData(
      supabase,
      session.user
    );

    return (
      <MemberDetailTemplate
        userProfile={userProfile}
        activityData={activityData}
      />
    );
  } catch (error) {
    console.error("MyPage 데이터 로딩 오류:", error);

    // ⚡ 에러 발생 시 기본값으로 렌더링
    return (
      <MemberDetailTemplate
        userProfile={{
          firstName:
            session.user.user_metadata?.full_name || session.user.email || null,
          email: session.user.email || null,
          birthYear: null,
          joinDate: null,
          phone: null,
          rankName: "Beginer",
          profileImageUrl: session.user.user_metadata?.avatar_url || null,
          isAdmin: false,
        }}
        activityData={{
          attendanceCount: 0,
          meetingsCreatedCount: 0,
          activities: [],
        }}
      />
    );
  }
}
