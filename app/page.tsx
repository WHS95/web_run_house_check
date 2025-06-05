import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr"; // middleware.ts와 동일한 방식으로 임시 사용
import EnhancedHomeTemplate from "@/components/templates/EnhancedHomeTemplate";
import { type User } from "@supabase/supabase-js";
import type { Metadata } from "next";

// 메타데이터 설정
export const metadata: Metadata = {
  title: "런하우스 - 홈",
  description:
    "러닝크루원들과 함께하는 출석관리와 모임 참여. 간편한 QR 체크인과 실시간 출석 현황 확인",
  openGraph: {
    title: "런하우스 - 홈",
    description:
      "러닝크루원들과 함께하는 출석관리와 모임 참여. 간편한 QR 체크인과 실시간 출석 현황 확인",
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "런하우스",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "런하우스 - 러닝크루 관리 플랫폼",
        type: "image/png",
      },
      {
        url: "/logo.png",
        width: 400,
        height: 400,
        alt: "런하우스 로고",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "런하우스 - 홈",
    description: "러닝크루원들과 함께하는 출석관리와 모임 참여",
    images: ["/android-chrome-512x512.png"],
  },
  // 카카오톡 공유용 추가 메타데이터
  other: {
    "kakao:title": "런하우스 - 홈",
    "kakao:description": "러닝크루원들과 함께하는 출석관리와 모임 참여",
    "kakao:image": "/android-chrome-512x512.png",
  },
};

// 서버용 Supabase 클라이언트 인스턴스를 생성하는 헬퍼 함수
// 실제 프로덕션에서는 @/lib/supabase/server.ts와 같은 별도 파일로 분리하는 것이 좋습니다.
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

// 병렬 처리를 위한 최적화된 데이터 페칭 함수
async function getHomePageDataOptimized(supabaseClient: any, user: User) {
  try {
    // 1. 사용자 기본 정보 조회 (가장 중요한 쿼리)
    const { data: userData, error: userError } = await supabaseClient
      .schema("attendance")
      .from("users")
      .select("first_name, verified_crew_id, is_crew_verified")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user data:", userError);
      return {
        userName: user.user_metadata?.full_name || user.email || "사용자",
        crewName: null,
        rankName: "Beginer",
        noticeText: null,
      };
    }

    if (!userData.is_crew_verified || !userData.verified_crew_id) {
      redirect("/auth/verify-crew");
    }

    const currentCrewId = userData.verified_crew_id;

    // 2. 병렬로 나머지 데이터 조회 - Promise.all 사용
    const [crewResult, userCrewResult, noticeResult] = await Promise.allSettled(
      [
        // 크루 정보
        supabaseClient
          .schema("attendance")
          .from("crews")
          .select("name")
          .eq("id", currentCrewId)
          .single(),

        // 사용자 크루 등급 정보 (조인 쿼리로 한번에)
        supabaseClient
          .schema("attendance")
          .from("user_crews")
          .select(
            `
          crew_grade_id,
          crew_grades!inner(
            name_override,
            grade_id,
            grades!inner(name)
          )
        `
          )
          .eq("user_id", user.id)
          .eq("crew_id", currentCrewId)
          .maybeSingle(),

        // 공지사항
        supabaseClient
          .schema("attendance")
          .from("notices")
          .select("content")
          .eq("is_active", true)
          .or(`crew_id.eq.${currentCrewId},crew_id.is.null`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]
    );

    // 결과 처리
    const crewName =
      crewResult.status === "fulfilled" && crewResult.value.data
        ? crewResult.value.data.name
        : null;

    let rankName = "Beginer";
    if (
      userCrewResult.status === "fulfilled" &&
      userCrewResult.value.data?.crew_grades
    ) {
      const gradeData = userCrewResult.value.data.crew_grades;
      rankName = gradeData.name_override || gradeData.grades?.name || "Beginer";
    }

    const noticeText =
      noticeResult.status === "fulfilled" && noticeResult.value.data
        ? noticeResult.value.data.content
        : null;

    return {
      userName: userData.first_name,
      crewName,
      rankName,
      noticeText,
    };
  } catch (error) {
    console.error("Error in getHomePageDataOptimized:", error);
    return {
      userName: user.user_metadata?.full_name || user.email || "사용자",
      crewName: null,
      rankName: "Beginer",
      noticeText: null,
    };
  }
}

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    console.log("No active session, redirecting to login.");
    redirect("/auth/login");
  }

  const pageData = await getHomePageDataOptimized(supabase, session.user);

  return (
    <EnhancedHomeTemplate
      username={pageData.userName}
      crewName={pageData.crewName}
      rankName={pageData.rankName}
      noticeText={pageData.noticeText}
    />
  );
}
