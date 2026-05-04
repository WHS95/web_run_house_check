/**
 * 크루별 출석 운영 settings — 운영진이 직접 조정한다.
 *
 * - time_window_mode: 출석 가능 시간대 정책
 *   - cluster_first: 군집(최근 활성 세션) 우선, 슬롯도 보조로 허용
 *   - active_hours: 슬롯 안에서만 허용
 *   - anytime: 항상 허용 (24시간)
 * - active_hours: 요일별 시간대 슬롯 (cluster_first/active_hours 모드에서 사용)
 * - 이탈/온보딩 룰: lib/domain/crew-health에서 사용
 */

export type TimeWindowMode =
    | 'cluster_first'
    | 'active_hours'
    | 'anytime';

export type DayOfWeek =
    | 'sun'
    | 'mon'
    | 'tue'
    | 'wed'
    | 'thu'
    | 'fri'
    | 'sat';

export interface ActiveHoursSlot {
    day: DayOfWeek;
    /** "HH:MM" (24시간) */
    from: string;
    /** "HH:MM" (24시간) */
    to: string;
}

export interface CrewAttendanceSettings {
    time_window_mode: TimeWindowMode;
    active_hours: ActiveHoursSlot[] | null;
    churn_baseline_weeks: number;
    churn_min_baseline_rate: number;
    churn_observation_weeks: number;
    onboarding_window_weeks: number;
    onboarding_min_count: number;
}

export const CREW_ATTENDANCE_SETTINGS_DEFAULT: CrewAttendanceSettings = {
    time_window_mode: 'cluster_first',
    active_hours: null,
    churn_baseline_weeks: 4,
    churn_min_baseline_rate: 0.5,
    churn_observation_weeks: 2,
    onboarding_window_weeks: 4,
    onboarding_min_count: 2,
};
