-- 감지 기반 출석 시스템 — 이탈/온보딩 위험 알림 cron (Phase 4 Task 4.5)
--
-- send_churn_risk_alerts()       : 매주 월 09:00 KST = 00:00 UTC 실행
-- send_onboarding_risk_alerts()  : 매일 09:00 KST = 00:00 UTC 실행
--
-- 두 함수 모두 크루별 룰(crews 테이블)을 적용해 위험 멤버를 식별하고,
-- push_outbox 테이블이 존재하면 운영진용 알림을 INSERT 한다.
-- push_outbox가 없으면 NOTICE만 발생 (TODO: 푸시 인프라 추가 시 INSERT 본체 활성화).

BEGIN;

-- 위험 멤버 ID 목록 산출 헬퍼 (테스트 + 직접 호출용).
-- 멤버별 최근 baseline+observation 주의 주간 출석 횟수를 집계해
-- 이탈위험 정의를 만족하는 user_id를 반환한다.
CREATE OR REPLACE FUNCTION attendance.get_churn_risk_user_ids(
    p_crew_id uuid
)
RETURNS TABLE(user_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
DECLARE
    v_baseline    int;
    v_min_rate    decimal;
    v_observation int;
    v_total       int;
BEGIN
    SELECT
        COALESCE(churn_baseline_weeks, 4),
        COALESCE(churn_min_baseline_rate, 0.5),
        COALESCE(churn_observation_weeks, 2)
      INTO v_baseline, v_min_rate, v_observation
      FROM attendance.crews
     WHERE id = p_crew_id;
    IF v_baseline IS NULL THEN
        v_baseline := 4; v_min_rate := 0.5; v_observation := 2;
    END IF;
    v_total := v_baseline + v_observation;

    RETURN QUERY
    WITH weekly AS (
        SELECT
            uc.user_id,
            FLOOR(
                (CURRENT_DATE - mad.date) / 7
            )::int AS week_idx,
            COUNT(*) AS attended_count
          FROM attendance.user_crews uc
          LEFT JOIN attendance.member_activity_daily mad
            ON mad.user_id = uc.user_id
           AND mad.crew_id = uc.crew_id
           AND mad.attended
           AND mad.date >= CURRENT_DATE - (v_total * 7)
         WHERE uc.crew_id = p_crew_id
           AND uc.status = 'ACTIVE'
         GROUP BY uc.user_id, FLOOR((CURRENT_DATE - mad.date) / 7)::int
    ),
    by_user AS (
        SELECT
            user_id,
            -- observation: week_idx 0 ~ v_observation-1 (out 0)
            COUNT(*) FILTER (
                WHERE week_idx >= 0
                  AND week_idx < v_observation
                  AND attended_count > 0
            ) AS observation_active_weeks,
            -- baseline: week_idx v_observation ~ v_total-1
            COUNT(*) FILTER (
                WHERE week_idx >= v_observation
                  AND week_idx < v_total
                  AND attended_count > 0
            ) AS baseline_active_weeks
          FROM weekly
         WHERE week_idx IS NOT NULL
         GROUP BY user_id
    )
    SELECT bu.user_id
      FROM by_user bu
     WHERE bu.observation_active_weeks = 0
       AND (bu.baseline_active_weeks::decimal / v_baseline) >= v_min_rate;
END;
$$;

REVOKE ALL ON FUNCTION attendance.get_churn_risk_user_ids(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.get_churn_risk_user_ids(uuid)
    TO service_role;

COMMENT ON FUNCTION attendance.get_churn_risk_user_ids(uuid) IS
    '크루별 이탈 위험 멤버 ID 목록 반환. 정책: lib/domain/crew-health/policies.ts 의 이탈위험인가 와 동일 규칙.';

-- 온보딩 위험 멤버 ID 헬퍼.
CREATE OR REPLACE FUNCTION attendance.get_onboarding_risk_user_ids(
    p_crew_id uuid
)
RETURNS TABLE(user_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
DECLARE
    v_window int;
    v_min    int;
BEGIN
    SELECT
        COALESCE(onboarding_window_weeks, 4),
        COALESCE(onboarding_min_count, 2)
      INTO v_window, v_min
      FROM attendance.crews
     WHERE id = p_crew_id;
    IF v_window IS NULL THEN v_window := 4; v_min := 2; END IF;

    RETURN QUERY
    SELECT uc.user_id
      FROM attendance.user_crews uc
      LEFT JOIN attendance.member_activity_daily mad
        ON mad.user_id = uc.user_id
       AND mad.crew_id = uc.crew_id
       AND mad.attended
       AND mad.date >= CURRENT_DATE - (v_window * 7)
     WHERE uc.crew_id = p_crew_id
       AND uc.status = 'ACTIVE'
       AND uc.joined_at IS NOT NULL
       AND CURRENT_DATE - uc.joined_at::date >= 14    -- 가입 2주차 이상
       AND CURRENT_DATE - uc.joined_at::date <= v_window * 7
     GROUP BY uc.user_id
    HAVING COUNT(mad.date) < v_min;
END;
$$;

REVOKE ALL ON FUNCTION attendance.get_onboarding_risk_user_ids(uuid)
    FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.get_onboarding_risk_user_ids(uuid)
    TO service_role;

COMMENT ON FUNCTION attendance.get_onboarding_risk_user_ids(uuid) IS
    '크루별 온보딩 위험 신규 멤버 ID 목록.';

-- ---------------------------------------------------------------
-- send_churn_risk_alerts — 모든 크루 순회하며 운영진에게 알림
-- ---------------------------------------------------------------
-- TODO(push-system): push_outbox 테이블이 추가되면 INSERT 분기를 활성화.
CREATE OR REPLACE FUNCTION attendance.send_churn_risk_alerts()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
DECLARE
    v_count    int := 0;
    v_crew     record;
    v_risk_n   int;
    v_has_outbox boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'attendance' AND table_name = 'push_outbox'
    ) INTO v_has_outbox;

    FOR v_crew IN SELECT id FROM attendance.crews LOOP
        SELECT COUNT(*) INTO v_risk_n
          FROM attendance.get_churn_risk_user_ids(v_crew.id);
        IF v_risk_n = 0 THEN CONTINUE; END IF;

        IF v_has_outbox THEN
            EXECUTE format(
                'INSERT INTO attendance.push_outbox
                    (crew_id, title, body, target_role, created_at)
                 VALUES (%L, %L, %L, %L, now())',
                v_crew.id,
                '이탈 위험 멤버 알림',
                v_risk_n || '명의 이탈 위험 멤버를 확인하세요.',
                'crew_admin'
            );
        ELSE
            RAISE NOTICE
                '[send_churn_risk_alerts] crew=% 위험 %명 — push_outbox 미존재',
                v_crew.id, v_risk_n;
        END IF;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION attendance.send_churn_risk_alerts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.send_churn_risk_alerts()
    TO service_role;

-- ---------------------------------------------------------------
-- send_onboarding_risk_alerts
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION attendance.send_onboarding_risk_alerts()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
DECLARE
    v_count    int := 0;
    v_crew     record;
    v_risk_n   int;
    v_has_outbox boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'attendance' AND table_name = 'push_outbox'
    ) INTO v_has_outbox;

    FOR v_crew IN SELECT id FROM attendance.crews LOOP
        SELECT COUNT(*) INTO v_risk_n
          FROM attendance.get_onboarding_risk_user_ids(v_crew.id);
        IF v_risk_n = 0 THEN CONTINUE; END IF;

        IF v_has_outbox THEN
            EXECUTE format(
                'INSERT INTO attendance.push_outbox
                    (crew_id, title, body, target_role, created_at)
                 VALUES (%L, %L, %L, %L, now())',
                v_crew.id,
                '온보딩 위험 신규 멤버 알림',
                v_risk_n || '명의 신규 멤버가 정착에 어려움을 겪고 있어요.',
                'crew_admin'
            );
        ELSE
            RAISE NOTICE
                '[send_onboarding_risk_alerts] crew=% 위험 %명 — push_outbox 미존재',
                v_crew.id, v_risk_n;
        END IF;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION attendance.send_onboarding_risk_alerts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.send_onboarding_risk_alerts()
    TO service_role;

-- ---------------------------------------------------------------
-- pg_cron 등록 (확장 부재 시 NOTICE)
-- ---------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        -- 매주 월 00:00 UTC = 09:00 KST 월요일
        PERFORM cron.unschedule('attendance-churn-alerts')
        WHERE EXISTS (
            SELECT 1 FROM cron.job
             WHERE jobname = 'attendance-churn-alerts'
        );
        PERFORM cron.schedule(
            'attendance-churn-alerts',
            '0 0 * * 1',
            $job$SELECT attendance.send_churn_risk_alerts();$job$
        );

        -- 매일 00:00 UTC = 09:00 KST
        PERFORM cron.unschedule('attendance-onboarding-alerts')
        WHERE EXISTS (
            SELECT 1 FROM cron.job
             WHERE jobname = 'attendance-onboarding-alerts'
        );
        PERFORM cron.schedule(
            'attendance-onboarding-alerts',
            '0 0 * * *',
            $job$SELECT attendance.send_onboarding_risk_alerts();$job$
        );
    ELSE
        RAISE NOTICE
            'pg_cron 확장이 비활성화되어 있어 health alert cron을 등록하지 않습니다. 활성화 후 본 마이그레이션의 cron.schedule 부분만 다시 실행하세요.';
    END IF;
END
$$;

COMMIT;
