import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

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
                set(name: string, value: string, options: CookieOptions) {},
                remove(name: string, options: CookieOptions) {},
            },
        }
    );
};

// 토큰 등록/갱신
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, message: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        // Rate limit 체크
        const rateLimitResult = rateLimit({
            key: `push-token:${user.id}`,
            limit: 20,
            windowMs: 60_000,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { success: false, message: "요청이 너무 많습니다." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { token, crewId } = body;

        if (!token || !crewId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "토큰과 크루 ID가 필요합니다.",
                },
                { status: 400 }
            );
        }

        // upsert: 같은 토큰이면 업데이트, 아니면 삽입
        const { error } = await supabase
            .schema("attendance")
            .from("user_push_tokens")
            .upsert(
                {
                    user_id: user.id,
                    crew_id: crewId,
                    token,
                    platform: "web",
                    is_active: true,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "token" }
            );

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    message: "토큰 등록에 실패했습니다.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { success: false, message: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// 토큰 비활성화 (로그아웃 시)
export async function DELETE(request: Request) {
    const supabase = await createSupabaseServerClient();

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, message: "인증이 필요합니다." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "토큰이 필요합니다." },
                { status: 400 }
            );
        }

        await supabase
            .schema("attendance")
            .from("user_push_tokens")
            .update({
                is_active: false,
                updated_at: new Date().toISOString(),
            })
            .eq("token", token)
            .eq("user_id", user.id);

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { success: false, message: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
