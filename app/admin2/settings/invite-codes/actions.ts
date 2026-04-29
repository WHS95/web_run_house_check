'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { assertAdminAction } from '@/lib/admin2/action-auth';
import * as 초대정책 from '@/lib/domain/invite/policies';
import type { InviteCodeRow } from '@/lib/domain/invite/types';
import type { AdminActionResult } from '@/lib/domain/admin/types';

const MAX_GENERATE_ATTEMPTS = 10;

/**
 * 자기 크루의 초대코드 단일 조회. /api/admin/invite-codes GET 대체.
 */
export async function getCrewInviteCodeAction(input: {
    crewId: string;
}): Promise<AdminActionResult<InviteCodeRow | null>> {
    const guard = await assertAdminAction('inviteCode.manage');
    if (!guard.ok) return guard.failure;

    if (!input.crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: '크루 ID가 필요합니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const supabase = await createClient();
    const { data: code, error } = await supabase
        .schema('attendance')
        .from('crew_invite_codes')
        .select('*')
        .eq('crew_id', input.crewId)
        .single();

    if (error && error.code !== 'PGRST116') {
        return {
            success: false,
            error: 'database_error',
            message: '초대코드 조회 중 오류가 발생했습니다.',
        };
    }

    return { success: true, data: (code as InviteCodeRow) ?? null };
}

/**
 * 초대코드 생성 또는 수정. /api/admin/invite-codes POST 대체.
 */
export async function upsertCrewInviteCodeAction(input: {
    crewId: string;
    description?: string | null;
    inviteCode?: string | null;
}): Promise<AdminActionResult<InviteCodeRow>> {
    const guard = await assertAdminAction('inviteCode.manage');
    if (!guard.ok) return guard.failure;

    if (!input.crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: '크루 ID가 필요합니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const supabase = await createClient();

    const { data: existing } = await supabase
        .schema('attendance')
        .from('crew_invite_codes')
        .select('id')
        .eq('crew_id', input.crewId)
        .single();

    let newCode: string;
    if (input.inviteCode && input.inviteCode.trim()) {
        const trimmed = input.inviteCode.trim().toUpperCase();
        if (!초대정책.커스텀코드_유효한가(trimmed)) {
            return {
                success: false,
                error: 'invalid_code_format',
                message:
                    '초대코드는 영문 대문자와 숫자로만 구성된 7자리여야 합니다.',
            };
        }
        const { data: dup } = await supabase
            .schema('attendance')
            .from('crew_invite_codes')
            .select('id, crew_id')
            .eq('invite_code', trimmed)
            .single();
        if (dup && dup.crew_id !== input.crewId) {
            return {
                success: false,
                error: 'duplicate_code',
                message: '이미 사용 중인 초대코드입니다.',
            };
        }
        newCode = trimmed;
    } else {
        let attempts = 0;
        let candidate = '';
        do {
            candidate = 초대정책.어드민코드_생성();
            const { data: dup } = await supabase
                .schema('attendance')
                .from('crew_invite_codes')
                .select('id')
                .eq('invite_code', candidate)
                .single();
            if (!dup) break;
            attempts++;
        } while (attempts < MAX_GENERATE_ATTEMPTS);
        if (attempts >= MAX_GENERATE_ATTEMPTS) {
            return {
                success: false,
                error: 'code_generation_failed',
                message: '고유한 초대코드 생성에 실패했습니다.',
            };
        }
        newCode = candidate;
    }

    const payload = {
        crew_id: input.crewId,
        invite_code: newCode,
        description: input.description ?? null,
        created_by: guard.auth.userId,
    };

    if (existing) {
        const { data, error } = await supabase
            .schema('attendance')
            .from('crew_invite_codes')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .select()
            .single();
        if (error) {
            return {
                success: false,
                error: 'database_error',
                message: '초대코드 수정 중 오류가 발생했습니다.',
            };
        }
        revalidatePath('/admin2/settings');
        return {
            success: true,
            data: data as InviteCodeRow,
            message: '초대코드가 수정되었습니다.',
        };
    }

    const { data, error } = await supabase
        .schema('attendance')
        .from('crew_invite_codes')
        .insert([payload])
        .select()
        .single();
    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: '초대코드 생성 중 오류가 발생했습니다.',
        };
    }
    revalidatePath('/admin2/settings');
    return {
        success: true,
        data: data as InviteCodeRow,
        message: '초대코드가 생성되었습니다.',
    };
}

/**
 * 초대코드 삭제. /api/admin/invite-codes DELETE 대체.
 */
export async function deleteCrewInviteCodeAction(input: {
    codeId: number;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('inviteCode.manage');
    if (!guard.ok) return guard.failure;

    if (!input.codeId) {
        return {
            success: false,
            error: 'invalid_data',
            message: '코드 ID가 필요합니다.',
        };
    }

    const supabase = await createClient();
    const { data: codeInfo } = await supabase
        .schema('attendance')
        .from('crew_invite_codes')
        .select('crew_id')
        .eq('id', input.codeId)
        .single();
    if (!codeInfo) {
        return {
            success: false,
            error: 'not_found',
            message: '초대코드를 찾을 수 없습니다.',
        };
    }
    if (codeInfo.crew_id !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    const { error } = await supabase
        .schema('attendance')
        .from('crew_invite_codes')
        .delete()
        .eq('id', input.codeId);
    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: '초대코드 삭제 중 오류가 발생했습니다.',
        };
    }
    revalidatePath('/admin2/settings');
    return { success: true, message: '초대코드가 삭제되었습니다.' };
}
