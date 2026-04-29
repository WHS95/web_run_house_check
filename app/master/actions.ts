'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import * as 마스터정책 from '@/lib/domain/master/policies';
import type {
    MasterActionResult,
    CrewRow,
    CrewMemberRow,
} from '@/lib/domain/master/types';

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
