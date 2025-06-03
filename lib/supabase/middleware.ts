import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  const { origin, pathname } = request.nextUrl;

  // 카카오 콜백은 특별 처리
  if (pathname === "/auth/callback") {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // 세션과 사용자 정보 가져오기
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 로그인 페이지 및 콜백 페이지는 항상 접근 가능
  const isAuthRoute = pathname.startsWith("/auth");

  // 세션이 없고 인증 경로가 아닌 경우 로그인 페이지로 리다이렉트
  if (!session && !isAuthRoute) {
    const redirectUrl = new URL("/auth/login", origin);
    return NextResponse.redirect(redirectUrl);
  }

  // 이미 로그인했는데 로그인 페이지로 접근하면 홈으로 리다이렉트
  if (session && pathname === "/auth/login") {
    const redirectUrl = new URL("/", origin);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
