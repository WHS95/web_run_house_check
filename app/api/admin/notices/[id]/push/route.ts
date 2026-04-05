import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
    createServerClient,
    type CookieOptions,
} from "@supabase/ssr";
import { assertAdmin, isGuardFailure } from "@/lib/admin2/api-guard";
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
                    _n: string,
                    _v: string,
                    _o: CookieOptions,
                ) {},
                remove(_n: string, _o: CookieOptions) {},
            },
        },
    );
};

/**
 * 공지사항 푸시 발송.
 * 작성 완료 모달의 "확인" 클릭 시 호출됨.
 * 크루원 전체에게 FCM 푸시 발송.
 */
export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;

    // 관리자 권한 + 크루 확인
    const guard = await assertAdmin("notice.create");
    if (isGuardFailure(guard)) return guard;
    const adminCrewId = guard.crewId;

    // 공지 조회 (자신의 크루 소속만)
    const supabase = await createSupabaseServerClient();
    const { data: notice, error } = await supabase
        .schema("attendance")
        .from("notices")
        .select("id, crew_id, title, type, content")
        .eq("id", id)
        .eq("crew_id", adminCrewId)
        .maybeSingle();

    if (error) {
        console.error(
            "[notice push] fetch failed:",
            error,
        );
        return NextResponse.json(
            {
                success: false,
                message: "공지 조회에 실패했습니다.",
            },
            { status: 500 },
        );
    }
    if (!notice) {
        return NextResponse.json(
            {
                success: false,
                message: "공지를 찾을 수 없습니다.",
            },
            { status: 404 },
        );
    }

    const noticeTitle =
        (notice.title as string | null) ||
        (notice.content as string).slice(0, 30);
    const noticeType =
        (notice.type as string | null) || "일반";

    try {
        await sendNotification(
            adminCrewId,
            null,
            null,
            {
                type: "announcement",
                title: `[${noticeType}] ${noticeTitle}`,
                body: (notice.content as string).slice(
                    0,
                    100,
                ),
                data: {
                    crewId: adminCrewId,
                    url: `/notifications/notice/${notice.id}`,
                },
            },
        );
    } catch (e) {
        console.error("[notice push] send failed:", e);
        return NextResponse.json(
            {
                success: false,
                message: "푸시 발송에 실패했습니다.",
            },
            { status: 500 },
        );
    }

    return NextResponse.json({ success: true });
}
