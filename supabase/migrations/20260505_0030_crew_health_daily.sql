-- 감지 기반 출석 시스템 — 크루 헬스 대시보드 일별 집계 테이블 (Phase 4 Task 4.1)
--
-- crew_health_daily: 크루 단위 일별 활동 지표 (WAU/MAU/세션수/출석수)
-- member_activity_daily: 멤버 × 일자 출석 여부 (이탈 분석용)
--
-- 두 테이블 모두 cron(00:05 UTC = 09:05 KST)에 의해 매일 채워진다.
-- (집계 cron은 Task 4.2 에서 정의)

BEGIN;

CREATE TABLE IF NOT EXISTS attendance.crew_health_daily (
    date              date NOT NULL,
    crew_id           uuid NOT NULL REFERENCES attendance.crews(id)
                          ON DELETE CASCADE,
    wau               int  NOT NULL DEFAULT 0,
    mau               int  NOT NULL DEFAULT 0,
    session_count     int  NOT NULL DEFAULT 0,
    attendance_count  int  NOT NULL DEFAULT 0,
    active_member_ids uuid[] NOT NULL DEFAULT '{}',
    PRIMARY KEY (date, crew_id)
);

COMMENT ON TABLE attendance.crew_health_daily IS
    '크루별 일별 활동 지표 — 헬스 대시보드용 집계.';
COMMENT ON COLUMN attendance.crew_health_daily.wau IS
    '최근 7일(date 기준) DISTINCT 출석 멤버 수';
COMMENT ON COLUMN attendance.crew_health_daily.mau IS
    '최근 30일(date 기준) DISTINCT 출석 멤버 수';

CREATE INDEX IF NOT EXISTS idx_crew_health_daily_crew_date
    ON attendance.crew_health_daily(crew_id, date DESC);

CREATE TABLE IF NOT EXISTS attendance.member_activity_daily (
    date     date NOT NULL,
    user_id  uuid NOT NULL REFERENCES attendance.users(id) ON DELETE CASCADE,
    crew_id  uuid NOT NULL REFERENCES attendance.crews(id) ON DELETE CASCADE,
    attended boolean NOT NULL,
    PRIMARY KEY (date, user_id, crew_id)
);

COMMENT ON TABLE attendance.member_activity_daily IS
    '멤버별 일자 단위 출석 여부 — 이탈/온보딩 분석용.';

CREATE INDEX IF NOT EXISTS idx_member_activity_user_date
    ON attendance.member_activity_daily(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_member_activity_crew_date
    ON attendance.member_activity_daily(crew_id, date DESC);

-- RLS: 자기 크루 운영진/마스터만 SELECT
ALTER TABLE attendance.crew_health_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance.member_activity_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crew_health_admin_select
    ON attendance.crew_health_daily;
CREATE POLICY crew_health_admin_select
    ON attendance.crew_health_daily
    FOR SELECT TO authenticated
    USING (
        attendance.is_crew_admin(crew_id)
        OR attendance.is_master()
    );

DROP POLICY IF EXISTS member_activity_admin_select
    ON attendance.member_activity_daily;
CREATE POLICY member_activity_admin_select
    ON attendance.member_activity_daily
    FOR SELECT TO authenticated
    USING (
        attendance.is_crew_admin(crew_id)
        OR attendance.is_master()
    );

-- 두 테이블 모두 SECURITY DEFINER 집계 함수에서만 INSERT/UPDATE 됨 — 별도 modify 정책 없음.

COMMIT;
