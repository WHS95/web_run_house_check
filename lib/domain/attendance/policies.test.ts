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

    describe('활성모임_배너VM_생성', () => {
        const baseRow = {
            location: '한강 잠실',
            attendeeCount: 3,
            meetingStartedAt: '2026-05-12T08:20:00.000Z', // KST 17:20
        };

        it('정상 row → ViewModel 반환', () => {
            const vm = 출석정책.활성모임_배너VM_생성(baseRow);
            expect(vm).not.toBeNull();
            expect(vm?.location).toBe('한강 잠실');
            expect(vm?.attendeeCount).toBe(3);
            expect(vm?.meetingStartedLabel).toBe('5월 12일 17:20');
            expect(vm?.dismissKey).toContain('한강 잠실');
            expect(vm?.dismissKey).toContain('2026-05-12T08:20:00.000Z');
        });

        it('null/undefined row → null', () => {
            expect(출석정책.활성모임_배너VM_생성(null)).toBeNull();
            expect(출석정책.활성모임_배너VM_생성(undefined)).toBeNull();
        });

        it('location 빈값 → null', () => {
            expect(
                출석정책.활성모임_배너VM_생성({ ...baseRow, location: '' })
            ).toBeNull();
            expect(
                출석정책.활성모임_배너VM_생성({ ...baseRow, location: '   ' })
            ).toBeNull();
            expect(
                출석정책.활성모임_배너VM_생성({ ...baseRow, location: null })
            ).toBeNull();
        });

        it('attendeeCount 0 또는 음수 → null', () => {
            expect(
                출석정책.활성모임_배너VM_생성({
                    ...baseRow,
                    attendeeCount: 0,
                })
            ).toBeNull();
            expect(
                출석정책.활성모임_배너VM_생성({
                    ...baseRow,
                    attendeeCount: -1,
                })
            ).toBeNull();
        });

        it('meetingStartedAt 비어있음 → null', () => {
            expect(
                출석정책.활성모임_배너VM_생성({
                    ...baseRow,
                    meetingStartedAt: null,
                })
            ).toBeNull();
            expect(
                출석정책.활성모임_배너VM_생성({
                    ...baseRow,
                    meetingStartedAt: '',
                })
            ).toBeNull();
        });

        it('잘못된 날짜 문자열 → null', () => {
            expect(
                출석정책.활성모임_배너VM_생성({
                    ...baseRow,
                    meetingStartedAt: 'not-a-date',
                })
            ).toBeNull();
        });

        it('자정 직후 KST 시각 라벨', () => {
            const vm = 출석정책.활성모임_배너VM_생성({
                ...baseRow,
                meetingStartedAt: '2026-05-11T15:05:00.000Z', // KST 5/12 00:05
            });
            expect(vm?.meetingStartedLabel).toBe('5월 12일 00:05');
        });
    });

    describe('좌표거리_미터', () => {
        it('동일 좌표는 0', () => {
            const d = 출석정책.좌표거리_미터(
                { lat: 37.5172, lng: 126.992 },
                { lat: 37.5172, lng: 126.992 }
            );
            expect(d).toBeLessThan(0.001);
        });

        it('한강 인근에서 약 100m 떨어진 두 점', () => {
            // 위도 0.0009도 ≈ 100m
            const d = 출석정책.좌표거리_미터(
                { lat: 37.5172, lng: 126.992 },
                { lat: 37.5181, lng: 126.992 }
            );
            expect(d).toBeGreaterThan(95);
            expect(d).toBeLessThan(110);
        });

        it('500m 이상 떨어진 두 점은 500보다 큼', () => {
            const d = 출석정책.좌표거리_미터(
                { lat: 37.5172, lng: 126.992 },
                { lat: 37.53, lng: 126.992 }
            );
            expect(d).toBeGreaterThan(500);
        });
    });

    describe('세션귀속_가능여부', () => {
        const 세션 = {
            center_lat: 37.5172,
            center_lng: 126.992,
            radius_m: 100,
        };

        it('100m 안 OK', () => {
            expect(
                출석정책.세션귀속_가능여부(
                    { lat: 37.51725, lng: 126.99205 },
                    세션,
                    100
                )
            ).toBe(true);
        });

        it('500m 밖 NG', () => {
            expect(
                출석정책.세션귀속_가능여부(
                    { lat: 37.53, lng: 126.992 },
                    세션,
                    100
                )
            ).toBe(false);
        });

        it('임계값 확장 시 멀어도 OK', () => {
            expect(
                출석정책.세션귀속_가능여부(
                    { lat: 37.53, lng: 126.992 },
                    세션,
                    5000
                )
            ).toBe(true);
        });
    });
});
