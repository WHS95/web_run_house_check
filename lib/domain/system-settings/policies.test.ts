import { describe, it, expect } from 'vitest';
import { 위험변경_여부 } from './policies';

describe('위험변경_여부', () => {
    it('window를 절반 미만으로 줄이면 위험', () => {
        expect(
            위험변경_여부(
                { session_window_minutes: 15, session_radius_m: 100 },
                { session_window_minutes: 7, session_radius_m: 100 },
            ),
        ).toBe(true);
    });

    it('radius를 절반 미만으로 줄이면 위험', () => {
        expect(
            위험변경_여부(
                { session_window_minutes: 15, session_radius_m: 100 },
                { session_window_minutes: 15, session_radius_m: 40 },
            ),
        ).toBe(true);
    });

    it('소폭 변경은 안전', () => {
        expect(
            위험변경_여부(
                { session_window_minutes: 15, session_radius_m: 100 },
                { session_window_minutes: 12, session_radius_m: 90 },
            ),
        ).toBe(false);
    });

    it('값을 늘리는 변경은 안전', () => {
        expect(
            위험변경_여부(
                { session_window_minutes: 15, session_radius_m: 100 },
                { session_window_minutes: 30, session_radius_m: 200 },
            ),
        ).toBe(false);
    });
});
