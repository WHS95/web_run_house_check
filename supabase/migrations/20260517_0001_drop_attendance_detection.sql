-- 감지 기반 출석 고도화 (2026-05-05 ~ 2026-05-09) 일괄 롤백.
-- 단순 출석 + 운영진 푸시 알림으로 회귀하면서 함께 제거되는 DB 자산.
--
-- 제거 대상:
--   - pg_cron 4개 (idle 세션 종료, 일별 집계, 이탈/온보딩 알림)
--   - 함수 11개 (register_attendance_v2, close_idle_sessions, aggregate_*,
--     send_*, suggest_session_label, notify_session_closed,
--     get_churn/onboarding_risk_user_ids, log_system_settings_change,
--     get_system_setting)
--   - attendance_records 컬럼 4개 (session_id, captured_lat, captured_lng, status)
--     ※ location_id 는 유지 (단순 출석에서도 사용)
--   - 테이블 7개 (sessions/session_members/session_audit_log/
--     crew_health_daily/member_activity_daily/system_settings/
--     system_settings_history)
--   - crews 컬럼 7개 (time_window_mode/active_hours/churn_*/onboarding_*)
--
-- 운영 DB(sazfajslhnvzhpaianhl)에는 본 down이 NOOP — 해당 객체가 애초에
-- 운영에 push되지 않았기 때문. 본 마이그레이션은 dev DB(cnjmnqevlkuxmujtmklc)
-- 정합성을 위해 적용된다.

BEGIN;

-- 1) pg_cron unschedule (확장이 활성화된 환경에서만)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'attendance-close-idle-sessions') THEN
            PERFORM cron.unschedule('attendance-close-idle-sessions');
        END IF;
        IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'attendance-aggregate-daily') THEN
            PERFORM cron.unschedule('attendance-aggregate-daily');
        END IF;
        IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'attendance-churn-alerts') THEN
            PERFORM cron.unschedule('attendance-churn-alerts');
        END IF;
        IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'attendance-onboarding-alerts') THEN
            PERFORM cron.unschedule('attendance-onboarding-alerts');
        END IF;
    END IF;
END $$;

-- 2) 트리거 DROP (system_settings UPDATE 시 히스토리 자동 기록)
DROP TRIGGER IF EXISTS trg_system_settings_history
    ON attendance.system_settings;

-- 3) 함수 DROP (시그니처 정확히 명시)
DROP FUNCTION IF EXISTS attendance.register_attendance_v2(
    uuid, uuid, timestamptz, double precision, double precision,
    int, int, boolean, text
);
DROP FUNCTION IF EXISTS attendance.close_idle_sessions();
DROP FUNCTION IF EXISTS attendance.aggregate_crew_health(date);
DROP FUNCTION IF EXISTS attendance.send_churn_risk_alerts();
DROP FUNCTION IF EXISTS attendance.send_onboarding_risk_alerts();
DROP FUNCTION IF EXISTS attendance.suggest_session_label(uuid);
DROP FUNCTION IF EXISTS attendance.notify_session_closed(uuid);
DROP FUNCTION IF EXISTS attendance.get_churn_risk_user_ids(uuid);
DROP FUNCTION IF EXISTS attendance.get_onboarding_risk_user_ids(uuid);
DROP FUNCTION IF EXISTS attendance.log_system_settings_change();
DROP FUNCTION IF EXISTS attendance.get_system_setting(text);

-- 4) attendance_records 컬럼 DROP — location_id 는 유지
DROP INDEX IF EXISTS attendance.idx_attendance_records_session;
DROP INDEX IF EXISTS attendance.idx_attendance_records_crew_captured;

ALTER TABLE attendance.attendance_records
    DROP COLUMN IF EXISTS session_id,
    DROP COLUMN IF EXISTS captured_lat,
    DROP COLUMN IF EXISTS captured_lng,
    DROP COLUMN IF EXISTS status;

-- 5) 테이블 DROP (자식 → 부모 순서)
DROP TABLE IF EXISTS attendance.member_activity_daily;
DROP TABLE IF EXISTS attendance.crew_health_daily;
DROP TABLE IF EXISTS attendance.session_audit_log;
DROP TABLE IF EXISTS attendance.session_members;
DROP TABLE IF EXISTS attendance.sessions;
DROP TABLE IF EXISTS attendance.system_settings_history;
DROP TABLE IF EXISTS attendance.system_settings;

-- 6) crews 컬럼 DROP (시간 윈도우 / 이탈 룰 / 온보딩 룰)
ALTER TABLE attendance.crews
    DROP COLUMN IF EXISTS time_window_mode,
    DROP COLUMN IF EXISTS active_hours,
    DROP COLUMN IF EXISTS churn_baseline_weeks,
    DROP COLUMN IF EXISTS churn_min_baseline_rate,
    DROP COLUMN IF EXISTS churn_observation_weeks,
    DROP COLUMN IF EXISTS onboarding_window_weeks,
    DROP COLUMN IF EXISTS onboarding_min_count;

COMMIT;
