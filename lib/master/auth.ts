import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import * as 마스터정책 from '@/lib/domain/master/policies';

export interface MasterAuthContext {
    userId: string;
    email: string | null;
    firstName: string | null;
}

/**
 * 마스터(role_id=1) 권한 강제.
 *
 * - 미인증 → /auth/login
 * - 권한 부족(role_id !== 1) → /
 *
 * RSC layout/page에서 호출. 요청당 1회만 실행되도록 React.cache로 메모이즈.
 */
export const 마스터_권한_보장 = cache(
    async (): Promise<MasterAuthContext> => {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            redirect('/auth/login');
        }

        const { data: roleCheck } = await supabase
            .schema('attendance')
            .from('user_roles')
            .select('role_id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (!마스터정책.마스터_권한인가(roleCheck)) {
            redirect('/');
        }

        const { data: profile } = await supabase
            .schema('attendance')
            .from('users')
            .select('first_name, email')
            .eq('id', user.id)
            .maybeSingle();

        return {
            userId: user.id,
            email: profile?.email ?? user.email ?? null,
            firstName: profile?.first_name ?? null,
        };
    }
);
