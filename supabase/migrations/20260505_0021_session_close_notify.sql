-- 감지 기반 출석 시스템 — 라벨 자동 추천 + 세션 종료 푸시 (Phase 3 Task 3.6)
--
-- 1) suggest_session_label(p_session_id) — 동일 위치(±100m)에서 N회 이상 관찰된
--    가장 흔한 라벨을 추천한다 (system_settings.auto_label_min_session_count 사용).
-- 2) close_idle_sessions() 확장 — 세션 종료 시점에 라벨이 NULL이면 추천값으로
--    채우고, 푸시 시스템이 있으면 운영진에게 알림.
--
-- ⚠️ 푸시 시스템 통합 (TODO):
--   현재 본 마이그레이션은 push_outbox 테이블 또는 push 발송 함수가 존재하면
--   해당 함수를 호출하지만, 실제 푸시 인프라 함수는 별도 모듈에서 구현되어야 한다.
--   본 마이그레이션은 SECURITY DEFINER 헬퍼만 정의하고, 푸시 호출은
--   `attendance.notify_session_closed(p_session_id)`라는 명시적 후크 함수로
--   분리한다 — 푸시 인프라가 추가되면 해당 함수의 본체만 교체하면 된다.

BEGIN;

-- ---------------------------------------------------------------
-- 1) 라벨 자동 추천 함수
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION attendance.suggest_session_label(
    p_session_id uuid
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
DECLARE
    v_min       int;
    v_label     text;
    v_crew_id   uuid;
    v_lat       double precision;
    v_lng       double precision;
BEGIN
    SELECT COALESCE((value)::int, 5) INTO v_min
      FROM attendance.system_settings
     WHERE key = 'auto_label_min_session_count';
    IF v_min IS NULL THEN v_min := 5; END IF;

    SELECT crew_id, center_lat, center_lng
      INTO v_crew_id, v_lat, v_lng
      FROM attendance.sessions
     WHERE id = p_session_id;

    IF v_crew_id IS NULL THEN RETURN NULL; END IF;

    -- 같은 크루 내 100m 이내 위치에서 N회 이상 관찰된 라벨 중 최빈
    SELECT s.auto_label INTO v_label
      FROM attendance.sessions s
     WHERE s.crew_id = v_crew_id
       AND s.id <> p_session_id
       AND s.auto_label IS NOT NULL
       AND s.auto_label <> ''
       AND 6371000 * 2 * asin(sqrt(
             power(sin(radians(s.center_lat - v_lat) / 2), 2)
           + cos(radians(v_lat)) * cos(radians(s.center_lat))
             * power(sin(radians(s.center_lng - v_lng) / 2), 2)
         )) <= 100
     GROUP BY s.auto_label
    HAVING COUNT(*) >= v_min
     ORDER BY COUNT(*) DESC
     LIMIT 1;

    RETURN v_label;
END;
$$;

REVOKE ALL ON FUNCTION attendance.suggest_session_label(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.suggest_session_label(uuid)
    TO authenticated, service_role;

COMMENT ON FUNCTION attendance.suggest_session_label(uuid) IS
    '같은 크루 내 100m 이내 위치에서 N회 이상 관찰된 가장 흔한 라벨을 추천한다. 미발견 시 NULL 반환.';

-- ---------------------------------------------------------------
-- 2) 세션 종료 알림 후크 (푸시 시스템 미구현 시 NOTICE만 남김)
-- ---------------------------------------------------------------
-- TODO(push-system): 실제 푸시 발송 함수가 추가되면 본 함수의 본체를 교체해
--   `PERFORM push.send_to_crew_admins(...)` 등으로 호출하도록 한다.
--   현재는 push_outbox 테이블 존재 여부를 체크해서 있으면 INSERT, 없으면 NOTICE.

CREATE OR REPLACE FUNCTION attendance.notify_session_closed(
    p_session_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
DECLARE
    v_label        text;
    v_member_count int;
    v_crew_id      uuid;
    v_has_outbox   boolean;
BEGIN
    SELECT auto_label, crew_id INTO v_label, v_crew_id
      FROM attendance.sessions
     WHERE id = p_session_id;
    IF v_crew_id IS NULL THEN RETURN; END IF;

    SELECT COUNT(*) INTO v_member_count
      FROM attendance.session_members
     WHERE session_id = p_session_id;

    -- push_outbox 테이블이 존재하면 INSERT, 없으면 NOTICE.
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'attendance' AND table_name = 'push_outbox'
    ) INTO v_has_outbox;

    IF v_has_outbox THEN
        EXECUTE format(
            'INSERT INTO attendance.push_outbox (crew_id, session_id, title, body, target_role, created_at)
             VALUES (%L, %L, %L, %L, %L, now())',
            v_crew_id,
            p_session_id,
            COALESCE(v_label, '모임') || ' 종료',
            v_member_count || '명 출석 완료',
            'crew_admin'
        );
    ELSE
        RAISE NOTICE
            '[attendance.notify_session_closed] push_outbox 미존재 — 푸시 인프라 추가 후 본 함수의 INSERT 분기를 활성화하세요. session_id=%, 라벨=%, %명',
            p_session_id, v_label, v_member_count;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION attendance.notify_session_closed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.notify_session_closed(uuid)
    TO service_role;

COMMENT ON FUNCTION attendance.notify_session_closed(uuid) IS
    '세션 종료 시 운영진에게 푸시 알림을 보내는 후크. push_outbox 테이블 존재 시 INSERT, 없으면 NOTICE 발생.';

-- ---------------------------------------------------------------
-- 3) close_idle_sessions() 확장 — 종료 시 라벨 자동 채움 + notify
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION attendance.close_idle_sessions()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
DECLARE
    v_minutes      int;
    v_count        int := 0;
    v_session_rec  record;
BEGIN
    SELECT COALESCE((value)::int, 60) INTO v_minutes
      FROM attendance.system_settings
     WHERE key = 'session_close_minutes';
    IF v_minutes IS NULL THEN v_minutes := 60; END IF;

    -- 종료 대상 세션을 한 번에 가져와 처리
    FOR v_session_rec IN
        SELECT s.id, s.auto_label
          FROM attendance.sessions s
         WHERE s.ended_at IS NULL
           AND COALESCE(
               (SELECT MAX(joined_at)
                  FROM attendance.session_members
                 WHERE session_id = s.id),
               s.started_at
           ) < now() - make_interval(mins => v_minutes)
    LOOP
        -- 라벨이 NULL이면 추천값으로 채움
        IF v_session_rec.auto_label IS NULL THEN
            UPDATE attendance.sessions
               SET auto_label = attendance.suggest_session_label(
                   v_session_rec.id
               ),
                   ended_at = now()
             WHERE id = v_session_rec.id;
        ELSE
            UPDATE attendance.sessions
               SET ended_at = now()
             WHERE id = v_session_rec.id;
        END IF;

        -- 운영진 푸시 후크 호출 (best-effort: 예외 시 무시)
        BEGIN
            PERFORM attendance.notify_session_closed(v_session_rec.id);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE
                '[close_idle_sessions] notify_session_closed 실패 (무시): %',
                SQLERRM;
        END;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION attendance.close_idle_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.close_idle_sessions() TO service_role;

COMMIT;
