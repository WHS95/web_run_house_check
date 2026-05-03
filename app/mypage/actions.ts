'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';
import * as 사용자정책 from '@/lib/domain/user/policies';
import type {
    UserStatusActionResult,
    UserWithdrawActionResult,
} from '@/lib/domain/user/types';
import {
    pushTokenRegisterSchema,
    pushTokenDeactivateSchema,
} from '@/lib/domain/push/validators';
import type { PushTokenActionResult } from '@/lib/domain/push/types';

/**
 * 본인 사용자 상태 조회 (마이페이지/출석 페이지에서 가드용).
 * 기존 /api/user/status GET 대체.
 * (현재 호출자 0건. 미래 사용 대비 유지.)
 */
export async function getUserStatusAction(): Promise<UserStatusActionResult> {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            success: false,
            error: 'unauthorized',
            message: '인증되지 않은 사용자입니다.',
        };
    }

    const { data: userData, error: userError } = await supabase
        .schema('attendance')
        .from('users')
        .select(
            `id, first_name, status, suspended_at, suspension_reason, user_crews!inner (status, suspended_at, suspension_reason)`
        )
        .eq('id', user.id)
        .single();

    if (userError || !userData) {
        return {
            success: false,
            error: 'user_not_found',
            message: '사용자 정보를 찾을 수 없습니다.',
        };
    }

    const userCrewRow = Array.isArray(userData.user_crews)
        ? userData.user_crews[0]
        : userData.user_crews;
    const verdict = 사용자정책.사용자_활성여부_판정({
        user: {
            status: userData.status,
            suspension_reason: userData.suspension_reason,
        },
        userCrew: userCrewRow
            ? {
                  status: userCrewRow.status,
                  suspension_reason: userCrewRow.suspension_reason,
              }
            : null,
    });

    return {
        success: true,
        message: '조회 완료',
        data: {
            userId: userData.id,
            userName: userData.first_name,
            ...verdict,
        },
    };
}

/**
 * 본인 탈퇴 (PII 익명화 + auth.users 삭제).
 * 기존 /api/user/withdraw DELETE 대체.
 */
export async function withdrawUserAction(): Promise<UserWithdrawActionResult> {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            success: false,
            error: 'unauthorized',
            message: '인증되지 않은 사용자입니다.',
        };
    }

    const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: rpcResult, error: rpcError } = await supabaseAdmin
        .schema('attendance')
        .rpc('withdraw_user', { p_user_id: user.id });

    if (rpcError) {
        return {
            success: false,
            error: 'rpc_failed',
            message:
                rpcError.message || '탈퇴 처리 중 오류가 발생했습니다.',
        };
    }

    if (!rpcResult?.success) {
        return {
            success: false,
            error: rpcResult?.error || 'rpc_failed',
            message: rpcResult?.message || '탈퇴 처리에 실패했습니다.',
        };
    }

    const { error: deleteAuthError } =
        await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
        return {
            success: false,
            error: 'auth_delete_failed',
            message:
                '계정 데이터는 익명화되었으나 인증 삭제에 실패했습니다. 다시 시도해주세요.',
        };
    }

    revalidatePath('/mypage');
    revalidatePath('/');

    return {
        success: true,
        message: '탈퇴가 완료되었습니다.',
    };
}

/**
 * 푸시 토큰 등록/갱신. 기존 /api/push/token POST 대체.
 */
export async function registerPushTokenAction(
    input: unknown
): Promise<PushTokenActionResult> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return {
            success: false,
            code: 'unauthenticated',
            message: '인증이 필요합니다.',
        };
    }

    const rl = rateLimit({
        key: `push-token:${user.id}`,
        limit: 20,
        windowMs: 60_000,
    });
    if (!rl.success) {
        return {
            success: false,
            code: 'rate_limited',
            message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        };
    }

    const parsed = pushTokenRegisterSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            code: 'invalid_input',
            message: '토큰과 크루 ID가 필요합니다.',
        };
    }

    const { error } = await supabase
        .schema('attendance')
        .from('user_push_tokens')
        .upsert(
            {
                user_id: user.id,
                crew_id: parsed.data.crewId,
                token: parsed.data.token,
                platform: 'web',
                is_active: true,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'token' }
        );

    if (error) {
        console.error('[push] user_push_tokens upsert 실패', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
        });
        return {
            success: false,
            code: 'db_error',
            message: '알림 등록에 실패했습니다. 잠시 후 다시 시도해주세요.',
        };
    }

    return { success: true };
}

/**
 * 푸시 토큰 비활성화 (로그아웃 시).
 * 기존 /api/push/token DELETE 대체.
 */
export async function deactivatePushTokenAction(
    input: unknown
): Promise<PushTokenActionResult> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: '인증이 필요합니다.' };
    }

    const parsed = pushTokenDeactivateSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, message: '토큰이 필요합니다.' };
    }

    await supabase
        .schema('attendance')
        .from('user_push_tokens')
        .update({
            is_active: false,
            updated_at: new Date().toISOString(),
        })
        .eq('token', parsed.data.token)
        .eq('user_id', user.id);

    return { success: true };
}
