import { z } from 'zod';

/**
 * 시스템 settings 입력 검증.
 *
 * 운영 사고 방지를 위해 각 필드에 합리적 상하한을 둔다:
 * - session_window_minutes: 1~120분 (1분 미만은 클러스터링 의미 없음)
 * - session_radius_m: 10~2000m (10m 미만은 GPS 정확도 한계)
 * - session_close_minutes: 5~360분 (너무 짧으면 세션이 자동 분리됨)
 * - auto_label_min_session_count: 1~100 (라벨 추천 최소 누적 수)
 */
export const SystemSettingsSchema = z.object({
    session_window_minutes: z.number().int().min(1).max(120),
    session_radius_m: z.number().int().min(10).max(2000),
    session_close_minutes: z.number().int().min(5).max(360),
    auto_label_min_session_count: z.number().int().min(1).max(100),
});

export type SystemSettingsInput = z.infer<typeof SystemSettingsSchema>;
