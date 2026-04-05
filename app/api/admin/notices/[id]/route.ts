import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
    createServerClient,
    type CookieOptions,
} from "@supabase/ssr";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";

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
                set(
                    _n: string,
                    _v: string,
                    _o: CookieOptions,
                ) {},
                remove(_n: string, _o: CookieOptions) {},
            },
        },
    );
};

// 공지 상세 조회
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    if (!id) {
        return NextResponse.json(
            { success: false, message: "공지 ID가 필요합니다." },
            { status: 400 },
        );
    }

    // 관리자 권한 + 크루 격리 검증
    const guard = await assertAdmin("notice.update");
    if (isGuardFailure(guard)) return guard;
    const adminCrewId = guard.crewId;

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .schema("attendance")
        .from("notices")
        .select(
            "id, crew_id, title, type, content, is_active, author_id, created_at, author:author_id(first_name)",
        )
        .eq("id", id)
        .eq("crew_id", adminCrewId)
        .maybeSingle();

    if (error) {
        console.error(
            "[notices GET /:id] query failed:",
            error,
        );
        return NextResponse.json(
            { success: false, message: "공지 조회에 실패했습니다." },
            { status: 500 },
        );
    }
    if (!data) {
        return NextResponse.json(
            { success: false, message: "공지를 찾을 수 없습니다." },
            { status: 404 },
        );
    }

    return NextResponse.json({ success: true, data });
}
