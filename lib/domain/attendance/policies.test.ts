import { describe, it, expect } from 'vitest';
import * as 출석정책 from './policies';

describe('출석 정책', () => {
    describe('유효한가 (KST 기준 +2시간 윈도우)', () => {
        // 현재 시각을 UTC 2026-04-28T12:00:00 (= KST 21:00)로 고정
        const now = new Date('2026-04-28T12:00:00.000Z');

        it('30분 전 출석은 유효', () => {
            expect(
                출석정책.유효한가(now, '2026-04-28T11:30:00.000Z')
            ).toBe(true);
        });

        it('현재 시각 출석은 유효', () => {
            expect(
                출석정책.유효한가(now, '2026-04-28T12:00:00.000Z')
            ).toBe(true);
        });

        it('+2시간 경계는 유효', () => {
            expect(
                출석정책.유효한가(now, '2026-04-28T14:00:00.000Z')
            ).toBe(true);
        });

        it('+2시간 1분 초과는 거부', () => {
            expect(
                출석정책.유효한가(now, '2026-04-28T14:01:00.000Z')
            ).toBe(false);
        });
    });

    describe('미등록허용', () => {
        it('allow_unregistered_location=true면 허용', () => {
            expect(
                출석정책.미등록허용({ allow_unregistered_location: true })
            ).toBe(true);
        });

        it('allow_unregistered_location=false면 거부', () => {
            expect(
                출석정책.미등록허용({ allow_unregistered_location: false })
            ).toBe(false);
        });
    });

    describe('위치기반_출석필요한가', () => {
        it('location_based_attendance=true면 위치 기반 출석 필요', () => {
            expect(
                출석정책.위치기반_출석필요한가({
                    location_based_attendance: true,
                })
            ).toBe(true);
        });

        it('location_based_attendance=false면 위치 기반 출석 불필요', () => {
            expect(
                출석정책.위치기반_출석필요한가({
                    location_based_attendance: false,
                })
            ).toBe(false);
        });
    });

    describe('출석가능상태인가', () => {
        it('두 status 모두 ACTIVE면 허용', () => {
            expect(
                출석정책.출석가능상태인가({
                    userStatus: 'ACTIVE',
                    userCrewStatus: 'ACTIVE',
                })
            ).toBe(true);
        });

        it('두 status 모두 null이면 허용 (legacy 데이터 호환)', () => {
            expect(
                출석정책.출석가능상태인가({
                    userStatus: null,
                    userCrewStatus: null,
                })
            ).toBe(true);
        });

        it('user_crews.status=SUSPENDED면 거부', () => {
            expect(
                출석정책.출석가능상태인가({
                    userStatus: 'ACTIVE',
                    userCrewStatus: 'SUSPENDED',
                })
            ).toBe(false);
        });

        it('users.status=SUSPENDED면 거부', () => {
            expect(
                출석정책.출석가능상태인가({
                    userStatus: 'SUSPENDED',
                    userCrewStatus: 'ACTIVE',
                })
            ).toBe(false);
        });

        it('대소문자 무관 (suspended 소문자도 거부)', () => {
            expect(
                출석정책.출석가능상태인가({
                    userStatus: 'ACTIVE',
                    userCrewStatus: 'suspended',
                })
            ).toBe(false);
        });

        it('WITHDRAWN/INACTIVE도 거부', () => {
            expect(
                출석정책.출석가능상태인가({
                    userStatus: 'ACTIVE',
                    userCrewStatus: 'WITHDRAWN',
                })
            ).toBe(false);
            expect(
                출석정책.출석가능상태인가({
                    userStatus: 'INACTIVE',
                    userCrewStatus: 'ACTIVE',
                })
            ).toBe(false);
        });
    });
});
