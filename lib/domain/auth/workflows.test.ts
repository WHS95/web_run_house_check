import { describe, it, expect } from 'vitest';
import { 가입_upsert_payload_조립 } from './workflows';
import type { User } from '@supabase/supabase-js';
import type { SignupFormData } from './validators';

const baseUser = {
    id: 'user-uuid-1',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-04-01T00:00:00.000Z',
    email: 'old@b.com',
} as unknown as User;

const baseInput: SignupFormData = {
    firstName: '홍길동',
    email: 'a@b.com',
    phoneNumber: '010-1234-5678',
    birthYear: 1990,
    verifiedCrewId: 'crew-uuid-1',
    crewCode: 'ABCDE12',
    privacyConsent: true,
    termsOfService: true,
};

const NOW = new Date('2026-04-28T12:00:00.000Z');

describe('가입_upsert_payload_조립', () => {
    it('기본 필드는 input/user에서 매핑', () => {
        const p = 가입_upsert_payload_조립(baseUser, baseInput, NOW);
        expect(p.id).toBe('user-uuid-1');
        expect(p.first_name).toBe('홍길동');
        expect(p.email).toBe('a@b.com');
        expect(p.phone).toBe('010-1234-5678');
        expect(p.birth_year).toBe(1990);
        expect(p.is_crew_verified).toBe(true);
        expect(p.verified_crew_id).toBe('crew-uuid-1');
    });

    it('NOT NULL 제약 username/password_hash 채움', () => {
        const p = 가입_upsert_payload_조립(baseUser, baseInput, NOW);
        expect(p.username).toBe(baseUser.id);
        expect(p.password_hash).toBe('');
    });

    it('privacyConsent=true면 privacy_consent_agreed_at = now', () => {
        const p = 가입_upsert_payload_조립(baseUser, baseInput, NOW);
        expect(p.privacy_consent_agreed_at).toBe(NOW.toISOString());
        expect(p.terms_of_service_agreed_at).toBe(NOW.toISOString());
    });

    it('privacyConsent=false면 privacy_consent_agreed_at = null', () => {
        const p = 가입_upsert_payload_조립(
            baseUser,
            { ...baseInput, privacyConsent: false },
            NOW
        );
        expect(p.privacy_consent_agreed_at).toBe(null);
    });

    it('app_metadata.provider 있으면 oauth_provider 채움', () => {
        const u = { ...baseUser, app_metadata: { provider: 'google' } } as User;
        const p = 가입_upsert_payload_조립(u, baseInput, NOW);
        expect(p.oauth_provider).toBe('google');
        expect(p.oauth_id).toBeUndefined();
    });

    it('kakao + user_metadata.sub 있으면 oauth_id = sub', () => {
        const u = {
            ...baseUser,
            app_metadata: { provider: 'kakao' },
            user_metadata: { sub: 'kakao-sub-id' },
        } as User;
        const p = 가입_upsert_payload_조립(u, baseInput, NOW);
        expect(p.oauth_provider).toBe('kakao');
        expect(p.oauth_id).toBe('kakao-sub-id');
    });

    it('avatar_url 우선, 없으면 picture, 둘 다 없으면 null', () => {
        const u1 = {
            ...baseUser,
            user_metadata: { avatar_url: 'a.png', picture: 'b.png' },
        } as User;
        expect(가입_upsert_payload_조립(u1, baseInput, NOW).profile_image_url).toBe('a.png');

        const u2 = {
            ...baseUser,
            user_metadata: { picture: 'b.png' },
        } as User;
        expect(가입_upsert_payload_조립(u2, baseInput, NOW).profile_image_url).toBe('b.png');

        const u3 = { ...baseUser, user_metadata: {} } as User;
        expect(가입_upsert_payload_조립(u3, baseInput, NOW).profile_image_url).toBe(null);
    });

    it('birthYear 누락 → birth_year = null', () => {
        const p = 가입_upsert_payload_조립(
            baseUser,
            { ...baseInput, birthYear: null as unknown as number },
            NOW
        );
        expect(p.birth_year).toBe(null);
    });
});
