'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { getPostHogServer, flushPostHog } from '@/lib/posthog/server';
import * as 인증정책 from '@/lib/domain/auth/policies';
import { 가입_upsert_payload_조립 } from '@/lib/domain/auth/workflows';
import {
    signupSchema,
    verifyCrewCodeSchema,
} from '@/lib/domain/auth/validators';
import type {
    AuthActionResult,
    VerifyCrewCodeOk,
} from '@/lib/domain/auth/types';

async function getClientIp(): Promise<string> {
    const h = await headers();
    return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

/**
 * 크루 초대 코드 1차 검증 (회원가입 폼 진입 단계).
 * 기존 /api/auth/verify-crew-code 대체.
 */
export async function verifyCrewCodeAction(
    input: unknown
): Promise<AuthActionResult<VerifyCrewCodeOk>> {
    const ip = await getClientIp();
    const rl = rateLimit({ key: `verify:${ip}`, limit: 10, windowMs: 60_000 });
    if (!rl.success) {
        return {
            success: false,
            message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        };
    }

    const parsed = verifyCrewCodeSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            message: '유효하지 않은 크루 코드 형식입니다.',
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .schema('attendance')
        .from('crew_invite_codes')
        .select('crew_id, is_active')
        .eq('invite_code', parsed.data.crewCode)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return { success: false, message: '존재하지 않는 크루 코드입니다.' };
        }
        return {
            success: false,
            message: '크루 코드 조회 중 오류가 발생했습니다.',
        };
    }
    if (!data) {
        return { success: false, message: '존재하지 않는 크루 코드입니다.' };
    }

    if (!인증정책.초대코드_유효한가(data)) {
        return { success: false, message: '비활성화된 크루 코드입니다.' };
    }

    return {
        success: true,
        message: '크루 코드가 확인되었습니다.',
        data: { crewId: data.crew_id },
    };
}

/**
 * 회원가입 완료 액션. /api/auth/signup 대체.
 * - rate limit (5/min)
 * - signupSchema 검증
 * - crew 정보 완전성 (도메인)
 * - Supabase auth user 확인
 * - 가입_upsert_payload_조립 (도메인) → users upsert
 * - email 변경 필요 시 supabase.auth.updateUser
 * - increment_crew_invite_code_used_count RPC
 * - user_crews upsert
 * - PostHog identify + capture (server_signup_completed)
 */
export async function signupAction(
    input: unknown
): Promise<AuthActionResult> {
    const ip = await getClientIp();
    const rl = rateLimit({ key: `signup:${ip}`, limit: 5, windowMs: 60_000 });
    if (!rl.success) {
        return {
            success: false,
            message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        };
    }

    const parsed = signupSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            message: '입력값이 유효하지 않습니다.',
            errors: parsed.error.flatten().fieldErrors,
        };
    }

    if (!인증정책.크루정보_완전한가(parsed.data)) {
        return { success: false, message: '크루 정보가 올바르지 않습니다.' };
    }

    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, message: '사용자 인증에 실패했습니다.' };
    }

    if (parsed.data.email && parsed.data.email !== user.email) {
        const { error: updErr } = await supabase.auth.updateUser({
            email: parsed.data.email,
        });
        if (updErr) {
            console.warn('Error updating user email:', updErr);
        }
    }

    const payload = 가입_upsert_payload_조립(user, parsed.data);

    const { error: upsertError } = await supabase
        .schema('attendance')
        .from('users')
        .upsert(payload, { onConflict: 'id' });
    if (upsertError) {
        return {
            success: false,
            message: '회원 정보 저장 중 오류가 발생했습니다.',
        };
    }

    const { error: incrementError } = await supabase.rpc(
        'increment_crew_invite_code_used_count',
        { input_code: parsed.data.crewCode }
    );
    if (incrementError) {
        console.warn(
            'Failed to increment crew_invite_codes used_count:',
            incrementError
        );
    }

    const { error: userCrewError } = await supabase
        .schema('attendance')
        .from('user_crews')
        .upsert(
            {
                user_id: user.id,
                crew_id: parsed.data.verifiedCrewId,
            },
            { onConflict: 'user_id, crew_id' }
        );
    if (userCrewError) {
        return {
            success: false,
            message: '회원가입 중 오류가 발생했습니다.',
        };
    }

    const ph = getPostHogServer();
    if (ph) {
        ph.identify({
            distinctId: user.id,
            properties: {
                name: parsed.data.firstName,
                email: parsed.data.email,
                crew_id: parsed.data.verifiedCrewId,
            },
        });
        ph.capture({
            distinctId: user.id,
            event: 'server_signup_completed',
            properties: {
                crew_id: parsed.data.verifiedCrewId,
                oauth_provider: user.app_metadata?.provider ?? null,
            },
        });
        await flushPostHog();
    }

    revalidatePath('/auth/signup');
    return {
        success: true,
        message: '회원가입이 성공적으로 완료되었습니다.',
    };
}
