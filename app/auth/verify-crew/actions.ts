'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import * as 인증정책 from '@/lib/domain/auth/policies';
import { crewVerificationSchema } from '@/lib/domain/auth/validators';
import type {
    AuthActionResult,
    CrewMembershipVerificationOk,
    CrewVerificationStatus,
} from '@/lib/domain/auth/types';

/**
 * 사용자가 초대 코드를 입력해 본인을 크루에 인증.
 * 기존 /api/crew-verification POST 대체.
 */
export async function verifyCrewMembershipAction(
    input: unknown
): Promise<AuthActionResult<CrewMembershipVerificationOk>> {
    const parsed = crewVerificationSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            message: '초대 코드가 필요합니다.',
            errors: parsed.error.flatten().fieldErrors,
        };
    }
    const { inviteCode } = parsed.data;

    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
        return { success: false, message: '인증된 사용자를 찾을 수 없습니다.' };
    }

    const { data: userRow, error: userRowErr } = await supabase
        .schema('attendance')
        .from('users')
        .select('is_crew_verified, verified_crew_id')
        .eq('id', user.id)
        .single();
    if (userRowErr) {
        return {
            success: false,
            message: '사용자 정보를 가져오는 중 오류가 발생했습니다.',
        };
    }

    if (인증정책.인증된_사용자인가(userRow)) {
        return { success: false, message: '이미 크루에 인증된 사용자입니다.' };
    }

    const { data: code, error: codeErr } = await supabase
        .schema('attendance')
        .from('crew_invite_codes')
        .select('id, crew_id, is_active, crews:crew_id(id, name)')
        .eq('invite_code', inviteCode)
        .single();
    if (codeErr || !code) {
        return { success: false, message: '유효하지 않은 초대 코드입니다.' };
    }
    if (!인증정책.초대코드_유효한가(code)) {
        return { success: false, message: '비활성화된 초대 코드입니다.' };
    }

    const { error: updErr } = await supabase
        .schema('attendance')
        .from('users')
        .update({
            verified_crew_id: code.crew_id,
            is_crew_verified: true,
        })
        .eq('id', user.id);
    if (updErr) {
        return {
            success: false,
            message: '사용자 인증 업데이트 중 오류가 발생했습니다.',
        };
    }

    const { error: mappingErr } = await supabase.rpc('upsert_user_crew', {
        p_user_id: user.id,
        p_crew_id: code.crew_id,
    });
    if (mappingErr) {
        return {
            success: false,
            message: '사용자-크루 매핑 중 오류가 발생했습니다.',
        };
    }

    const h = await headers();
    const userIP =
        h.get('x-forwarded-for') || h.get('x-real-ip') || 'unknown';
    const userAgent = h.get('user-agent') || 'unknown';

    const { error: logErr } = await supabase
        .schema('attendance')
        .from('invite_code_usage_logs')
        .insert({
            invite_code_id: code.id,
            user_id: user.id,
            user_ip: userIP,
            user_agent: userAgent,
        });
    if (logErr) {
        // 로그 기록 실패는 전체 프로세스를 실패시키지 않음
        console.warn('코드 사용 로그 기록 실패:', logErr);
    }

    revalidatePath('/auth/verify-crew');
    revalidatePath('/');

    const crewMeta = Array.isArray(code.crews) ? code.crews[0] : code.crews;
    return {
        success: true,
        message: '크루 인증이 완료되었습니다.',
        data: {
            crew: {
                id: code.crew_id,
                name: crewMeta?.name ?? null,
            },
        },
    };
}

/**
 * 사용자의 크루 인증 상태 조회. 기존 /api/crew-verification GET 대체.
 */
export async function getCrewVerificationStatusAction(): Promise<
    AuthActionResult<CrewVerificationStatus>
> {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
        return { success: false, message: '인증된 사용자를 찾을 수 없습니다.' };
    }

    const { data: userRow, error: rowErr } = await supabase
        .schema('attendance')
        .from('users')
        .select(
            'is_crew_verified, verified_crew_id, crews:verified_crew_id(id, name)'
        )
        .eq('id', user.id)
        .single();
    if (rowErr || !userRow) {
        return {
            success: false,
            message: '사용자 정보를 가져오는 중 오류가 발생했습니다.',
        };
    }

    const crewMeta = Array.isArray(userRow.crews)
        ? userRow.crews[0]
        : userRow.crews;

    return {
        success: true,
        message: '조회 완료',
        data: {
            isVerified: userRow.is_crew_verified === true,
            crew: userRow.is_crew_verified
                ? { id: crewMeta?.id, name: crewMeta?.name ?? null }
                : null,
        },
    };
}
