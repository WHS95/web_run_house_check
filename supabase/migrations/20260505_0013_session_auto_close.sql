-- 감지 기반 출석 — 세션 자동 종료.
--
-- 마지막 멤버 합류(joined_at) 시각으로부터
-- system_settings.session_close_minutes 분 경과한 활성 세션은
-- ended_at = now() 로 마감한다.
--
-- pg_cron으로 5분마다 실행. (Supabase 프로젝트는 pg_cron 확장이
-- 활성화되어 있어야 한다 — 대시보드 → Database → Extensions)

CREATE OR REPLACE FUNCTION attendance.close_idle_sessions()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
DECLARE
    v_minutes int;
    v_count int;
BEGIN
    -- jsonb → int 직접 캐스트는 throw → text 경유.
    SELECT COALESCE((value::text)::int, 60) INTO v_minutes
      FROM attendance.system_settings
     WHERE key = 'session_close_minutes';
    IF v_minutes IS NULL THEN v_minutes := 60; END IF;

    UPDATE attendance.sessions s
       SET ended_at = now()
     WHERE ended_at IS NULL
       AND COALESCE(
           (SELECT MAX(joined_at)
              FROM attendance.session_members
             WHERE session_id = s.id),
           s.started_at
       ) < now() - make_interval(mins => v_minutes);

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION attendance.close_idle_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.close_idle_sessions() TO service_role;

-- pg_cron 등록 (확장이 없으면 NOTICE만 출력하고 진행).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        -- 동일 jobname이 있으면 unschedule 후 재등록 (idempotent).
        -- PERFORM은 WHERE를 받지 않으므로 IF EXISTS 블록으로 감싼다.
        IF EXISTS (
            SELECT 1 FROM cron.job
             WHERE jobname = 'attendance-close-idle-sessions'
        ) THEN
            PERFORM cron.unschedule('attendance-close-idle-sessions');
        END IF;

        PERFORM cron.schedule(
            'attendance-close-idle-sessions',
            '*/5 * * * *',
            $job$SELECT attendance.close_idle_sessions();$job$
        );
    ELSE
        RAISE NOTICE
            'pg_cron 확장이 비활성화되어 있어 close_idle_sessions cron을 등록하지 않습니다. Supabase 대시보드에서 활성화 후 본 마이그레이션의 cron.schedule 부분만 다시 실행하세요.';
    END IF;
END
$$;
