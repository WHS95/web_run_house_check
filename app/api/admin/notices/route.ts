import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { sendNotification } from "@/lib/push/send-notification";

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
                    name: string,
                    value: string,
                    options: CookieOptions
                ) {},
                remove(name: string, options: CookieOptions) {},
            },
        }
    );
};

// 크루 공지 목록 조회
export async function GET(request: NextRequest) {
    const supabase = await createSupabaseServerClient();
    const crewId = request.nextUrl.searchParams.get("crewId");

    if (!crewId) {
        return NextResponse.json(
            { success: false, message: "크루 ID가 필요합니다." },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .schema("attendance")
        .from("notices")
        .select("*, author:author_id(first_name)")
        .eq("crew_id", crewId)
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) {
        return NextResponse.json(
            { success: false, message: "공지 조회에 실패했습니다." },
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
    const { crewId, content } = body;

    if (!crewId || !content?.trim()) {
        return NextResponse.json(
            {
                success: false,
                message: "크루 ID와 공지 내용이 필요합니다.",
            },
            { status: 400 }
        );
    }

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
            content: content.trim(),
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json(
            { success: false, message: "공지 등록에 실패했습니다." },
            { status: 500 }
        );
    }

    // FCM 공지 알림 발송 (fire-and-forget)
    sendNotification(crewId, null, null, {
        type: "announcement",
        title: "공지사항",
        body: content.trim().slice(0, 100),
        data: { crewId },
    }).catch(() => {});

    return NextResponse.json({ success: true, data }, { status: 201 });
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
        return NextResponse.json(
            { success: false, message: "공지 삭제에 실패했습니다." },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
