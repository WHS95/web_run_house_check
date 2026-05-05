import { describe, it, expect } from 'vitest';
import { 세션귀속_결정, type OpenSession } from './workflow';

const baseSession: OpenSession = {
    id: 's1',
    center_lat: 37.5172,
    center_lng: 126.992,
    radius_m: 100,
    last_joined_at: new Date('2026-05-05T19:00:00Z'),
};

describe('세션귀속_결정', () => {
    it('시간/거리 모두 안이면 attach', () => {
        const r = 세션귀속_결정({
            capturedAt: new Date('2026-05-05T19:05:00Z'),
            capturedLat: 37.5172,
            capturedLng: 126.992,
            openSessions: [baseSession],
            windowMinutes: 15,
            radiusM: 100,
        });
        expect(r).toEqual({ type: 'attach', sessionId: 's1' });
    });

    it('시간 윈도우 밖이면 create', () => {
        const r = 세션귀속_결정({
            capturedAt: new Date('2026-05-05T19:30:00Z'),
            capturedLat: 37.5172,
            capturedLng: 126.992,
            openSessions: [baseSession],
            windowMinutes: 15,
            radiusM: 100,
        });
        expect(r.type).toBe('create');
    });

    it('거리 밖이면 create', () => {
        const r = 세션귀속_결정({
            capturedAt: new Date('2026-05-05T19:05:00Z'),
            capturedLat: 37.53,
            capturedLng: 126.992,
            openSessions: [baseSession],
            windowMinutes: 15,
            radiusM: 100,
        });
        expect(r.type).toBe('create');
    });

    it('open 세션 없으면 create', () => {
        const r = 세션귀속_결정({
            capturedAt: new Date('2026-05-05T19:00:00Z'),
            capturedLat: 37.5172,
            capturedLng: 126.992,
            openSessions: [],
            windowMinutes: 15,
            radiusM: 100,
        });
        expect(r.type).toBe('create');
    });

    it('여러 후보 중 가장 가까운 세션 선택', () => {
        const farther: OpenSession = {
            ...baseSession,
            id: 's2',
            // 더 멀리 떨어진 세션
            center_lat: 37.518,
        };
        const r = 세션귀속_결정({
            capturedAt: new Date('2026-05-05T19:05:00Z'),
            capturedLat: 37.5173,
            capturedLng: 126.992,
            openSessions: [farther, baseSession],
            windowMinutes: 15,
            radiusM: 200,
        });
        expect(r.sessionId).toBe('s1');
    });

    it('경계 윈도우(=15분 정확)는 포함된다', () => {
        const r = 세션귀속_결정({
            capturedAt: new Date('2026-05-05T19:15:00Z'),
            capturedLat: 37.5172,
            capturedLng: 126.992,
            openSessions: [baseSession],
            windowMinutes: 15,
            radiusM: 100,
        });
        expect(r.type).toBe('attach');
    });

    it('과거 시각도 ±윈도우 안이면 attach (대칭성)', () => {
        const r = 세션귀속_결정({
            // last_joined_at 5분 전 출석
            capturedAt: new Date('2026-05-05T18:55:00Z'),
            capturedLat: 37.5172,
            capturedLng: 126.992,
            openSessions: [baseSession],
            windowMinutes: 15,
            radiusM: 100,
        });
        expect(r.type).toBe('attach');
    });
});
