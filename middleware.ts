import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
    const PUBLIC_ROUTES = [
        "/auth/login",
        "/auth/signup",
        "/auth/callback",
        "/auth/verify-crew",
        "/auth/auth-code-error",
        "/_next",
        "/favicon.ico",
    ];

    const { pathname } = req.nextUrl;

    // 공개 라우트, API, 정적 파일 스킵
    if (
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.includes(".") ||
        PUBLIC_ROUTES.some(
            (route) =>
                pathname === route ||
                pathname.startsWith(route + "/")
        )
    ) {
        return NextResponse.next();
    }

    const res = NextResponse.next();

    // 개발 환경 인증 바이패스
    if (
        process.env.NODE_ENV !== "production" &&
        process.env.DEV_BYPASS_AUTH === "true" &&
        process.env.DEV_BYPASS_USER_ID
    ) {
        return res;
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    req.cookies.set({ name, value, ...options });
                    res.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                    req.cookies.set({ name, value: "", ...options });
                    res.cookies.set({ name, value: "", ...options });
                },
            },
        }
    );

    // 1. 인증 확인
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/auth/login";
        redirectUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // 2. 단일 RPC로 모든 권한 확인 (4쿼리 → 1쿼리)
    try {
        const { data: perms, error: permsError } = await supabase
            .schema("attendance")
            .rpc("get_user_permissions", { p_user_id: user.id });

        if (permsError) {
            console.error("권한 확인 오류:", permsError);
            return res;
        }

        // 마스터 관리자 권한 체크
        if (pathname.startsWith("/master")) {
            if (!perms?.is_super_admin) {
                const redirectUrl = req.nextUrl.clone();
                redirectUrl.pathname = "/";
                redirectUrl.searchParams.set("error", "access_denied");
                redirectUrl.searchParams.set(
                    "message",
                    "마스터 관리자 권한이 필요합니다."
                );
                return NextResponse.redirect(redirectUrl);
            }
        }

        // 크루 관리자 권한 체크
        if (
            pathname.startsWith("/admin") &&
            !pathname.startsWith("/master")
        ) {
            if (!perms?.is_crew_manager) {
                const redirectUrl = req.nextUrl.clone();
                redirectUrl.pathname = "/";
                redirectUrl.searchParams.set("error", "access_denied");
                redirectUrl.searchParams.set(
                    "message",
                    "크루 운영진 권한이 필요합니다."
                );
                return NextResponse.redirect(redirectUrl);
            }
        }

        // 크루 인증 체크
        if (!perms?.is_crew_verified && pathname !== "/auth/verify-crew") {
            const redirectUrl = req.nextUrl.clone();
            redirectUrl.pathname = "/auth/verify-crew";
            return NextResponse.redirect(redirectUrl);
        }
    } catch (error) {
        console.error("미들웨어 권한 확인 오류:", error);
    }

    return res;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
