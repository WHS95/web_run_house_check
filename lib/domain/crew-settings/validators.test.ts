import { describe, it, expect } from 'vitest';
import { TimeWindowSchema, ChurnRulesSchema } from './validators';

describe('TimeWindowSchema', () => {
    it('cluster_first + null 슬롯 통과', () => {
        const r = TimeWindowSchema.safeParse({
            time_window_mode: 'cluster_first',
            active_hours: null,
        });
        expect(r.success).toBe(true);
    });

    it('active_hours 모드 + 슬롯 1개 통과', () => {
        const r = TimeWindowSchema.safeParse({
            time_window_mode: 'active_hours',
            active_hours: [{ day: 'mon', from: '18:00', to: '22:00' }],
        });
        expect(r.success).toBe(true);
    });

    it('잘못된 시각 포맷 거부', () => {
        const r = TimeWindowSchema.safeParse({
            time_window_mode: 'active_hours',
            active_hours: [{ day: 'mon', from: '18시', to: '22:00' }],
        });
        expect(r.success).toBe(false);
    });

    it('from >= to 거부', () => {
        const r = TimeWindowSchema.safeParse({
            time_window_mode: 'active_hours',
            active_hours: [{ day: 'mon', from: '22:00', to: '18:00' }],
        });
        expect(r.success).toBe(false);
    });

    it('알 수 없는 모드 거부', () => {
        const r = TimeWindowSchema.safeParse({
            time_window_mode: 'foo',
            active_hours: null,
        });
        expect(r.success).toBe(false);
    });
});

describe('ChurnRulesSchema', () => {
    it('디폴트 값 통과', () => {
        const r = ChurnRulesSchema.safeParse({
            churn_baseline_weeks: 4,
            churn_min_baseline_rate: 0.5,
            churn_observation_weeks: 2,
            onboarding_window_weeks: 4,
            onboarding_min_count: 2,
        });
        expect(r.success).toBe(true);
    });

    it('baseline rate 1.5 거부', () => {
        const r = ChurnRulesSchema.safeParse({
            churn_baseline_weeks: 4,
            churn_min_baseline_rate: 1.5,
            churn_observation_weeks: 2,
            onboarding_window_weeks: 4,
            onboarding_min_count: 2,
        });
        expect(r.success).toBe(false);
    });

    it('observation_weeks 0 거부', () => {
        const r = ChurnRulesSchema.safeParse({
            churn_baseline_weeks: 4,
            churn_min_baseline_rate: 0.5,
            churn_observation_weeks: 0,
            onboarding_window_weeks: 4,
            onboarding_min_count: 2,
        });
        expect(r.success).toBe(false);
    });
});
