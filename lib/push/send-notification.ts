import { messaging } from "@/lib/firebase/admin";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NotificationPayload } from "./types";

// 서비스 역할 클라이언트 (RLS 우회) — 지연 초기화
let _supabaseAdmin: SupabaseClient | null = null;
function getSupabaseAdmin() {
    if (!_supabaseAdmin) {
        _supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }
    return _supabaseAdmin;
}

/**
 * 범용 알림 발송 함수
 * @param crewId - 대상 크루
 * @param targetRole - 대상 역할 (null이면 전체 회원)
 * @param excludeUserId - 제외할 사용자 (예: 출석자 본인)
 * @param payload - 알림 내용
 */
export async function sendNotification(
    crewId: string,
    targetRole: string | null,
    excludeUserId: string | null,
    payload: NotificationPayload
): Promise<void> {
    try {
        // 1. 대상 토큰 조회
        const supabaseAdmin = getSupabaseAdmin();
        let query = supabaseAdmin
            .schema("attendance")
            .from("user_push_tokens")
            .select("token, user_id")
            .eq("crew_id", crewId)
            .eq("is_active", true);

        // 역할 필터링이 필요한 경우 user_crews 조인
        if (targetRole) {
            const { data: roleUsers } = await supabaseAdmin
                .schema("attendance")
                .from("user_crews")
                .select("user_id")
                .eq("crew_id", crewId)
                .eq("crew_role", targetRole);

            if (!roleUsers || roleUsers.length === 0) return;

            const userIds = roleUsers.map((u) => u.user_id);
            query = query.in("user_id", userIds);
        }

        if (excludeUserId) {
            query = query.neq("user_id", excludeUserId);
        }

        const { data: tokens, error } = await query;

        if (error || !tokens || tokens.length === 0) return;

        // 2. FCM 멀티캐스트 발송 (최대 500개씩)
        const tokenStrings = tokens.map((t) => t.token);
        const chunks = chunkArray(tokenStrings, 500);

        for (const chunk of chunks) {
            const response = await messaging.sendEachForMulticast({
                tokens: chunk,
                notification: {
                    title: payload.title,
                    body: payload.body,
                },
                data: {
                    type: payload.type,
                    ...payload.data,
                },
                webpush: {
                    fcmOptions: {
                        link: "/",
                    },
                },
            });

            // 3. 실패 토큰 비활성화
            if (response.failureCount > 0) {
                const failedTokens: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (
                        !resp.success &&
                        resp.error?.code &&
                        [
                            "messaging/registration-token-not-registered",
                            "messaging/invalid-registration-token",
                        ].includes(resp.error.code)
                    ) {
                        failedTokens.push(chunk[idx]);
                    }
                });

                if (failedTokens.length > 0) {
                    await supabaseAdmin
                        .schema("attendance")
                        .from("user_push_tokens")
                        .update({
                            is_active: false,
                            updated_at: new Date().toISOString(),
                        })
                        .in("token", failedTokens);
                }
            }
        }
    } catch {
        // fire-and-forget: 발송 실패가 비즈니스 로직에 영향 없음
    }
}

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
