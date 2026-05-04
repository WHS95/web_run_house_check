-- attendance.crews: 감지 기반 출석 시스템에서 크루별 운영 룰 컬럼 추가.
-- 시간 윈도우 모드, 이탈 위험 판정 룰, 온보딩 룰을 크루 운영진이 직접 조정한다.

ALTER TABLE attendance.crews
    ADD COLUMN IF NOT EXISTS time_window_mode text
        CHECK (time_window_mode IN ('cluster_first','active_hours','anytime'))
        DEFAULT 'cluster_first',
    ADD COLUMN IF NOT EXISTS active_hours jsonb NULL,
    ADD COLUMN IF NOT EXISTS churn_baseline_weeks       int     DEFAULT 4,
    ADD COLUMN IF NOT EXISTS churn_min_baseline_rate    decimal DEFAULT 0.5,
    ADD COLUMN IF NOT EXISTS churn_observation_weeks    int     DEFAULT 2,
    ADD COLUMN IF NOT EXISTS onboarding_window_weeks    int     DEFAULT 4,
    ADD COLUMN IF NOT EXISTS onboarding_min_count       int     DEFAULT 2;

COMMENT ON COLUMN attendance.crews.time_window_mode IS
    'cluster_first: 군집 우선 / active_hours: 활성 시간대 / anytime: 24시간';
COMMENT ON COLUMN attendance.crews.active_hours IS
    '[{day:"mon",from:"18:00",to:"22:00"}, ...]';
COMMENT ON COLUMN attendance.crews.churn_baseline_weeks IS
    '이탈 판정 기준선 주 수 (기본 4주). 이전 N주 출석 패턴을 기준으로 평가.';
COMMENT ON COLUMN attendance.crews.churn_min_baseline_rate IS
    '이탈 판정 기준선 최소 출석률 (0.0~1.0). 이 이상이어야 베이스라인으로 인정.';
COMMENT ON COLUMN attendance.crews.churn_observation_weeks IS
    '이탈 관찰 주 수 (기본 2주). 최근 N주 동안 출석 0이면 이탈 위험.';
COMMENT ON COLUMN attendance.crews.onboarding_window_weeks IS
    '온보딩 관찰 윈도우 (기본 4주). 가입 후 N주 이내 평가.';
COMMENT ON COLUMN attendance.crews.onboarding_min_count IS
    '온보딩 최소 출석 횟수. 윈도우 내 N회 미만이면 위험.';
