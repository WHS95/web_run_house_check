import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import MemberDetailTemplate from "@/components/templates/MemberDetailTemplate";
import { type User } from "@supabase/supabase-js";

// 서버용 Supabase 클라이언트 (app/page.tsx와 동일한 방식, 추후 lib/supabase/server.ts로 분리 권장)
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
        set(name: string, value: string, options: CookieOptions) {
          // cookieStore.set({ name, value, ...options }); 서버 컴포넌트에서 직접 사용 불가
        },
        remove(name: string, options: CookieOptions) {
          // cookieStore.set({ name, value: "", ...options }); 서버 컴포넌트에서 직접 사용 불가
        },
      },
    }
  );
};

// MemberDetailTemplate에 전달할 사용자 프로필 데이터 타입
interface UserProfileForMyPage {
  firstName: string | null;
  birthYear: number | null;
  joinDate: string | null; // YYYY/MM/DD 형식 또는 ISO 문자열
  rankName: string | null;
  email: string | null;
  phone: string | null;
  profileImageUrl?: string | null;
}

async function getMyPageData(
  supabaseClient: any,
  user: User
): Promise<UserProfileForMyPage | null> {
  let userProfile: UserProfileForMyPage = {
    firstName: null,
    email: user.email || null,
    birthYear: null,
    profileImageUrl: user.user_metadata?.avatar_url || null,
    rankName: null,
    joinDate: null,
    phone: null,
  };

  // 1. users 테이블에서 상세 정보 조회 (join_date, phone 추가)
  const { data: userData, error: userDbError } = await supabaseClient
    .schema("attendance")
    .from("users")
    .select(
      "first_name, birth_year, phone, join_date, profile_image_url, verified_crew_id, is_crew_verified"
    )
    .eq("id", user.id)
    .single();

  if (userDbError) {
    console.error("Error fetching user data from DB:", userDbError);
    return userProfile;
  }

  if (!userData) {
    redirect("/auth/signup");
  }

  userProfile.firstName = userData.first_name;
  userProfile.birthYear = userData.birth_year;
  userProfile.phone = userData.phone;
  if (userData.join_date) {
    userProfile.joinDate = new Date(userData.join_date).toLocaleDateString(
      "ko-KR"
    ); // YYYY. MM. DD. 형식
  }
  if (userData.profile_image_url) {
    userProfile.profileImageUrl = userData.profile_image_url;
  }

  if (!userData.is_crew_verified || !userData.verified_crew_id) {
    redirect("/auth/verify-crew");
  }

  const currentCrewId = userData.verified_crew_id;

  if (currentCrewId) {
    // 크루 이름은 MemberDetailTemplate에서 직접 표시하지 않으므로 조회 생략 가능
    // 등급 조회 로직은 동일
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
      console.error("Error fetching user_crew data for mypage:", userCrewError);
      const { data: defaultGrade } = await supabaseClient
        .schema("attendance")
        .from("grades")
        .select("name")
        .eq("name", "Beginer")
        .single();
      userProfile.rankName = defaultGrade?.name || "Beginer";
    } else if (userCrewData?.crew_grades) {
      userProfile.rankName =
        userCrewData.crew_grades.name_override ||
        userCrewData.crew_grades.grades?.name ||
        "Beginer";
    } else {
      const { data: defaultGrade } = await supabaseClient
        .schema("attendance")
        .from("grades")
        .select("name")
        .eq("name", "Beginer")
        .single();
      userProfile.rankName = defaultGrade?.name || "Beginer";
    }
  } else {
    userProfile.rankName = "Beginer";
  }

  return userProfile;
}

export default async function MyPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    redirect("/auth/login");
  }

  const { user } = session;
  if (!user) {
    redirect("/auth/login");
  }

  const userProfileData = await getMyPageData(supabase, user);

  if (!userProfileData) {
    // getMyPageData에서 오류 발생 시 초기 userProfile 객체가 반환될 수 있음
    // 또는 리다이렉션 되었어야 함.
    console.error(
      "User profile data is null or undefined after getMyPageData call."
    );
    // 기본값으로라도 템플릿을 렌더링하거나, 에러 페이지로 리다이렉트
    return (
      <MemberDetailTemplate
        userProfile={{
          firstName: user.user_metadata?.full_name || user.email || null,
          email: user.email || null,
          birthYear: null,
          joinDate: null,
          phone: null,
          rankName: "-",
          profileImageUrl: user.user_metadata?.avatar_url || null,
        }}
      />
    );
  }

  return <MemberDetailTemplate userProfile={userProfileData} />;
}
