import { NextResponse } from "next/server";
// 서버 측 인증을 위한 클라이언트
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // next 파라미터가 있으면 리다이렉트 URL로 사용
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      try {
        // 사용자 인증 확인
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          // console.log("사용자 인증 실패, 로그인 페이지로 리다이렉트");
          return NextResponse.redirect(`${origin}/auth/login?error=인증 실패`);
        }

        // 사용자가 DB에 등록되어 있는지 확인
        const { data: userData, error: userError } = await supabase
          .schema("attendance")
          .from("users")
          .select("verified_crew_id")
          .eq("id", user.id)
          .single();

        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";

        // 리다이렉트 URL 결정
        const getRedirectUrl = (path: string) => {
          if (isLocalEnv) {
            return `${origin}${path}`;
          } else if (forwardedHost) {
            return `https://${forwardedHost}${path}`;
          } else {
            return `${origin}${path}`;
          }
        };

        // 사용자가 DB에 없거나 오류가 발생한 경우 (신규 회원)
        if (userError || !userData) {
          // console.log("신규 회원 감지, 회원가입 페이지로 리다이렉트");
          return NextResponse.redirect(getRedirectUrl("/auth/signup"));
        }

        // 기존 회원인 경우 원래 페이지로 리다이렉트
        // console.log("기존 회원 로그인 성공");
        return NextResponse.redirect(getRedirectUrl(next));
      } catch (dbError) {
        // //console.error("DB 조회 중 오류:", dbError);
        // DB 오류 시에도 회원가입 페이지로 리다이렉트
        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}/auth/signup`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}/auth/signup`);
        } else {
          return NextResponse.redirect(`${origin}/auth/signup`);
        }
      }
    }
  }

  // 오류 발생 시 사용자를 오류 페이지로 리다이렉트
  return NextResponse.redirect(
    `${origin}/auth/login?error=인증 코드 교환 중 오류가 발생했습니다`
  );
}
