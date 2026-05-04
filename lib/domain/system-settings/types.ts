/**
 * 시스템 settings — 마스터 관리자가 운영하는 전역 튜닝 값.
 *
 * 감지 기반 출석 시스템에서 클러스터링/세션 종료/라벨 추천 임계값을
 * 코드 배포 없이 조정한다.
 */

export type SystemSettingKey =
    | 'session_window_minutes'
    | 'session_radius_m'
    | 'session_close_minutes'
    | 'auto_label_min_session_count';

export interface SystemSettings {
    /** 클러스터링 시간 임계값 (분). 출석 시각 기준 ±N분 안의 세션에 귀속 */
    session_window_minutes: number;
    /** 클러스터링 거리 임계값 (m). 세션 중심 좌표로부터 ±N미터 */
    session_radius_m: number;
    /** 세션 자동 종료 시간 (분). 마지막 출석 후 N분 경과 시 ended_at 채움 */
    session_close_minutes: number;
    /** 라벨 자동 추천 최소 세션 수. 이 이상 누적된 라벨만 추천 후보 */
    auto_label_min_session_count: number;
}

/**
 * 디폴트 값 — 마이그레이션 초기 INSERT 값과 동기화되어 있어야 한다.
 */
export const SYSTEM_SETTINGS_DEFAULT: SystemSettings = {
    session_window_minutes: 15,
    session_radius_m: 100,
    session_close_minutes: 60,
    auto_label_min_session_count: 5,
};

export interface SystemSettingsHistoryRow {
    key: string;
    old_value: unknown;
    new_value: unknown;
    updated_at: string;
    updated_by_name: string | null;
}
