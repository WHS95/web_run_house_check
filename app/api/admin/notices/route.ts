import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const dynamic = "force-dynamic";

type NoticeType = "공지" | "일반" | "중요";
const VALID_TYPES: NoticeType[] = ["공지", "일반", "중요"];

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
                    name: string,
                    value: string,
                    options: CookieOptions
                ) {},
                remove(name: string, options: CookieOptions) {},
            },
        }
    );
};

// 크루 공지 목록 조회 (+ 제목/내용 기반 검색)
export async function GET(request: NextRequest) {
    const supabase = await createSupabaseServerClient();
    const crewId = request.nextUrl.searchParams.get("crewId");
    const q = request.nextUrl.searchParams
        .get("q")
        ?.trim();

    if (!crewId) {
        return NextResponse.json(
            { success: false, message: "크루 ID가 필요합니다." },
            { status: 400 }
        );
    }

    let query = supabase
        .schema("attendance")
        .from("notices")
        .select(
            "id, crew_id, title, type, content, is_active, author_id, created_at, author:author_id(first_name)"
        )
        .eq("crew_id", crewId)
        .order("created_at", { ascending: false })
        .limit(100);

    if (q) {
        // title 또는 content에 q 포함
        const escaped = q.replace(/[%,]/g, (m) =>
            m === "%" ? "\\%" : "\\,"
        );
        query = query.or(
            `title.ilike.%${escaped}%,content.ilike.%${escaped}%`
        );
    }

    const { data, error } = await query;

    if (error) {
        console.error("[notices GET] query failed:", error);
        return NextResponse.json(
            {
                success: false,
                message: "공지 조회에 실패했습니다.",
            },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true, data });
}

// 새 공지 작성
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient();

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
    const { crewId, title, content, type } = body as {
        crewId?: string;
        title?: string;
        content?: string;
        type?: string;
    };

    if (
        !crewId ||
        !title?.trim() ||
        !content?.trim()
    ) {
        return NextResponse.json(
            {
                success: false,
                message:
                    "크루 ID, 제목, 공지 내용이 필요합니다.",
            },
            { status: 400 }
        );
    }

    const noticeType: NoticeType =
        type && VALID_TYPES.includes(type as NoticeType)
            ? (type as NoticeType)
            : "일반";

    // 기존 활성 공지 비활성화 (최신 1개만 활성)
    await supabase
        .schema("attendance")
        .from("notices")
        .update({ is_active: false })
        .eq("crew_id", crewId)
        .eq("is_active", true);

    // 새 공지 삽입
    const { data, error } = await supabase
        .schema("attendance")
        .from("notices")
        .insert({
            crew_id: crewId,
            author_id: user.id,
            title: title.trim(),
            type: noticeType,
            content: content.trim(),
        })
        .select()
        .single();

    if (error) {
        console.error("[notices POST] insert failed:", error);
        return NextResponse.json(
            {
                success: false,
                message: "공지 등록에 실패했습니다.",
            },
            { status: 500 }
        );
    }

    // 푸시 발송은 클라이언트가 모달 확인 후 별도 엔드포인트로 트리거함
    // (POST /api/admin/notices/[id]/push)

    return NextResponse.json(
        { success: true, data },
        { status: 201 }
    );
}

// 공지 비활성화
export async function DELETE(request: Request) {
    const supabase = await createSupabaseServerClient();

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
    const { noticeId } = body;

    if (!noticeId) {
        return NextResponse.json(
            { success: false, message: "공지 ID가 필요합니다." },
            { status: 400 }
        );
    }

    const { error } = await supabase
        .schema("attendance")
        .from("notices")
        .update({ is_active: false })
        .eq("id", noticeId);

    if (error) {
        console.error(
            "[notices DELETE] update failed:",
            error
        );
        return NextResponse.json(
            {
                success: false,
                message: "공지 삭제에 실패했습니다.",
            },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
