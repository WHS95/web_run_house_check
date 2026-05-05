import { describe, it, expect } from 'vitest';
import { 이탈위험인가, 온보딩위험인가 } from './policies';

describe('이탈위험인가', () => {
    it('baseline 4주 모두 출석 + observation 2주 모두 결석이면 위험', () => {
        // weeks: [obs0, obs1, base0, base1, base2, base3]
        const result = 이탈위험인가({
            baselineWeeks: 4,
            minBaselineRate: 0.5,
            observationWeeks: 2,
            weeklyAttendanceCounts: [0, 0, 1, 2, 1, 1],
        });
        expect(result).toBe(true);
    });

    it('observation 중 한 주라도 출석이 있으면 안전', () => {
        const result = 이탈위험인가({
            baselineWeeks: 4,
            minBaselineRate: 0.5,
            observationWeeks: 2,
            weeklyAttendanceCounts: [1, 0, 1, 1, 1, 1],
        });
        expect(result).toBe(false);
    });

    it('baseline 출석률이 minBaselineRate 미만이면 안전(원래 안 오던 멤버)', () => {
        const result = 이탈위험인가({
            baselineWeeks: 4,
            minBaselineRate: 0.5,
            observationWeeks: 2,
            // baseline 4주 중 1주만 출석 → rate = 0.25 < 0.5
            weeklyAttendanceCounts: [0, 0, 0, 1, 0, 0],
        });
        expect(result).toBe(false);
    });

    it('데이터 부족(배열 길이 < baseline+observation)이면 안전', () => {
        const result = 이탈위험인가({
            baselineWeeks: 4,
            minBaselineRate: 0.5,
            observationWeeks: 2,
            weeklyAttendanceCounts: [0, 0, 1],
        });
        expect(result).toBe(false);
    });

    it('baseline 50% 정확히 일치 (minBaselineRate=0.5)면 위험으로 판정', () => {
        const result = 이탈위험인가({
            baselineWeeks: 4,
            minBaselineRate: 0.5,
            observationWeeks: 2,
            // baseline 4주 중 2주 출석 → rate = 0.5 (>= 0.5)
            weeklyAttendanceCounts: [0, 0, 1, 0, 1, 0],
        });
        expect(result).toBe(true);
    });
});

describe('온보딩위험인가', () => {
    it('가입 3주차 멤버가 출석 1회면 위험 (min=2)', () => {
        const result = 온보딩위험인가({
            weeksSinceJoined: 3,
            onboardingWindowWeeks: 4,
            onboardingMinCount: 2,
            attendanceCount: 1,
        });
        expect(result).toBe(true);
    });

    it('가입 1주차는 너무 이르므로 안전', () => {
        const result = 온보딩위험인가({
            weeksSinceJoined: 1,
            onboardingWindowWeeks: 4,
            onboardingMinCount: 2,
            attendanceCount: 0,
        });
        expect(result).toBe(false);
    });

    it('윈도우(4주) 지난 멤버는 안전 — 더 이상 평가 대상 아님', () => {
        const result = 온보딩위험인가({
            weeksSinceJoined: 6,
            onboardingWindowWeeks: 4,
            onboardingMinCount: 2,
            attendanceCount: 0,
        });
        expect(result).toBe(false);
    });

    it('출석이 임계값 이상이면 안전', () => {
        const result = 온보딩위험인가({
            weeksSinceJoined: 3,
            onboardingWindowWeeks: 4,
            onboardingMinCount: 2,
            attendanceCount: 2,
        });
        expect(result).toBe(false);
    });
});
