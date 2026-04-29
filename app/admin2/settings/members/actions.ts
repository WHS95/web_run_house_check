'use server';

import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { assertAdminAction } from '@/lib/admin2/action-auth';
import {
    isAdmin_to_crew_role,
    crew_role_to_role_id,
    본인_조작_시도인가,
} from '@/lib/domain/crew/policies';
import type { AdminActionResult } from '@/lib/domain/admin/types';
import type { CrewMemberRow } from '@/lib/domain/crew/types';

/**
 * 자기 크루의 멤버 목록 조회. /api/admin/crew-members GET 대체.
 * Supabase 응답을 role_id/crew_role 정규화한 행으로 매핑한다.
 */
export async function getCrewMembersAction(input: {
    crewId: string;
}): Promise<AdminActionResult<CrewMemberRow[]>> {
    const guard = await assertAdminAction('user.manage');
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
    const { data, error } = await supabase
        .schema('attendance')
        .from('user_crews')
        .select(
            `
        crew_role,
        users!inner(
          id,
          first_name,
          email,
          phone,
          birth_year,
          profile_image_url,
          is_crew_verified,
          created_at
        )
      `
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

    const formatted: CrewMemberRow[] = (data || []).map((row: any) => ({
        ...(row.users as object),
        role_id: crew_role_to_role_id(row.crew_role),
        crew_role: row.crew_role,
    })) as CrewMemberRow[];

    return { success: true, data: formatted };
}

/**
 * 멤버 운영진 권한 토글 (PATCH).
 * /api/admin/crew-members PATCH 대체.
 */
export async function changeCrewMemberRoleAction(input: {
    crewId: string;
    userId: string;
    isAdmin: boolean;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('user.changeRole');
    if (!guard.ok) return guard.failure;

    if (
        !input.userId ||
        typeof input.isAdmin !== 'boolean' ||
        !input.crewId
    ) {
        return {
            success: false,
            error: 'invalid_data',
            message: '필수 정보가 누락되었습니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }
    if (본인_조작_시도인가(input.userId, guard.auth.userId)) {
        return {
            success: false,
            error: 'invalid_data',
            message: '자기 자신의 권한은 변경할 수 없습니다.',
        };
    }

    const newCrewRole = isAdmin_to_crew_role(input.isAdmin);
    const supabase = await createClient();
    const { data, error } = await supabase
        .schema('attendance')
        .from('user_crews')
        .update({ crew_role: newCrewRole })
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

    revalidateTag(`admin:users:${guard.auth.crewId}`);

    return {
        success: true,
        data,
        message: input.isAdmin
            ? '운영진으로 승격되었습니다.'
            : '일반 멤버로 변경되었습니다.',
    };
}

/**
 * 크루 멤버 추방 (DELETE).
 * /api/admin/crew-members DELETE 대체.
 *
 * 동작:
 *   1) users.verified_crew_id/is_crew_verified 초기화 (당해 크루에 대해서만)
 *   2) user_crews 행 삭제
 * 두 작업 중 하나라도 실패하면 실패로 응답.
 */
export async function removeCrewMemberAction(input: {
    crewId: string;
    userId: string;
}): Promise<AdminActionResult> {
    const guard = await assertAdminAction('user.remove');
    if (!guard.ok) return guard.failure;

    if (!input.userId || !input.crewId) {
        return {
            success: false,
            error: 'invalid_data',
            message: '사용자 ID와 크루 ID가 필요합니다.',
        };
    }
    if (input.crewId !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }
    if (본인_조작_시도인가(input.userId, guard.auth.userId)) {
        return {
            success: false,
            error: 'invalid_data',
            message: '자기 자신을 추방할 수 없습니다.',
        };
    }

    const supabase = await createClient();
    const { error: userUpdateError } = await supabase
        .schema('attendance')
        .from('users')
        .update({ verified_crew_id: null, is_crew_verified: false })
        .eq('id', input.userId)
        .eq('verified_crew_id', input.crewId);

    const { error: crewMemberDeleteError } = await supabase
        .schema('attendance')
        .from('user_crews')
        .delete()
        .eq('user_id', input.userId)
        .eq('crew_id', input.crewId);

    if (userUpdateError || crewMemberDeleteError) {
        return {
            success: false,
            error: 'database_error',
            message: '멤버 추방에 실패했습니다.',
        };
    }

    revalidateTag(`admin:users:${guard.auth.crewId}`);

    return {
        success: true,
        message: '멤버가 크루에서 추방되었습니다.',
    };
}
