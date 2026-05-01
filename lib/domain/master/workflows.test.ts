import { describe, it, expect } from 'vitest';
import {
    크루_활동상태_산출,
    크루목록_조립,
    활동상태_집계,
} from './workflows';
import type { CrewOverviewRow, CrewListItem } from './types';

const NOW = new Date('2026-05-01T00:00:00Z');

function dateBefore(days: number): string {
    return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('master 워크플로우', () => {
    describe('크루_활동상태_산출', () => {
        it('null → dormant', () => {
            expect(크루_활동상태_산출(null, NOW)).toBe('dormant');
        });
        it('undefined → dormant', () => {
            expect(크루_활동상태_산출(undefined, NOW)).toBe('dormant');
        });
        it('1일 전 → active', () => {
            expect(크루_활동상태_산출(dateBefore(1), NOW)).toBe('active');
        });
        it('14일 경계 → active', () => {
            expect(크루_활동상태_산출(dateBefore(14), NOW)).toBe('active');
        });
        it('15일 전 → idle', () => {
            expect(크루_활동상태_산출(dateBefore(15), NOW)).toBe('idle');
        });
        it('30일 경계 → idle', () => {
            expect(크루_활동상태_산출(dateBefore(30), NOW)).toBe('idle');
        });
        it('31일 전 → dormant', () => {
            expect(크루_활동상태_산출(dateBefore(31), NOW)).toBe('dormant');
        });
        it('잘못된 날짜 문자열 → dormant', () => {
            expect(크루_활동상태_산출('not-a-date', NOW)).toBe('dormant');
        });
    });

    describe('크루목록_조립', () => {
        it('각 row에 activity_status 부여', () => {
            const rows: CrewOverviewRow[] = [
                {
                    id: 'a',
                    name: 'A크루',
                    description: null,
                    region: null,
                    profile_image_url: null,
                    created_at: '2026-01-01T00:00:00Z',
                    member_count: 10,
                    last_attendance_at: dateBefore(1),
                    attendance_30d: 5,
                },
                {
                    id: 'b',
                    name: 'B크루',
                    description: null,
                    region: null,
                    profile_image_url: null,
                    created_at: '2026-01-01T00:00:00Z',
                    member_count: 3,
                    last_attendance_at: null,
                    attendance_30d: 0,
                },
            ];
            const result = 크루목록_조립(rows, NOW);
            expect(result).toHaveLength(2);
            expect(result[0].activity_status).toBe('active');
            expect(result[1].activity_status).toBe('dormant');
            expect(result[0].name).toBe('A크루');
        });
        it('빈 배열 → 빈 배열', () => {
            expect(크루목록_조립([], NOW)).toEqual([]);
        });
    });

    describe('활동상태_집계', () => {
        it('상태별 카운트', () => {
            const items: CrewListItem[] = [
                { activity_status: 'active' } as CrewListItem,
                { activity_status: 'active' } as CrewListItem,
                { activity_status: 'idle' } as CrewListItem,
                { activity_status: 'dormant' } as CrewListItem,
                { activity_status: 'dormant' } as CrewListItem,
                { activity_status: 'dormant' } as CrewListItem,
            ];
            expect(활동상태_집계(items)).toEqual({
                active: 2,
                idle: 1,
                dormant: 3,
            });
        });
        it('빈 배열 → 모두 0', () => {
            expect(활동상태_집계([])).toEqual({ active: 0, idle: 0, dormant: 0 });
        });
        it('단일 active', () => {
            const items: CrewListItem[] = [
                { activity_status: 'active' } as CrewListItem,
            ];
            expect(활동상태_집계(items)).toEqual({ active: 1, idle: 0, dormant: 0 });
        });
    });
});
