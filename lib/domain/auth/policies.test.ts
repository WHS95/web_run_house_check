import { describe, it, expect } from 'vitest';
import {
    초대코드_유효한가,
    인증된_사용자인가,
    크루정보_완전한가,
} from './policies';

describe('auth 정책', () => {
    describe('초대코드_유효한가', () => {
        it('is_active=true → true', () => {
            expect(초대코드_유효한가({ is_active: true })).toBe(true);
        });
        it('is_active=false → false', () => {
            expect(초대코드_유효한가({ is_active: false })).toBe(false);
        });
    });

    describe('인증된_사용자인가', () => {
        it('is_crew_verified=true → true', () => {
            expect(인증된_사용자인가({ is_crew_verified: true })).toBe(true);
        });
        it('false → false', () => {
            expect(인증된_사용자인가({ is_crew_verified: false })).toBe(false);
        });
        it('null → false', () => {
            expect(인증된_사용자인가({ is_crew_verified: null })).toBe(false);
        });
        it('undefined → false', () => {
            expect(인증된_사용자인가({ is_crew_verified: undefined })).toBe(false);
        });
    });

    describe('크루정보_완전한가', () => {
        it('둘 다 있으면 true', () => {
            expect(
                크루정보_완전한가({ verifiedCrewId: 'uuid', crewCode: 'ABC1234' })
            ).toBe(true);
        });
        it('verifiedCrewId 누락 → false', () => {
            expect(
                크루정보_완전한가({ verifiedCrewId: null, crewCode: 'ABC1234' })
            ).toBe(false);
        });
        it('crewCode 누락 → false', () => {
            expect(
                크루정보_완전한가({ verifiedCrewId: 'uuid', crewCode: '' })
            ).toBe(false);
        });
    });
});
