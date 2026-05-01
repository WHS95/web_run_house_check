'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import * as 마스터정책 from '@/lib/domain/master/policies';
import * as 마스터검증 from '@/lib/domain/master/validators';
import { 마스터메시지 } from '@/lib/domain/master/messages';
import * as 초대정책 from '@/lib/domain/invite/policies';
import type {
    MasterActionResult,
    CrewRow,
    CrewMemberRow,
} from '@/lib/domain/master/types';

const MAX_INVITE_CODE_ATTEMPTS = 5;

async function assertMaster(): Promise<
    | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
    | { ok: false; result: MasterActionResult<never> }
> {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    if (!마스터정책.마스터_권한인가(roleCheck)) {
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
 * 모든 크루 목록 조회. /api/master/crews GET 대체.
 */
export async function getCrewsAction(): Promise<MasterActionResult<CrewRow[]>> {
    const guard = await assertMaster();
    if (!guard.ok) return guard.result;
    const { supabase } = guard;

    const { data, error } = await supabase
        .schema('attendance')
        .from('crews')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: '크루 목록을 불러오는데 실패했습니다.',
        };
    }

    return { success: true, data: (data ?? []) as CrewRow[] };
}

/**
 * 새 크루 생성. /api/master/crews POST 대체.
 */
export async function createCrewAction(input: {
    name: unknown;
    description?: unknown;
}): Promise<MasterActionResult<CrewRow>> {
    const guard = await assertMaster();
    if (!guard.ok) return guard.result;
    const { supabase } = guard;

    if (!마스터정책.유효한_크루이름인가(input.name)) {
        return {
            success: false,
            error: 'invalid_data',
            message: '크루 이름이 필요합니다.',
        };
    }

    const trimmedName = (input.name as string).trim();
    const trimmedDesc =
        typeof input.description === 'string' && input.description.trim()
            ? input.description.trim()
            : null;

    const { data: existingCrew, error: checkError } = await supabase
        .schema('attendance')
        .from('crews')
        .select('id')
        .eq('name', trimmedName)
        .single();

    if (checkError && checkError.code !== 'PGRST116') {
        return {
            success: false,
            error: 'database_error',
            message: '크루 생성 중 오류가 발생했습니다.',
        };
    }

    if (existingCrew) {
        return {
            success: false,
            error: 'duplicate_name',
            message: '이미 존재하는 크루 이름입니다.',
        };
    }

    const { data: newCrew, error: createError } = await supabase
        .schema('attendance')
        .from('crews')
        .insert({ name: trimmedName, description: trimmedDesc })
        .select()
        .single();

    if (createError) {
        return {
            success: false,
            error: 'database_error',
            message: '크루 생성에 실패했습니다.',
        };
    }

    revalidatePath('/master');

    return {
        success: true,
        message: `크루 "${trimmedName}"이 성공적으로 생성되었습니다.`,
        data: newCrew as CrewRow,
    };
}

/**
 * 크루 멤버 목록 조회. /api/master/crew-members GET 대체.
 */
export async function getCrewMembersAction(input: {
    crewId: string;
}): Promise<MasterActionResult<CrewMemberRow[]>> {
    const guard = await assertMaster();
    if (!guard.ok) return guard.result;
    const { supabase } = guard;

    if (!input.crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: '크루 ID가 필요합니다.',
        };
    }

    const { data: members, error } = await supabase
        .schema('attendance')
        .from('user_crews')
        .select(
            `crew_role, users!inner(id, first_name, email, phone, birth_year, profile_image_url, is_crew_verified, created_at)`
        )
        .eq('crew_id', input.crewId)
        .order('users(created_at)', { ascending: false });

    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: '크루 멤버 조회에 실패했습니다.',
        };
    }

    const formatted: CrewMemberRow[] = (members ?? []).map((m: any) => ({
        ...m.users,
        crew_role: m.crew_role,
    }));

    return { success: true, data: formatted };
}

/**
 * 크루 멤버 권한 업데이트. /api/master/crew-members PATCH 대체.
 */
export async function updateCrewMemberRoleAction(input: {
    crewId: string;
    userId: string;
    newRole: unknown;
}): Promise<MasterActionResult> {
    const guard = await assertMaster();
    if (!guard.ok) return guard.result;
    const { supabase } = guard;

    if (!input.crewId || !input.userId || !input.newRole) {
        return {
            success: false,
            error: 'invalid_data',
            message: '필수 정보가 누락되었습니다.',
        };
    }

    if (!마스터정책.유효한_크루역할인가(input.newRole)) {
        return {
            success: false,
            error: 'invalid_role',
            message: '유효하지 않은 역할입니다.',
        };
    }

    const { data, error } = await supabase
        .schema('attendance')
        .from('user_crews')
        .update({ crew_role: input.newRole })
        .eq('user_id', input.userId)
        .eq('crew_id', input.crewId)
        .select()
        .single();

    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: '권한 업데이트에 실패했습니다.',
        };
    }

    revalidatePath('/master');

    return {
        success: true,
        data,
        message:
            input.newRole === 'CREW_MANAGER'
                ? '운영진으로 승격되었습니다.'
                : '일반 멤버로 변경되었습니다.',
    };
}

/**
 * 크루 생성 + (옵션) first-admin 초대코드 자동 발급.
 * 1) crew insert
 * 2) generate_first_admin_code === true이면 crew_invite_codes에
 *    is_first_admin_code=true row 발급 (best-effort: 실패 시 크루는 살리고 경고 메시지 반환).
 */
export async function createCrewWithFirstAdminCodeAction(
    input: unknown
): Promise<
    MasterActionResult<{ crew: CrewRow; invite_code: string | null }>
> {
    const guard = await assertMaster();
    if (!guard.ok) return guard.result;
    const { supabase, userId } = guard;

    const validated = 마스터검증.크루생성입력_검증(input);
    if (!validated.ok) {
        return {
            success: false,
            error: validated.field === 'name' ? 'invalid_name' : 'invalid_data',
            message: validated.message,
        };
    }
    const data = validated.data;

    // 동일 이름 크루 중복 체크
    const { data: existingCrew, error: checkError } = await supabase
        .schema('attendance')
        .from('crews')
        .select('id')
        .eq('name', data.name)
        .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
        return {
            success: false,
            error: 'database_error',
            message: 마스터메시지.저장실패,
        };
    }

    if (existingCrew) {
        return {
            success: false,
            error: 'crew_name_taken',
            message: 마스터메시지.크루이름중복,
        };
    }

    // crews insert
    const { data: newCrew, error: createError } = await supabase
        .schema('attendance')
        .from('crews')
        .insert({
            name: data.name,
            description: data.description ?? null,
            region: data.region ?? null,
        })
        .select()
        .single();

    if (createError || !newCrew) {
        return {
            success: false,
            error: 'database_error',
            message: 마스터메시지.저장실패,
        };
    }

    let inviteCode: string | null = null;
    let inviteWarning: string | null = null;

    // first-admin 초대코드 자동 발급 (옵션)
    if (data.generate_first_admin_code === true) {
        let attempts = 0;
        let generated = '';
        let generationOk = false;
        while (attempts < MAX_INVITE_CODE_ATTEMPTS) {
            generated = 초대정책.마스터코드_생성();
            const { error: dupCheckError } = await supabase
                .schema('attendance')
                .from('crew_invite_codes')
                .select('id')
                .eq('invite_code', generated)
                .single();
            if (dupCheckError && dupCheckError.code === 'PGRST116') {
                generationOk = true;
                break;
            }
            attempts++;
        }

        if (!generationOk) {
            inviteWarning =
                '초대 코드 생성에 실패했습니다. 크루 상세에서 다시 시도해주세요.';
        } else {
            const { error: insertCodeError } = await supabase
                .schema('attendance')
                .from('crew_invite_codes')
                .insert({
                    crew_id: newCrew.id,
                    invite_code: generated,
                    is_first_admin_code: true,
                    is_active: true,
                    description: '첫 관리자 가입용',
                    created_by: userId,
                });
            if (insertCodeError) {
                inviteWarning =
                    '초대 코드 저장에 실패했습니다. 크루 상세에서 다시 시도해주세요.';
            } else {
                inviteCode = generated;
            }
        }
    }

    revalidatePath('/master');
    revalidatePath('/master/crews');

    const baseMessage = 마스터메시지.크루생성성공(data.name);
    return {
        success: true,
        message: inviteWarning ? `${baseMessage} (${inviteWarning})` : baseMessage,
        data: { crew: newCrew as CrewRow, invite_code: inviteCode },
    };
}

/**
 * 크루 정보 수정 (이름/설명/지역/위치기반 출석 설정).
 */
export async function updateCrewAction(
    crewId: string,
    input: unknown
): Promise<MasterActionResult<CrewRow>> {
    const guard = await assertMaster();
    if (!guard.ok) return guard.result;
    const { supabase } = guard;

    if (!crewId || typeof crewId !== 'string') {
        return {
            success: false,
            error: 'invalid_id',
            message: '유효하지 않은 크루 ID입니다.',
        };
    }

    const validated = 마스터검증.크루수정입력_검증(input);
    if (!validated.ok) {
        return {
            success: false,
            error:
                validated.field === 'name'
                    ? 'invalid_name'
                    : validated.field === 'accuracy_range'
                        ? 'invalid_accuracy_range'
                        : 'invalid_data',
            message: validated.message,
        };
    }

    const updateData = validated.data;

    if (Object.keys(updateData).length === 0) {
        return {
            success: false,
            error: 'no_changes',
            message: '변경할 내용이 없습니다.',
        };
    }

    // 크루 존재 확인
    const { data: existingCrew, error: existsError } = await supabase
        .schema('attendance')
        .from('crews')
        .select('id, name')
        .eq('id', crewId)
        .maybeSingle();

    if (existsError && existsError.code !== 'PGRST116') {
        return {
            success: false,
            error: 'database_error',
            message: 마스터메시지.저장실패,
        };
    }

    if (!existingCrew) {
        return {
            success: false,
            error: 'crew_not_found',
            message: 마스터메시지.크루없음,
        };
    }

    // 이름이 바뀐 경우 다른 크루와 중복인지 체크
    if (updateData.name && updateData.name !== existingCrew.name) {
        const { data: dupCrew } = await supabase
            .schema('attendance')
            .from('crews')
            .select('id')
            .eq('name', updateData.name)
            .neq('id', crewId)
            .maybeSingle();
        if (dupCrew) {
            return {
                success: false,
                error: 'crew_name_taken',
                message: 마스터메시지.크루이름중복,
            };
        }
    }

    const { data: updatedCrew, error: updateError } = await supabase
        .schema('attendance')
        .from('crews')
        .update({
            ...updateData,
            updated_at: new Date().toISOString(),
        })
        .eq('id', crewId)
        .select()
        .single();

    if (updateError || !updatedCrew) {
        return {
            success: false,
            error: 'database_error',
            message: 마스터메시지.저장실패,
        };
    }

    revalidatePath('/master/crews');
    revalidatePath(`/master/crews/${crewId}`);

    return {
        success: true,
        message: 마스터메시지.크루수정성공(updatedCrew.name as string),
        data: updatedCrew as CrewRow,
    };
}
