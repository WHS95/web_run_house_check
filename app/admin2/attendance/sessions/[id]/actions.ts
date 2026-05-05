'use server';

/**
 * 세션 보정 페이지 전용 서버 액션.
 * (목록 페이지의 actions.ts와 분리해 관심사 명확화.)
 */

import { createClient } from '@/lib/supabase/server';
import { assertAdminAction } from '@/lib/admin2/action-auth';
import type { AdminActionResult } from '@/lib/domain/admin/types';

export interface UserCandidateRow {
    id: string;
    name: string;
    profile_image_url: string | null;
}

/**
 * 세션 보정용 크루 멤버 검색.
 *
 * - 자기 크루의 ACTIVE 멤버만 반환 (최대 20명)
 * - query가 비어있으면 최근 가입자 우선
 * - query가 있으면 이름 부분 일치
 */
export async function searchCrewMembersForSessionAction(input: {
    sessionId: string;
    query: string;
}): Promise<AdminActionResult<UserCandidateRow[]>> {
    const guard = await assertAdminAction('attendance.edit');
    if (!guard.ok) return guard.failure;

    const supabase = await createClient();

    // 세션이 자기 크루 소속인지 검증
    const { data: session } = await supabase
        .schema('attendance')
        .from('sessions')
        .select('crew_id')
        .eq('id', input.sessionId)
        .maybeSingle();
    if (!session || session.crew_id !== guard.auth.crewId) {
        return {
            success: false,
            error: 'forbidden',
            message: '권한이 없습니다.',
        };
    }

    // user_crews → users join, name ilike 검색
    let q = supabase
        .schema('attendance')
        .from('user_crews')
        .select(
            `
            user_id,
            users:user_id (id, name, profile_image_url)
            `,
        )
        .eq('crew_id', guard.auth.crewId)
        .eq('status', 'ACTIVE')
        .limit(20);

    const { data, error } = await q;
    if (error) {
        return {
            success: false,
            error: 'database_error',
            message: error.message,
        };
    }

    const trimmed = input.query.trim().toLowerCase();
    const rows: UserCandidateRow[] = (data ?? [])
        .map((r) => {
            const raw = r.users as unknown;
            const u = (Array.isArray(raw) ? raw[0] : raw) as
                | {
                      id: string;
                      name: string;
                      profile_image_url: string | null;
                  }
                | null
                | undefined;
            return u
                ? {
                      id: u.id,
                      name: u.name,
                      profile_image_url: u.profile_image_url,
                  }
                : null;
        })
        .filter((u): u is UserCandidateRow => u !== null)
        .filter((u) => !trimmed || u.name.toLowerCase().includes(trimmed))
        .slice(0, 20);

    return { success: true, data: rows };
}
