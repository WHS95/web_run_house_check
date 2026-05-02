import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

/**
 * 인증된 사용자 + 인증 크루의 status·role을 한 번에 모은 컨텍스트.
 * 크루 페이지 가드/도메인 정책의 공통 입력으로 사용한다.
 */
export interface UserAccessContext {
    userId: string;
    email: string | null;
    /** attendance.users.status (ACTIVE/SUSPENDED/...) */
    userStatus: string | null;
    /** is_crew_verified=true 일 때만 set */
    verifiedCrewId: string | null;
    isCrewVerified: boolean;
    /** 인증 크루의 attendance.user_crews.status */
    userCrewStatus: string | null;
    /** 인증 크루의 attendance.user_crews.crew_role */
    crewRole: string | null;
}

/**
 * 현재 요청의 사용자 접근 컨텍스트를 조회.
 *
 * - React.cache 로 동일 요청 내 중복 호출은 1회로 합쳐진다.
 * - 미인증/미존재 사용자면 null. (호출자가 redirect 등 결정)
 * - 명확성을 위해 users 조회와 user_crews 조회를 분리한다.
 *   user_crews 는 verified_crew_id 가 있을 때만 조회.
 */
export const 사용자_컨텍스트_조회 = cache(
    async (): Promise<UserAccessContext | null> => {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return null;
        }

        const { data: userRow, error: userErr } = await supabase
            .schema('attendance')
            .from('users')
            .select('status, is_crew_verified, verified_crew_id')
            .eq('id', user.id)
            .maybeSingle();

        if (userErr || !userRow) {
            return null;
        }

        const isCrewVerified = userRow.is_crew_verified === true;
        const verifiedCrewId = userRow.verified_crew_id ?? null;

        // 인증 크루가 있을 때만 user_crews 조회. 없으면 status/role은 null.
        let userCrewStatus: string | null = null;
        let crewRole: string | null = null;
        if (verifiedCrewId) {
            const { data: ucRow } = await supabase
                .schema('attendance')
                .from('user_crews')
                .select('status, crew_role')
                .eq('user_id', user.id)
                .eq('crew_id', verifiedCrewId)
                .maybeSingle();
            userCrewStatus = ucRow?.status ?? null;
            crewRole = ucRow?.crew_role ?? null;
        }

        return {
            userId: user.id,
            email: user.email ?? null,
            userStatus: userRow.status ?? null,
            verifiedCrewId,
            isCrewVerified,
            userCrewStatus,
            crewRole,
        };
    }
);
