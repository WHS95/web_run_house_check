import { describe, it, expect } from 'vitest';
import { 시간윈도우_매칭여부 } from './policies';
import type { ActiveHoursSlot, DayOfWeek } from './types';

const DAY_MAP: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * 테스트가 CI/로컬 타임존에 의존하지 않게 하기 위해
 * Date 객체의 getDay/getHours가 안정적으로 결정되도록 헬퍼를 둔다.
 *
 * `new Date(year, monthIdx, day, hour, minute)` 는 로컬 타임존 기준이라
 * getDay()가 입력한 day와 일치한다.
 */
function localDate(
    year: number,
    monthIdx: number,
    day: number,
    hour: number,
    minute: number,
): Date {
    return new Date(year, monthIdx, day, hour, minute);
}

describe('시간윈도우_매칭여부', () => {
    // 2026-05-05 (화요일) 19:00 로컬
    const tueAt19 = localDate(2026, 4, 5, 19, 0);
    // 안전장치: 정말 화요일인지 확인
    const expectedDay: DayOfWeek = DAY_MAP[tueAt19.getDay()];

    it('anytime은 항상 true (슬롯 무관)', () => {
        expect(
            시간윈도우_매칭여부({
                mode: 'anytime',
                activeHours: null,
                capturedAt: tueAt19,
                recentSessionExistsNearby: false,
            }),
        ).toBe(true);
    });

    it('active_hours 슬롯 안이면 true', () => {
        const slot: ActiveHoursSlot = {
            day: expectedDay,
            from: '18:00',
            to: '22:00',
        };
        expect(
            시간윈도우_매칭여부({
                mode: 'active_hours',
                activeHours: [slot],
                capturedAt: tueAt19,
                recentSessionExistsNearby: false,
            }),
        ).toBe(true);
    });

    it('active_hours 슬롯 밖이면 false', () => {
        const slot: ActiveHoursSlot = {
            day: expectedDay,
            from: '06:00',
            to: '08:00',
        };
        expect(
            시간윈도우_매칭여부({
                mode: 'active_hours',
                activeHours: [slot],
                capturedAt: tueAt19,
                recentSessionExistsNearby: false,
            }),
        ).toBe(false);
    });

    it('active_hours 슬롯 비어있으면 사실상 제한 없음 (true)', () => {
        expect(
            시간윈도우_매칭여부({
                mode: 'active_hours',
                activeHours: [],
                capturedAt: tueAt19,
                recentSessionExistsNearby: false,
            }),
        ).toBe(true);
    });

    it('cluster_first에서 근처 세션 있으면 슬롯 무관 true', () => {
        expect(
            시간윈도우_매칭여부({
                mode: 'cluster_first',
                activeHours: [
                    { day: expectedDay, from: '06:00', to: '08:00' },
                ],
                capturedAt: tueAt19,
                recentSessionExistsNearby: true,
            }),
        ).toBe(true);
    });

    it('cluster_first에서 근처 세션 없어도 슬롯 안이면 true', () => {
        expect(
            시간윈도우_매칭여부({
                mode: 'cluster_first',
                activeHours: [
                    { day: expectedDay, from: '18:00', to: '22:00' },
                ],
                capturedAt: tueAt19,
                recentSessionExistsNearby: false,
            }),
        ).toBe(true);
    });

    it('cluster_first에서 근처 세션 없고 슬롯 밖이면 false', () => {
        expect(
            시간윈도우_매칭여부({
                mode: 'cluster_first',
                activeHours: [
                    { day: expectedDay, from: '06:00', to: '08:00' },
                ],
                capturedAt: tueAt19,
                recentSessionExistsNearby: false,
            }),
        ).toBe(false);
    });
});
