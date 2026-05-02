'use server';

import { revalidatePath } from 'next/cache';
import { getUsersByCrewIdOptimized } from '@/lib/supabase/admin';
import { assertAdminAction } from '@/lib/admin2/action-auth';
import type { AdminActionResult } from '@/lib/domain/admin/types';

/**
 * 인증된 admin이 자신의 크루 사용자 목록을 조회.
 * 기존 /api/admin/users?crewId= GET 대체.
 *
 * 응답 호환을 위해 data + optimized 플래그 유지.
 */
export async function getAdminCrewUsersAction(input: {
    crewId: string;
}): Promise<AdminActionResult<unknown[]> & { optimized?: boolean }> {
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

    const result = await getUsersByCrewIdOptimized(input.crewId);
    if (result.error) {
        return {
            success: false,
            error: 'database_error',
            message: '사용자 데이터를 가져오는데 실패했습니다.',
        };
    }

    return {
        success: true,
        data: result.data || [],
        optimized: true,
    };
}
