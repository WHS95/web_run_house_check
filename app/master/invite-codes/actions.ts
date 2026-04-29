'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import * as 초대정책 from '@/lib/domain/invite/policies';
import type {
    InviteCodeRow,
    MasterInviteCodeRow,
} from '@/lib/domain/invite/types';
import type { MasterActionResult } from '@/lib/domain/master/types';

const MAX_GENERATE_ATTEMPTS = 10;

type SbClient = Awaited<ReturnType<typeof createClient>>;

interface 마스터인가성공<T extends string = string> {
    ok: true;
    supabase: SbClient;
    userId: string;
    roleName?: T;
}

interface 마스터인가실패 {
    ok: false;
    result: MasterActionResult<never>;
}

/**
 * SUPER_ADMIN(role_id=1) 또는 ADMIN(role_id=2) 권한 체크.
 * 기존 master/invite-codes/route.ts POST 권한 정책과 동일.
 */
async function 마스터또는_어드민_인가(): Promise<
    마스터인가성공 | 마스터인가실패
> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return {
            ok: false,
            result: {
                success: false,
                error: 'unauthorized',
                message: '인증되지 않은 사용자입니다.',
            },
        };
    }

    const { data: roleCheck } = await supabase
        .schema('attendance')
        .from('user_roles')
        .select('role_id, roles(name)')
        .eq('user_id', user.id)
        .single();

    if (!roleCheck || ![1, 2].includes(roleCheck.role_id)) {
        return {
            ok: false,
            result: {
                success: false,
                error: 'forbidden',
                message: '마스터 관리자 권한이 필요합니다.',
            },
        };
    }

    return { ok: true, supabase, userId: user.id };
}

/**
 * SUPER_ADMIN(role_id=1) 한정 권한 체크.
 * 기존 master/invite-codes/route.ts GET, [id] PATCH/DELETE와 동일.
 */
async function 슈퍼마스터_인가(): Promise<
    마스터인가성공 | 마스터인가실패
> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return {
            ok: false,
            result: {
                success: false,
                error: 'unauthorized',
                message: '인증되지 않은 사용자입니다.',
            },
        };
    }

    const { data: roleCheck } = await supabase
        .schema('attendance')
        .from('user_roles')
        .select('role_id, roles(name)')
        .eq('user_id', user.id)
        .single();

    if (!roleCheck || roleCheck.role_id !== 1) {
        return {
            ok: false,
            result: {
                success: false,
                error: 'forbidden',
                message: '마스터 관리자 권한이 필요합니다.',
            },
        };
    }

    return { ok: true, supabase, userId: user.id };
}

/**
 * 모든 크루의 초대코드 목록(크루 이름 join). /api/master/invite-codes GET 대체.
 */
export async function getMasterInviteCodesAction(): Promise<
    MasterActionResult<MasterInviteCodeRow[]>
> {
    const guard = await 슈퍼마스터_인가();
    if (!guard.ok) return guard.result;
    const { supabase } = guard;

    const { data: codes, error } = await supabase
        .schema('attendance')
        .from('crew_invite_codes')
        .select('*, crews!inner(name)')
        .order('created_at', { ascending: false });
    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: '초대 코드 목록을 불러오는데 실패했습니다.',
        };
    }

    const processed: MasterInviteCodeRow[] = (codes || []).map((c: any) => {
        const { crews, ...rest } = c;
        return {
            ...(rest as InviteCodeRow),
            crew_name: crews?.name ?? null,
        };
    });

    return { success: true, data: processed };
}

/**
 * 마스터가 새 초대 코드 생성. /api/master/invite-codes POST 대체.
 */
export async function createMasterInviteCodeAction(input: {
    crewId: string;
    description?: string | null;
}): Promise<MasterActionResult<MasterInviteCodeRow>> {
    const guard = await 마스터또는_어드민_인가();
    if (!guard.ok) return guard.result;
    const { supabase, userId } = guard;

    if (!input.crewId || typeof input.crewId !== 'string') {
        return {
            success: false,
            error: 'invalid_data',
            message: '크루 ID가 필요합니다.',
        };
    }

    const { data: crew, error: crewError } = await supabase
        .schema('attendance')
        .from('crews')
        .select('id, name')
        .eq('id', input.crewId)
        .single();
    if (crewError || !crew) {
        return {
            success: false,
            error: 'crew_not_found',
            message: '존재하지 않는 크루입니다.',
        };
    }

    let attempts = 0;
    let inviteCode = '';
    while (attempts < MAX_GENERATE_ATTEMPTS) {
        inviteCode = 초대정책.마스터코드_생성();
        const { error: checkError } = await supabase
            .schema('attendance')
            .from('crew_invite_codes')
            .select('id')
            .eq('invite_code', inviteCode)
            .single();
        if (checkError && checkError.code === 'PGRST116') break;
        attempts++;
    }
    if (attempts >= MAX_GENERATE_ATTEMPTS) {
        return {
            success: false,
            error: 'code_generation_failed',
            message:
                '고유한 초대 코드 생성에 실패했습니다. 다시 시도해주세요.',
        };
    }

    const trimmedDesc =
        typeof input.description === 'string' && input.description.trim()
            ? input.description.trim()
            : null;

    const { data: newCode, error: createError } = await supabase
        .schema('attendance')
        .from('crew_invite_codes')
        .insert({
            crew_id: input.crewId,
            invite_code: inviteCode,
            description: trimmedDesc,
            created_by: userId,
        })
        .select()
        .single();
    if (createError || !newCode) {
        return {
            success: false,
            error: 'database_error',
            message: '초대 코드 생성에 실패했습니다.',
        };
    }

    revalidatePath('/master');

    return {
        success: true,
        message: `크루 "${crew.name}"의 초대 코드가 생성되었습니다.`,
        data: {
            ...(newCode as InviteCodeRow),
            crew_name: crew.name,
        },
    };
}

/**
 * 마스터가 초대 코드 수정. /api/master/invite-codes/[id] PATCH 대체.
 * SUPER_ADMIN(role_id=1) 한정.
 */
export async function updateMasterInviteCodeAction(input: {
    codeId: number;
    inviteCode?: string;
    description?: string | null;
    isActive?: boolean;
}): Promise<MasterActionResult<InviteCodeRow>> {
    const guard = await 슈퍼마스터_인가();
    if (!guard.ok) return guard.result;
    const { supabase } = guard;

    if (!input.codeId || isNaN(input.codeId)) {
        return {
            success: false,
            error: 'invalid_id',
            message: '유효하지 않은 초대 코드 ID입니다.',
        };
    }

    // 기존 코드 존재 확인
    const { data: existingCode, error: checkError } = await supabase
        .schema('attendance')
        .from('crew_invite_codes')
        .select('*')
        .eq('id', input.codeId)
        .single();
    if (checkError || !existingCode) {
        return {
            success: false,
            error: 'code_not_found',
            message: '존재하지 않는 초대 코드입니다.',
        };
    }

    const updateData: Record<string, unknown> = {};

    if (input.inviteCode !== undefined) {
        const trimmed = input.inviteCode?.trim();
        if (!trimmed) {
            return {
                success: false,
                error: 'invalid_code',
                message: '초대 코드는 비어있을 수 없습니다.',
            };
        }
        if (trimmed !== existingCode.invite_code) {
            const { data: duplicateCheck, error: duplicateError } =
                await supabase
                    .schema('attendance')
                    .from('crew_invite_codes')
                    .select('id')
                    .eq('invite_code', trimmed)
                    .neq('id', input.codeId)
                    .maybeSingle();
            if (duplicateError) {
                return {
                    success: false,
                    error: 'database_error',
                    message: '초대 코드 중복 확인에 실패했습니다.',
                };
            }
            if (duplicateCheck) {
                return {
                    success: false,
                    error: 'duplicate_code',
                    message: '이미 사용 중인 초대 코드입니다.',
                };
            }
        }
        updateData.invite_code = trimmed;
    }

    if (input.description !== undefined) {
        updateData.description = input.description?.trim() || null;
    }

    if (input.isActive !== undefined) {
        updateData.is_active = Boolean(input.isActive);
    }

    if (Object.keys(updateData).length === 0) {
        return {
            success: false,
            error: 'no_changes',
            message: '변경할 내용이 없습니다.',
        };
    }

    const { data: updatedCode, error: updateError } = await supabase
        .schema('attendance')
        .from('crew_invite_codes')
        .update({
            ...updateData,
            updated_at: new Date().toISOString(),
        })
        .eq('id', input.codeId)
        .select()
        .single();

    if (updateError) {
        return {
            success: false,
            error: 'database_error',
            message: '초대 코드 수정에 실패했습니다.',
        };
    }

    revalidatePath('/master');

    return {
        success: true,
        message: '초대 코드가 성공적으로 수정되었습니다.',
        data: updatedCode as InviteCodeRow,
    };
}

/**
 * 마스터가 초대 코드 비활성화. /api/master/invite-codes/[id] DELETE 대체.
 * 실제 삭제가 아닌 soft delete (is_active=false). SUPER_ADMIN(role_id=1) 한정.
 */
export async function deactivateMasterInviteCodeAction(input: {
    codeId: number;
}): Promise<MasterActionResult<InviteCodeRow>> {
    const guard = await 슈퍼마스터_인가();
    if (!guard.ok) return guard.result;
    const { supabase } = guard;

    if (!input.codeId || isNaN(input.codeId)) {
        return {
            success: false,
            error: 'invalid_id',
            message: '유효하지 않은 초대 코드 ID입니다.',
        };
    }

    const { data: deactivated, error: deleteError } = await supabase
        .schema('attendance')
        .from('crew_invite_codes')
        .update({
            is_active: false,
            updated_at: new Date().toISOString(),
        })
        .eq('id', input.codeId)
        .select()
        .single();

    if (deleteError) {
        return {
            success: false,
            error: 'database_error',
            message: '초대 코드 삭제에 실패했습니다.',
        };
    }

    revalidatePath('/master');

    return {
        success: true,
        message: '초대 코드가 성공적으로 비활성화되었습니다.',
        data: deactivated as InviteCodeRow,
    };
}
