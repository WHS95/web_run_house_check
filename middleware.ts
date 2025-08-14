import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  // 특정 경로는 인증 검사를 건너뜀
  const PUBLIC_ROUTES = [
    "/auth/login",
    "/auth/signup",
    "/auth/callback",
    "/auth/verify-crew",
    "/auth/auth-code-error",
    "/_next",
    "/favicon.ico",
  ];

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) =>
      req.nextUrl.pathname === route ||
      req.nextUrl.pathname.startsWith(route + "/")
  );

  // API 경로와 정적 파일 경로는 처리하지 않음
  if (
    req.nextUrl.pathname.startsWith("/api") ||
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.includes(".") ||
    isPublicRoute
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // Supabase 클라이언트 생성
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: "",
            ...options,
          });
          res.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // 인증 상태 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (authError || !user) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";
    redirectUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 마스터 관리자 페이지 접근 권한 확인
  if (req.nextUrl.pathname.startsWith("/master/admin")) {
    try {
      const { data: roleCheck, error: roleError } = await supabase
        .schema("attendance")
        .from("user_roles")
        .select("role_id, roles(name)")
        .eq("user_id", user.id)
        .single();

      // SUPER_ADMIN (role_id = 1) 권한이 없으면 접근 거부
      if (roleError || !roleCheck || ![1].includes(roleCheck.role_id)) {
        // 403 Forbidden 페이지로 리다이렉트 (또는 메인 페이지로)
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/";
        redirectUrl.searchParams.set("error", "access_denied");
        redirectUrl.searchParams.set("message", "마스터 관리자 권한이 필요합니다.");
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      console.error("마스터 관리자 권한 확인 중 오류:", error);
      // 오류 발생 시 접근 거부
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.searchParams.set("error", "permission_check_failed");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 사용자가 인증되어 있지만, 크루 인증 여부 확인
  try {
    const { data: userData } = await supabase
      .schema("attendance")
      .from("users")
      .select("is_crew_verified")
      .eq("id", user.id)
      .single();

    // 크루 인증이 필요한 사용자를 크루 인증 페이지로 리다이렉트
    if (!userData || !userData.is_crew_verified) {
      // 이미 크루 인증 페이지로 가는 중이라면 리다이렉트 루프 방지
      if (req.nextUrl.pathname !== "/auth/verify-crew") {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/auth/verify-crew";
        return NextResponse.redirect(redirectUrl);
      }
    }
  } catch (error) {
    // //console.error("미들웨어에서 사용자 크루 인증 상태 확인 중 오류:", error);
    // 오류 발생 시 일단 통과시킴 (보안보다 사용성 우선)
  }

  return res;
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
