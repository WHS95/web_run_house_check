import { z } from 'zod';

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const ActiveHoursSlotSchema = z.object({
    day: z.enum(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']),
    from: z.string().regex(HHMM, 'HH:MM 형식이어야 합니다'),
    to: z.string().regex(HHMM, 'HH:MM 형식이어야 합니다'),
}).refine(
    (s) => s.from < s.to,
    { message: 'from은 to보다 빨라야 합니다', path: ['to'] },
);

export const TimeWindowSchema = z.object({
    time_window_mode: z.enum(['cluster_first', 'active_hours', 'anytime']),
    active_hours: z.array(ActiveHoursSlotSchema).nullable(),
});

export const ChurnRulesSchema = z.object({
    churn_baseline_weeks: z.number().int().min(1).max(26),
    churn_min_baseline_rate: z.number().min(0).max(1),
    churn_observation_weeks: z.number().int().min(1).max(12),
    onboarding_window_weeks: z.number().int().min(1).max(26),
    onboarding_min_count: z.number().int().min(0).max(50),
});

export type TimeWindowInput = z.infer<typeof TimeWindowSchema>;
export type ChurnRulesInput = z.infer<typeof ChurnRulesSchema>;
