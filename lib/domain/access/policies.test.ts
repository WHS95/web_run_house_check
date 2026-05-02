import { describe, it, expect } from 'vitest';
import * as 접근정책 from './policies';

describe('접근 정책', () => {
    describe('크루멤버_접근가능한가', () => {
        it('isCrewVerified=false면 거부', () => {
            expect(
                접근정책.크루멤버_접근가능한가({
                    userStatus: 'ACTIVE',
                    userCrewStatus: 'ACTIVE',
                    isCrewVerified: false,
                })
            ).toBe(false);
        });

        it('두 status 모두 ACTIVE이고 인증되었으면 허용', () => {
            expect(
                접근정책.크루멤버_접근가능한가({
                    userStatus: 'ACTIVE',
                    userCrewStatus: 'ACTIVE',
                    isCrewVerified: true,
                })
            ).toBe(true);
        });

        it('두 status 모두 null이면 허용 (legacy 호환)', () => {
            expect(
                접근정책.크루멤버_접근가능한가({
                    userStatus: null,
                    userCrewStatus: null,
                    isCrewVerified: true,
                })
            ).toBe(true);
        });

        it('userStatus=SUSPENDED면 거부', () => {
            expect(
                접근정책.크루멤버_접근가능한가({
                    userStatus: 'SUSPENDED',
                    userCrewStatus: 'ACTIVE',
                    isCrewVerified: true,
                })
            ).toBe(false);
        });

        it('userCrewStatus=WITHDRAWN면 거부', () => {
            expect(
                접근정책.크루멤버_접근가능한가({
                    userStatus: 'ACTIVE',
                    userCrewStatus: 'WITHDRAWN',
                    isCrewVerified: true,
                })
            ).toBe(false);
        });

        it('대소문자 무관 (suspended 소문자도 거부)', () => {
            expect(
                접근정책.크루멤버_접근가능한가({
                    userStatus: 'ACTIVE',
                    userCrewStatus: 'suspended',
                    isCrewVerified: true,
                })
            ).toBe(false);
        });

        it('INACTIVE도 거부', () => {
            expect(
                접근정책.크루멤버_접근가능한가({
                    userStatus: 'INACTIVE',
                    userCrewStatus: 'ACTIVE',
                    isCrewVerified: true,
                })
            ).toBe(false);
        });
    });

    describe('출석등록_가능한가', () => {
        it('두 status 모두 ACTIVE면 허용', () => {
            expect(
                접근정책.출석등록_가능한가({
                    userStatus: 'ACTIVE',
                    userCrewStatus: 'ACTIVE',
                })
            ).toBe(true);
        });

        it('두 status 모두 null이면 허용 (legacy 호환)', () => {
            expect(
                접근정책.출석등록_가능한가({
                    userStatus: null,
                    userCrewStatus: null,
                })
            ).toBe(true);
        });

        it('userCrewStatus=SUSPENDED면 거부', () => {
            expect(
                접근정책.출석등록_가능한가({
                    userStatus: 'ACTIVE',
                    userCrewStatus: 'SUSPENDED',
                })
            ).toBe(false);
        });

        it('userStatus=SUSPENDED면 거부', () => {
            expect(
                접근정책.출석등록_가능한가({
                    userStatus: 'SUSPENDED',
                    userCrewStatus: 'ACTIVE',
                })
            ).toBe(false);
        });

        // 가장 현실적인 시나리오: admin 토글이 user_crews.status만 SUSPENDED로 변경.
        // users.status는 보통 null인 상태에서 차단되어야 함.
        it('userStatus=null + userCrewStatus=SUSPENDED 조합도 거부 (admin 토글 시나리오)', () => {
            expect(
                접근정책.출석등록_가능한가({
                    userStatus: null,
                    userCrewStatus: 'SUSPENDED',
                })
            ).toBe(false);
        });
    });
});
