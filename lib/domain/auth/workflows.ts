import type { User } from '@supabase/supabase-js';
import type { SignupFormData } from './validators';

/**
 * Supabase Auth user + 가입 폼 입력으로 attendance.users 테이블 upsert payload를 조립한다.
 *
 * NOT NULL 제약(username, password_hash) 보존 + OAuth provider 처리 +
 * Kakao 특수 케이스(user_metadata.sub 사용)를 한 곳에서 처리.
 */
export interface SignupUpsertPayload {
    id: string;
    first_name: string;
    email: string;
    phone: string;
    birth_year: number | null | undefined;
    is_crew_verified: true;
    verified_crew_id: string;
    privacy_consent_agreed: boolean;
    privacy_consent_agreed_at: string | null;
    updated_at: string;
    terms_of_service_agreed: boolean;
    terms_of_service_agreed_at: string;
    profile_image_url: string | null;
    username: string;
    password_hash: string;
    oauth_provider?: string;
    oauth_id?: string;
}

export function 가입_upsert_payload_조립(
    user: User,
    input: SignupFormData,
    now: Date = new Date()
): SignupUpsertPayload {
    const payload: SignupUpsertPayload = {
        id: user.id,
        first_name: input.firstName,
        email: input.email,
        phone: input.phoneNumber,
        birth_year: input.birthYear ?? null,
        is_crew_verified: true,
        verified_crew_id: input.verifiedCrewId,
        privacy_consent_agreed: input.privacyConsent,
        privacy_consent_agreed_at: input.privacyConsent ? now.toISOString() : null,
        updated_at: now.toISOString(),
        terms_of_service_agreed: input.termsOfService,
        terms_of_service_agreed_at: now.toISOString(),
        profile_image_url:
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null,
        username: user.id,
        password_hash: '',
    };

    const provider = user.app_metadata?.provider;
    if (provider) {
        payload.oauth_provider = provider;
    }

    if (provider === 'kakao' && user.user_metadata?.sub) {
        payload.oauth_id = user.user_metadata.sub;
    }

    return payload;
}
