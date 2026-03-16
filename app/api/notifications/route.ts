import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

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

// 개인 알림 목록 조회
export async function GET(request: NextRequest) {
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

    const crewId = request.nextUrl.searchParams.get("crewId");
    if (!crewId) {
        return NextResponse.json(
            { success: false, message: "크루 ID가 필요합니다." },
            { status: 400 }
        );
    }

    const limit = parseInt(
        request.nextUrl.searchParams.get("limit") || "30"
    );
    const offset = parseInt(
        request.nextUrl.searchParams.get("offset") || "0"
    );

    const { data, error } = await supabase
        .schema("attendance")
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("crew_id", crewId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        return NextResponse.json(
            { success: false, message: "알림 조회에 실패했습니다." },
            { status: 500 }
        );
    }

    // 읽지 않은 알림 수
    const { count } = await supabase
        .schema("attendance")
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("crew_id", crewId)
        .eq("is_read", false);

    return NextResponse.json({
        success: true,
        data: data ?? [],
        unreadCount: count ?? 0,
    });
}

// 읽음 처리
export async function PATCH(request: Request) {
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
    const { notificationIds, markAllRead, crewId } = body;

    if (markAllRead && crewId) {
        const { error } = await supabase
            .schema("attendance")
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", user.id)
            .eq("crew_id", crewId)
            .eq("is_read", false);

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    message: "읽음 처리에 실패했습니다.",
                },
                { status: 500 }
            );
        }
    } else if (
        Array.isArray(notificationIds) &&
        notificationIds.length > 0
    ) {
        const { error } = await supabase
            .schema("attendance")
            .from("notifications")
            .update({ is_read: true })
            .in("id", notificationIds)
            .eq("user_id", user.id);

        if (error) {
            return NextResponse.json(
                {
                    success: false,
                    message: "읽음 처리에 실패했습니다.",
                },
                { status: 500 }
            );
        }
    } else {
        return NextResponse.json(
            {
                success: false,
                message: "notificationIds 또는 markAllRead가 필요합니다.",
            },
            { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
}
