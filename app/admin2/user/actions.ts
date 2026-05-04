'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { assertAdminAction } from '@/lib/admin2/action-auth';
import type { AdminActionResult } from '@/lib/domain/admin/types';
import type { UserForAdmin } from '@/lib/supabase/admin';

/**
 * 기간 입력 — 운영진 화면 칩 (전체 / 최근 N일 / 직접선택).
 * 'all' 은 lifetime 조회.
 */
export type AdminUserPeriodInput =
    | { kind: 'all' }
    | { kind: 'days'; days: number }
    | { kind: 'range'; from: string; to: string }; // ISO date(time) string

interface PeriodBounds {
    from: string | null;
    to: string | null;
}

function 기간_경계_계산(period: AdminUserPeriodInput): PeriodBounds {
    if (period.kind === 'all') {
        return { from: null, to: null };
    }
    if (period.kind === 'days') {
        const now = new Date();
        const from = new Date(
            now.getTime() - period.days * 24 * 60 * 60 * 1000
        );
        return { from: from.toISOString(), to: now.toISOString() };
    }
    return { from: period.from, to: period.to };
}

/**
 * 크루 회원 목록을 기간 필터 적용해 조회한다.
 * period.kind === 'all' 이면 lifetime (= 기존 get_admin_users_unified 와 동일).
 */
export async function getCrewUsersWithPeriodAction(input: {
    crewId: string;
    period: AdminUserPeriodInput;
}): Promise<AdminActionResult<UserForAdmin[]>> {
    const guard = await assertAdminAction('user.manage');
    if (!guard.ok) return guard.failure;

    if (!input.crewId || input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const { from, to } = 기간_경계_계산(input.period);

    const supabase = await createClient();
    const { data, error } = await supabase
        .schema('attendance')
        .rpc('get_admin_users_with_period', {
            p_crew_id: input.crewId,
            p_from: from,
            p_to: to,
        });

    if (error || !data?.success) {
        return {
            success: false,
            error: 'database_error',
            message: '회원 목록 조회에 실패했습니다.',
        };
    }

    return { success: true, data: (data.data ?? []) as UserForAdmin[] };
}

/**
 * 다수 회원을 일괄 비활성화 (모임제외).
 * 본인 / 동급 운영진은 제외하고 잘못된 조작은 거부한다.
 *
 * 결과의 message 에는 처리된 건수가 들어간다.
 */
export async function bulkSuspendCrewUsersAction(input: {
    crewId: string;
    userIds: string[];
    reason?: string;
}): Promise<AdminActionResult<{ updated: number; skipped: number }>> {
    const guard = await assertAdminAction('user.manage');
    if (!guard.ok) return guard.failure;

    if (!input.crewId || input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const ids = Array.from(
        new Set((input.userIds ?? []).filter((id) => typeof id === 'string'))
    );
    if (ids.length === 0) {
        return {
            success: false,
            error: 'invalid_data',
            message: '대상 회원이 없습니다.',
        };
    }

    // 본인은 제외
    const targetIds = ids.filter((id) => id !== guard.auth.userId);
    if (targetIds.length === 0) {
        return {
            success: false,
            error: 'invalid_data',
            message: '본인은 비활성 대상에서 제외됩니다.',
        };
    }

    const supabase = await createClient();
    const reason = input.reason?.trim() || '운영진 일괄 처리';
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
        .schema('attendance')
        .from('user_crews')
        .update({
            status: 'SUSPENDED',
            suspended_at: nowIso,
            suspension_reason: reason,
        })
        .eq('crew_id', input.crewId)
        .in('user_id', targetIds)
        .select('user_id');

    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: '일괄 비활성 처리에 실패했습니다.',
        };
    }

    const updated = data?.length ?? 0;
    const skipped = ids.length - updated;

    revalidatePath('/admin2/user');

    return {
        success: true,
        data: { updated, skipped },
        message: `${updated}명 비활성 처리 완료${
            skipped > 0 ? ` (스킵 ${skipped}명)` : ''
        }`,
    };
}
