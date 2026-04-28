import { describe, it, expect } from 'vitest';
import {
    verifyCrewCodeSchema,
    crewVerificationSchema,
    signupSchema,
} from './validators';

describe('auth validators', () => {
    describe('verifyCrewCodeSchema', () => {
        it('crewCode 정상 → success', () => {
            expect(
                verifyCrewCodeSchema.safeParse({ crewCode: 'ABCDE12' }).success
            ).toBe(true);
        });
        it('crewCode 빈 문자열 → 실패', () => {
            expect(verifyCrewCodeSchema.safeParse({ crewCode: '' }).success).toBe(
                false
            );
        });
    });

    describe('crewVerificationSchema', () => {
        it('inviteCode 정상 → success', () => {
            expect(
                crewVerificationSchema.safeParse({ inviteCode: 'XYZ' }).success
            ).toBe(true);
        });
        it('inviteCode 누락 → 실패', () => {
            expect(crewVerificationSchema.safeParse({}).success).toBe(false);
        });
    });

    describe('signupSchema (re-export)', () => {
        it('정상 입력은 success', () => {
            const result = signupSchema.safeParse({
                firstName: '홍길동',
                email: 'a@b.com',
                phoneNumber: '010-1234-5678',
                birthYear: 1990,
                verifiedCrewId: '00000000-0000-0000-0000-000000000001',
                crewCode: 'ABCDE12',
                privacyConsent: true,
                termsOfService: true,
            });
            expect(result.success).toBe(true);
        });
    });
});
