-- 마스터 어드민(/master) 페이지에서 사용하는 서비스 레벨 KPI / 크루 상세 / 활동 RPC 3종 정의
-- 1) attendance.get_master_dashboard_kpis()           : 서비스 전체 KPI + 최근 가입 / 비활성 크루 상세
-- 2) attendance.get_master_crew_overview(p_crew_id)   : 특정 크루 상세 + KPI
-- 3) attendance.get_master_crew_activity(p_crew_id, p_days) : 특정 크루 일자별/최근/호스트 Top
-- 모두 SECURITY DEFINER + role_id=1(MASTER_ADMIN) 가드. authenticated 만 EXECUTE.

-- 멱등성 보장: 기존 함수 제거
DROP FUNCTION IF EXISTS attendance.get_master_dashboard_kpis();
DROP FUNCTION IF EXISTS attendance.get_master_crew_overview(UUID);
DROP FUNCTION IF EXISTS attendance.get_master_crew_activity(UUID, INT);

-- =============================================================================
-- 1) get_master_dashboard_kpis : 서비스 전체 KPI
-- =============================================================================
CREATE OR REPLACE FUNCTION attendance.get_master_dashboard_kpis()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, attendance
AS $$
DECLARE
    v_role_id INT;
    v_total_crews BIGINT;
    v_total_users BIGINT;
    v_attendance_30d BIGINT;
    v_active_crews BIGINT;
    v_idle_crews BIGINT;
    v_dormant_crews BIGINT;
    v_recent_signups JSON;
    v_idle_crews_detail JSON;
BEGIN
    -- 마스터 권한 검증
    SELECT role_id INTO v_role_id
    FROM attendance.user_roles
    WHERE user_id = auth.uid();

    IF v_role_id IS NULL OR v_role_id <> 1 THEN
        RAISE EXCEPTION 'master_admin_required'
            USING ERRCODE = '42501';
    END IF;

    -- 전체 크루 / 유저 카운트
    SELECT COUNT(*) INTO v_total_crews FROM attendance.crews;
    SELECT COUNT(*) INTO v_total_users FROM attendance.users;

    -- 최근 30일 출석 카운트
    SELECT COUNT(*) INTO v_attendance_30d
    FROM attendance.attendance_records ar
    WHERE ar.deleted_at IS NULL
      AND ar.attendance_timestamp >= NOW() - INTERVAL '30 days';

    -- 크루별 마지막 출석 시각 (출석 0건 크루 포함)을 1번 계산해 활성도 분류
    WITH crew_last AS (
        SELECT
            c.id AS crew_id,
            (
                SELECT MAX(ar.attendance_timestamp)
                FROM attendance.attendance_records ar
                WHERE ar.crew_id = c.id
                  AND ar.deleted_at IS NULL
            ) AS last_attendance_at
        FROM attendance.crews c
    )
    SELECT
        COUNT(*) FILTER (
            WHERE last_attendance_at IS NOT NULL
              AND last_attendance_at >= NOW() - INTERVAL '14 days'
        ),
        COUNT(*) FILTER (
            WHERE last_attendance_at IS NOT NULL
              AND last_attendance_at <  NOW() - INTERVAL '14 days'
              AND last_attendance_at >= NOW() - INTERVAL '30 days'
        ),
        COUNT(*) FILTER (
            WHERE last_attendance_at IS NULL
               OR last_attendance_at <  NOW() - INTERVAL '30 days'
        )
    INTO v_active_crews, v_idle_crews, v_dormant_crews
    FROM crew_last;

    -- 최근 가입 크루 5개
    SELECT COALESCE(json_agg(row_to_json(s) ORDER BY s.created_at DESC), '[]'::json)
    INTO v_recent_signups
    FROM (
        SELECT
            c.id,
            c.name,
            c.created_at,
            (
                SELECT COUNT(*)
                FROM attendance.user_crews uc
                WHERE uc.crew_id = c.id
            ) AS member_count
        FROM attendance.crews c
        ORDER BY c.created_at DESC
        LIMIT 5
    ) s;

    -- idle / dormant 크루 상세 5개 (출석 없거나 14일 초과)
    SELECT COALESCE(json_agg(row_to_json(d) ORDER BY d.last_attendance_at ASC NULLS FIRST), '[]'::json)
    INTO v_idle_crews_detail
    FROM (
        SELECT
            c.id,
            c.name,
            (
                SELECT MAX(ar.attendance_timestamp)
                FROM attendance.attendance_records ar
                WHERE ar.crew_id = c.id
                  AND ar.deleted_at IS NULL
            ) AS last_attendance_at,
            (
                SELECT COUNT(*)
                FROM attendance.user_crews uc
                WHERE uc.crew_id = c.id
            ) AS member_count
        FROM attendance.crews c
        WHERE NOT EXISTS (
            SELECT 1
            FROM attendance.attendance_records ar
            WHERE ar.crew_id = c.id
              AND ar.deleted_at IS NULL
              AND ar.attendance_timestamp >= NOW() - INTERVAL '14 days'
        )
        ORDER BY last_attendance_at ASC NULLS FIRST
        LIMIT 5
    ) d;

    RETURN json_build_object(
        'total_crews',         v_total_crews,
        'total_users',         v_total_users,
        'attendance_30d',      v_attendance_30d,
        'active_crews',        v_active_crews,
        'idle_crews',          v_idle_crews,
        'dormant_crews',       v_dormant_crews,
        'recent_signups',      v_recent_signups,
        'idle_crews_detail',   v_idle_crews_detail
    );
END;
$$;

REVOKE ALL ON FUNCTION attendance.get_master_dashboard_kpis() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.get_master_dashboard_kpis() TO authenticated;

COMMENT ON FUNCTION attendance.get_master_dashboard_kpis() IS
    '마스터 어드민 대시보드 KPI: 전체 크루/유저/30일 출석, 활성/유휴/휴면 크루 카운트, 최근 가입/비활성 크루 상세';

-- =============================================================================
-- 2) get_master_crew_overview : 단일 크루 상세 + KPI
-- =============================================================================
CREATE OR REPLACE FUNCTION attendance.get_master_crew_overview(p_crew_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, attendance
AS $$
DECLARE
    v_role_id INT;
    v_crew JSON;
    v_member_count BIGINT;
    v_attendance_30d BIGINT;
    v_host_count_30d BIGINT;
    v_last_attendance_at TIMESTAMPTZ;
    v_active_member_count_30d BIGINT;
BEGIN
    -- 마스터 권한 검증
    SELECT role_id INTO v_role_id
    FROM attendance.user_roles
    WHERE user_id = auth.uid();

    IF v_role_id IS NULL OR v_role_id <> 1 THEN
        RAISE EXCEPTION 'master_admin_required'
            USING ERRCODE = '42501';
    END IF;

    -- 크루 기본 정보
    SELECT row_to_json(c) INTO v_crew
    FROM (
        SELECT
            id,
            name,
            description,
            region,
            profile_image_url,
            max_members,
            location_based_attendance,
            accuracy_range,
            allow_unregistered_location,
            created_at,
            updated_at
        FROM attendance.crews
        WHERE id = p_crew_id
    ) c;

    -- 크루 미존재 시 NULL 반환
    IF v_crew IS NULL THEN
        RETURN NULL;
    END IF;

    -- 멤버 수
    SELECT COUNT(*)
    INTO v_member_count
    FROM attendance.user_crews
    WHERE crew_id = p_crew_id;

    -- 30일 출석 / 호스트 / 마지막 출석 / 활성 멤버 (단일 스캔)
    SELECT
        COUNT(*) FILTER (
            WHERE ar.attendance_timestamp >= NOW() - INTERVAL '30 days'
        ),
        COUNT(*) FILTER (
            WHERE ar.is_host = TRUE
              AND ar.attendance_timestamp >= NOW() - INTERVAL '30 days'
        ),
        MAX(ar.attendance_timestamp),
        COUNT(DISTINCT ar.user_id) FILTER (
            WHERE ar.attendance_timestamp >= NOW() - INTERVAL '30 days'
        )
    INTO v_attendance_30d, v_host_count_30d, v_last_attendance_at, v_active_member_count_30d
    FROM attendance.attendance_records ar
    WHERE ar.crew_id = p_crew_id
      AND ar.deleted_at IS NULL;

    RETURN json_build_object(
        'crew', v_crew,
        'kpi', json_build_object(
            'member_count',             COALESCE(v_member_count, 0),
            'attendance_30d',           COALESCE(v_attendance_30d, 0),
            'host_count_30d',           COALESCE(v_host_count_30d, 0),
            'last_attendance_at',       v_last_attendance_at,
            'active_member_count_30d',  COALESCE(v_active_member_count_30d, 0)
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION attendance.get_master_crew_overview(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.get_master_crew_overview(UUID) TO authenticated;

COMMENT ON FUNCTION attendance.get_master_crew_overview(UUID) IS
    '마스터 어드민 크루 상세: 크루 메타 + 멤버/30일 출석/호스트/마지막 출석/활성 멤버 KPI';

-- =============================================================================
-- 3) get_master_crew_activity : 크루 활동 (일자별 / 최근 / 호스트 Top)
-- =============================================================================
CREATE OR REPLACE FUNCTION attendance.get_master_crew_activity(
    p_crew_id UUID,
    p_days INT DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, attendance
AS $$
DECLARE
    v_role_id INT;
    v_days INT;
    v_since TIMESTAMPTZ;
    v_daily JSON;
    v_recent JSON;
    v_host_top JSON;
BEGIN
    -- 마스터 권한 검증
    SELECT role_id INTO v_role_id
    FROM attendance.user_roles
    WHERE user_id = auth.uid();

    IF v_role_id IS NULL OR v_role_id <> 1 THEN
        RAISE EXCEPTION 'master_admin_required'
            USING ERRCODE = '42501';
    END IF;

    -- p_days 정규화 (1~365 범위, 기본 30)
    v_days := COALESCE(p_days, 30);
    IF v_days < 1 THEN
        v_days := 1;
    ELSIF v_days > 365 THEN
        v_days := 365;
    END IF;

    v_since := NOW() - (v_days || ' days')::INTERVAL;

    -- 일자별 카운트 (카운트 있는 날짜만)
    SELECT COALESCE(json_agg(row_to_json(d) ORDER BY d.date ASC), '[]'::json)
    INTO v_daily
    FROM (
        SELECT
            (ar.attendance_timestamp AT TIME ZONE 'Asia/Seoul')::DATE AS date,
            COUNT(*)::BIGINT AS count
        FROM attendance.attendance_records ar
        WHERE ar.crew_id = p_crew_id
          AND ar.deleted_at IS NULL
          AND ar.attendance_timestamp >= v_since
        GROUP BY (ar.attendance_timestamp AT TIME ZONE 'Asia/Seoul')::DATE
    ) d;

    -- 최근 50건 출석
    SELECT COALESCE(json_agg(row_to_json(r) ORDER BY r.attendance_timestamp DESC), '[]'::json)
    INTO v_recent
    FROM (
        SELECT
            ar.id,
            ar.user_id,
            u.first_name AS user_name,
            ar.attendance_timestamp,
            ar.location,
            ar.is_host,
            et.name AS exercise_type_name
        FROM attendance.attendance_records ar
        LEFT JOIN attendance.users u ON u.id = ar.user_id
        LEFT JOIN attendance.exercise_types et ON et.id = ar.exercise_type_id
        WHERE ar.crew_id = p_crew_id
          AND ar.deleted_at IS NULL
        ORDER BY ar.attendance_timestamp DESC
        LIMIT 50
    ) r;

    -- 호스트 Top 5 (p_days 내)
    SELECT COALESCE(json_agg(row_to_json(h) ORDER BY h.host_count DESC), '[]'::json)
    INTO v_host_top
    FROM (
        SELECT
            ar.user_id,
            u.first_name AS user_name,
            COUNT(*)::BIGINT AS host_count
        FROM attendance.attendance_records ar
        LEFT JOIN attendance.users u ON u.id = ar.user_id
        WHERE ar.crew_id = p_crew_id
          AND ar.deleted_at IS NULL
          AND ar.is_host = TRUE
          AND ar.attendance_timestamp >= v_since
        GROUP BY ar.user_id, u.first_name
        ORDER BY host_count DESC
        LIMIT 5
    ) h;

    RETURN json_build_object(
        'daily',    v_daily,
        'recent',   v_recent,
        'host_top', v_host_top
    );
END;
$$;

REVOKE ALL ON FUNCTION attendance.get_master_crew_activity(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION attendance.get_master_crew_activity(UUID, INT) TO authenticated;

COMMENT ON FUNCTION attendance.get_master_crew_activity(UUID, INT) IS
    '마스터 어드민 크루 활동: 일자별 출석 카운트(p_days, KST 기준), 최근 50건, 호스트 Top 5';
