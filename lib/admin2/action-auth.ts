/**
 * Server Action용 admin guard.
 * 기존 api-guard.ts(assertAdmin)는 NextResponse를 반환해 actions.ts에서 사용 못함.
 * 본 모듈은 Server Action 응답 형태({ success, error, message })에 맞춰 실패를 반환한다.
 */
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import {
    can,
    normalizeRole,
    type AdminAction,
    type AdminRole,
} from './permissions';

export interface AdminGuardOk {
    userId: string;
    crewId: string;
    role: AdminRole;
}

export interface AdminGuardFailure {
    success: false;
    error: string;
    message: string;
}

async function createSb() {
    const store = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return store.get(name)?.value;
                },
                set(_n: string, _v: string, _o: CookieOptions) {},
                remove(_n: string, _o: CookieOptions) {},
            },
        }
    );
}

export async function assertAdminAction(
    action: AdminAction
): Promise<
    | { ok: true; auth: AdminGuardOk }
    | { ok: false; failure: AdminGuardFailure }
> {
    const supabase = await createSb();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return {
            ok: false,
            failure: {
                success: false,
                error: 'unauthorized',
                message: '인증이 필요합니다.',
            },
        };
    }

    const { data: userRow } = await supabase
        .schema('attendance')
        .from('users')
        .select('verified_crew_id, is_crew_verified')
        .eq('id', user.id)
        .single();

    if (!userRow?.is_crew_verified || !userRow.verified_crew_id) {
        return {
            ok: false,
            failure: {
                success: false,
                error: 'crew_not_verified',
                message: '크루 인증이 필요합니다.',
            },
        };
    }

    const { data: membership } = await supabase
        .schema('attendance')
        .from('user_crews')
        .select('crew_role')
        .eq('user_id', user.id)
        .eq('crew_id', userRow.verified_crew_id)
        .maybeSingle();

    const role = normalizeRole(membership?.crew_role);
    if (!role || !can(role, action)) {
        return {
            ok: false,
            failure: {
                success: false,
                error: 'forbidden',
                message: '권한이 없습니다.',
            },
        };
    }

    return {
        ok: true,
        auth: { userId: user.id, crewId: userRow.verified_crew_id, role },
    };
}
