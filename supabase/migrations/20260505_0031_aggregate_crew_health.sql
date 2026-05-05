-- 감지 기반 출석 시스템 — 일별 크루 헬스 집계 cron (Phase 4 Task 4.2)
--
-- aggregate_crew_health(p_date) :
--   - member_activity_daily 채우기 (지정일에 출석한 멤버)
--   - crew_health_daily 채우기 (WAU/MAU/세션수/출석수/활성멤버목록)
--
-- 매일 00:05 UTC (= 09:05 KST) cron으로 실행 — 어제 날짜 집계.

BEGIN;

CREATE OR REPLACE FUNCTION attendance.aggregate_crew_health(
    p_date date DEFAULT CURRENT_DATE - 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
BEGIN
    -- 1) member_activity_daily — 지정일 출석자
    INSERT INTO attendance.member_activity_daily
        (date, user_id, crew_id, attended)
    SELECT
        p_date,
        ar.user_id,
        ar.crew_id,
        true
      FROM attendance.attendance_records ar
     WHERE ar.attendance_timestamp::date = p_date
       AND ar.status IN ('confirmed', 'manual')
     GROUP BY ar.user_id, ar.crew_id
        ON CONFLICT (date, user_id, crew_id)
        DO UPDATE SET attended = true;

    -- 2) crew_health_daily — 크루별 집계
    INSERT INTO attendance.crew_health_daily
        (date, crew_id, wau, mau, session_count, attendance_count,
         active_member_ids)
    SELECT
        p_date AS date,
        c.id   AS crew_id,
        -- WAU: 최근 7일 (p_date-6 ~ p_date) DISTINCT 출석 멤버
        (
            SELECT COUNT(DISTINCT mad.user_id)
              FROM attendance.member_activity_daily mad
             WHERE mad.crew_id = c.id
               AND mad.date BETWEEN p_date - 6 AND p_date
               AND mad.attended
        ) AS wau,
        -- MAU: 최근 30일 (p_date-29 ~ p_date) DISTINCT 출석 멤버
        (
            SELECT COUNT(DISTINCT mad.user_id)
              FROM attendance.member_activity_daily mad
             WHERE mad.crew_id = c.id
               AND mad.date BETWEEN p_date - 29 AND p_date
               AND mad.attended
        ) AS mau,
        -- 그 날 발생한 세션 수
        (
            SELECT COUNT(*)
              FROM attendance.sessions s
             WHERE s.crew_id = c.id
               AND s.started_at::date = p_date
        ) AS session_count,
        -- 그 날 발생한 출석 수 (confirmed/manual 만)
        (
            SELECT COUNT(*)
              FROM attendance.attendance_records ar
             WHERE ar.crew_id = c.id
               AND ar.attendance_timestamp::date = p_date
               AND ar.status IN ('confirmed', 'manual')
        ) AS attendance_count,
        -- 그 날 활동한 멤버 ID 배열
        COALESCE(
            (
                SELECT ARRAY_AGG(DISTINCT mad.user_id)
                  FROM attendance.member_activity_daily mad
                 WHERE mad.crew_id = c.id
                   AND mad.date = p_date
                   AND mad.attended
            ),
            '{}'::uuid[]
        ) AS active_member_ids
      FROM attendance.crews c
        ON CONFLICT (date, crew_id)
        DO UPDATE SET
            wau               = EXCLUDED.wau,
            mau               = EXCLUDED.mau,
            session_count     = EXCLUDED.session_count,
            attendance_count  = EXCLUDED.attendance_count,
            active_member_ids = EXCLUDED.active_member_ids;
END;
$$;

REVOKE ALL ON FUNCTION attendance.aggregate_crew_health(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.aggregate_crew_health(date)
    TO service_role;

COMMENT ON FUNCTION attendance.aggregate_crew_health(date) IS
    '지정일(기본: 어제)의 크루별 헬스 지표를 집계해 daily 테이블에 upsert.';

-- pg_cron 등록 (확장 부재 시 NOTICE만)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        -- PERFORM은 WHERE를 받지 않으므로 IF EXISTS 블록으로 감싼다.
        IF EXISTS (
            SELECT 1 FROM cron.job
             WHERE jobname = 'attendance-aggregate-daily'
        ) THEN
            PERFORM cron.unschedule('attendance-aggregate-daily');
        END IF;

        PERFORM cron.schedule(
            'attendance-aggregate-daily',
            '5 0 * * *',  -- 매일 00:05 UTC = 09:05 KST
            $job$SELECT attendance.aggregate_crew_health();$job$
        );
    ELSE
        RAISE NOTICE
            'pg_cron 확장이 비활성화되어 있어 aggregate_crew_health cron을 등록하지 않습니다. 활성화 후 본 마이그레이션의 cron.schedule 부분만 다시 실행하세요.';
    END IF;
END
$$;

COMMIT;
