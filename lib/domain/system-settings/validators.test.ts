import { describe, it, expect } from 'vitest';
import { SystemSettingsSchema } from './validators';

describe('SystemSettingsSchema', () => {
    it('디폴트 값을 통과시킨다', () => {
        const result = SystemSettingsSchema.safeParse({
            session_window_minutes: 15,
            session_radius_m: 100,
            session_close_minutes: 60,
            auto_label_min_session_count: 5,
        });
        expect(result.success).toBe(true);
    });

    it('session_window_minutes=0 은 거부 (하한 1)', () => {
        const result = SystemSettingsSchema.safeParse({
            session_window_minutes: 0,
            session_radius_m: 100,
            session_close_minutes: 60,
            auto_label_min_session_count: 5,
        });
        expect(result.success).toBe(false);
    });

    it('session_radius_m=5 은 거부 (하한 10)', () => {
        const result = SystemSettingsSchema.safeParse({
            session_window_minutes: 15,
            session_radius_m: 5,
            session_close_minutes: 60,
            auto_label_min_session_count: 5,
        });
        expect(result.success).toBe(false);
    });

    it('session_close_minutes=400 은 거부 (상한 360)', () => {
        const result = SystemSettingsSchema.safeParse({
            session_window_minutes: 15,
            session_radius_m: 100,
            session_close_minutes: 400,
            auto_label_min_session_count: 5,
        });
        expect(result.success).toBe(false);
    });

    it('소수 값은 거부 (정수 강제)', () => {
        const result = SystemSettingsSchema.safeParse({
            session_window_minutes: 15.5,
            session_radius_m: 100,
            session_close_minutes: 60,
            auto_label_min_session_count: 5,
        });
        expect(result.success).toBe(false);
    });
});
