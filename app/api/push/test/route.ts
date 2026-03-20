import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { messaging } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/push/test — 푸시 토큰이 등록된 사용자 목록 조회
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase
            .auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            );
        }

        // 푸시 토큰이 등록된 사용자 목록 조회
        const { data: tokenUsers, error } = await supabase
            .schema("attendance")
            .from("user_push_tokens")
            .select(`
                user_id,
                crew_id,
                is_active,
                platform,
                updated_at
            `)
            .eq("is_active", true);

        if (error) {
            return NextResponse.json(
                { error: "토큰 목록 조회 실패", detail: error.message },
                { status: 500 }
            );
        }

        // user_id로 사용자 이름 조회
        const uniqueUserIds = Array.from(
            new Set((tokenUsers || []).map((t) => t.user_id))
        );

        const { data: users } = await supabase
            .schema("attendance")
            .from("users")
            .select("id, name")
            .in("id", uniqueUserIds);

        const userMap = new Map(
            (users || []).map((u) => [u.id, u.name])
        );

        // 크루 이름 조회
        const uniqueCrewIds = Array.from(
            new Set(
                (tokenUsers || [])
                    .map((t) => t.crew_id)
                    .filter(Boolean)
            )
        );

        const { data: crews } = await supabase
            .schema("attendance")
            .from("crews")
            .select("id, name")
            .in("id", uniqueCrewIds);

        const crewMap = new Map(
            (crews || []).map((c) => [c.id, c.name])
        );

        const result = (tokenUsers || []).map((t) => ({
            userId: t.user_id,
            userName: userMap.get(t.user_id) || "알 수 없음",
            crewId: t.crew_id,
            crewName: crewMap.get(t.crew_id) || "알 수 없음",
            platform: t.platform,
            updatedAt: t.updated_at,
        }));

        return NextResponse.json({
            currentUserId: user.id,
            targets: result,
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: "조회 중 오류 발생",
                detail: error instanceof Error
                    ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/push/test — 선택한 대상에게 테스트 푸시 발송
 * body: { userIds: string[], title?: string, body?: string }
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase
            .auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            userIds,
            title = "🏃 RunHouse 테스트",
            body: msgBody = "푸시 알림이 정상적으로 작동합니다!",
        } = body as {
            userIds: string[];
            title?: string;
            body?: string;
        };

        if (!userIds || userIds.length === 0) {
            return NextResponse.json(
                { error: "대상 사용자를 선택해주세요." },
                { status: 400 }
            );
        }

        // 대상 토큰 조회
        const { data: tokens, error: tokenError } = await supabase
            .schema("attendance")
            .from("user_push_tokens")
            .select("token, user_id")
            .in("user_id", userIds)
            .eq("is_active", true);

        if (tokenError || !tokens || tokens.length === 0) {
            return NextResponse.json(
                { error: "대상의 활성 토큰이 없습니다." },
                { status: 404 }
            );
        }

        // 동일 토큰 중복 제거 (같은 유저가 여러 크루에 등록된 경우)
        const tokenStrings = Array.from(new Set(tokens.map((t) => t.token)));
        const response = await messaging.sendEachForMulticast({
            tokens: tokenStrings,
            notification: { title, body: msgBody },
            data: { type: "announcement" },
            webpush: { fcmOptions: { link: "/" } },
        });

        return NextResponse.json({
            success: true,
            targetCount: userIds.length,
            tokenCount: tokenStrings.length,
            successCount: response.successCount,
            failureCount: response.failureCount,
        });
    } catch (error) {
        console.error("푸시 테스트 에러:", error);
        return NextResponse.json(
            {
                error: "푸시 발송 중 오류 발생",
                detail: error instanceof Error
                    ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
