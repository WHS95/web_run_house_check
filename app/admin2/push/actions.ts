'use server';

import { createClient } from '@/lib/supabase/server';
import { messaging } from '@/lib/firebase/admin';
import { assertAdminAction } from '@/lib/admin2/action-auth';
import * as 공지정책 from '@/lib/domain/notice/policies';
import type {
    PushHistoryRow,
    PushTestResult,
} from '@/lib/domain/notice/types';
import type { AdminActionResult } from '@/lib/domain/admin/types';

const PUSH_HISTORY_LIMIT = 5;
const PUSH_HISTORY_SELECT =
    'id, title, target_mode, target_count, success_count, ' +
    'failure_count, created_at';

const DEFAULT_TEST_TITLE = '🏃 RunHouse 테스트';
const DEFAULT_TEST_BODY = '푸시 알림이 정상적으로 작동합니다!';

/**
 * 자기 크루 푸시 발송 이력 조회 (최근 5개).
 * /api/admin/push-history GET 대체.
 */
export async function getPushHistoryAction(input: {
    crewId: string;
}): Promise<AdminActionResult<PushHistoryRow[]>> {
    const guard = await assertAdminAction('pushHistory.view');
    if (!guard.ok) return guard.failure;

    if (!input.crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: 'crewId 파라미터가 필요합니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .schema('attendance')
            .from('push_history')
            .select(PUSH_HISTORY_SELECT)
            .eq('crew_id', input.crewId)
            .order('created_at', { ascending: false })
            .limit(PUSH_HISTORY_LIMIT);

        if (error) {
            return {
                success: false,
                error: 'database_error',
                message: '푸시 발송 내역을 가져오는데 실패했습니다.',
            };
        }

        return {
            success: true,
            data: (data ?? []) as unknown as PushHistoryRow[],
        };
    } catch (e) {
        console.error('[getPushHistoryAction] failed:', e);
        return {
            success: false,
            error: 'database_error',
            message: '푸시 발송 내역을 가져오는데 실패했습니다.',
        };
    }
}

/**
 * 선택한 크루원에게 테스트 푸시 발송. 발송 결과를 push_history에 저장.
 * /api/push/test POST 대체.
 *
 * 기존 라우트는 로그인만 검증했지만 admin2 액션화하면서 pushHistory.view
 * 권한 가드를 적용한다 (관리자/마스터 사용자에 한정).
 *
 * 동일 토큰 중복 제거 후 data-only FCM 멀티캐스트로 발송.
 * crewId/targetMode가 모두 있을 때만 push_history에 기록.
 */
export async function sendTestPushAction(input: {
    userIds: string[];
    title?: string;
    body?: string;
    crewId?: string;
    targetMode?: string;
}): Promise<AdminActionResult<PushTestResult>> {
    const guard = await assertAdminAction('pushHistory.view');
    if (!guard.ok) return guard.failure;

    if (!input.userIds || input.userIds.length === 0) {
        return {
            success: false,
            error: 'invalid_data',
            message: '대상 사용자를 선택해주세요.',
        };
    }

    // crewId가 주어진 경우 자기 크루 한정
    if (input.crewId && input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const title = input.title ?? DEFAULT_TEST_TITLE;
    const body = input.body ?? DEFAULT_TEST_BODY;
    const targetMode = 공지정책.유효한_푸시대상모드(input.targetMode)
        ? input.targetMode
        : null;

    const supabase = await createClient();

    // 대상 토큰 조회
    const { data: tokens, error: tokenError } = await supabase
        .schema('attendance')
        .from('user_push_tokens')
        .select('token, user_id')
        .in('user_id', input.userIds)
        .eq('is_active', true);

    if (tokenError || !tokens || tokens.length === 0) {
        return {
            success: false,
            error: 'no_tokens',
            message: '대상의 활성 토큰이 없습니다.',
        };
    }

    // 동일 토큰 중복 제거 (같은 유저가 여러 크루에 등록된 경우)
    const tokenStrings = Array.from(new Set(tokens.map((t) => t.token)));

    // data-only 메시지: notification 필드를 포함하면 브라우저가 자동
    // 표시 + onBackgroundMessage 중복 표시되어 알림이 2번 나간다.
    // 제목/본문은 data에 담아 서비스 워커가 직접 표시한다.
    const response = await messaging.sendEachForMulticast({
        tokens: tokenStrings,
        data: {
            type: 'announcement',
            title,
            body,
        },
        webpush: { fcmOptions: { link: '/' } },
    });

    // 발송 내역 저장 (crewId와 targetMode가 모두 있을 때만)
    let historyRow: PushHistoryRow | null = null;

    if (input.crewId && targetMode) {
        const { data: insertedHistory, error: insertError } = await supabase
            .schema('attendance')
            .from('push_history')
            .insert({
                crew_id: input.crewId,
                sent_by: guard.auth.userId,
                title,
                target_mode: targetMode,
                target_count: input.userIds.length,
                success_count: response.successCount,
                failure_count: response.failureCount,
            })
            .select(PUSH_HISTORY_SELECT)
            .single();

        if (insertError) {
            console.error(
                '[sendTestPushAction] push_history insert failed:',
                insertError
            );
        } else {
            historyRow = insertedHistory as unknown as PushHistoryRow;
        }
    }

    return {
        success: true,
        data: {
            success: true,
            targetCount: input.userIds.length,
            tokenCount: tokenStrings.length,
            successCount: response.successCount,
            failureCount: response.failureCount,
            history: historyRow,
        },
    };
}
