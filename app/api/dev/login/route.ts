import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 개발 환경 전용 테스트 로그인 API
// Supabase Admin(service_role)으로 사용자 세션 생성
export async function POST(request: Request) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { error: "Not available in production" },
            { status: 403 }
        );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return NextResponse.json(
            { error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
            { status: 500 }
        );
    }

    const { userId } = await request.json();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Admin 클라이언트로 세션 생성
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // generateLink로 매직 링크 생성 (OTP 방식)
    const { data: linkData, error: linkError } =
        await adminClient.auth.admin.generateLink({
            type: "magiclink",
            email: userId,
        });

    if (linkError || !linkData) {
        return NextResponse.json(
            { error: linkError?.message || "Failed to generate link" },
            { status: 500 }
        );
    }

    // OTP로 세션 검증
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
                cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: any) {
                cookieStore.set({ name, value: "", ...options });
            },
        },
    });

    const { data: sessionData, error: verifyError } =
        await supabase.auth.verifyOtp({
            email: userId,
            token: linkData.properties?.hashed_token || "",
            type: "email",
        });

    if (verifyError) {
        return NextResponse.json(
            { error: verifyError.message },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        user: sessionData.user?.email,
    });
}
