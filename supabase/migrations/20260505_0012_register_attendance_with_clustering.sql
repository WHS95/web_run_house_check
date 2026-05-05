-- 감지 기반 출석 RPC: 출석 등록 시점에 자동 클러스터링.
--
-- 동작:
-- 1) system_settings 에서 윈도우/반경 임계값 로드.
-- 2) 활성 세션 후보 조회 (해당 크루의 ended_at IS NULL,
--    최근 last_joined_at 이 ±window_min 안, 좌표 거리 ±radius_m 안).
-- 3) 후보 있으면 attach (가장 가까운 세션), 없으면 새 세션 INSERT.
-- 4) attendance_records insert (session_id, captured_lat/lng, status='confirmed').
-- 5) session_members 매핑 추가.
--
-- captured_lat/lng가 NULL이면 클러스터링 불가 → 새 세션 생성하지 않고
-- attendance_records만 넣고 session_id NULL로 둔다 (운영진 보정 대상).
--
-- 반환: { success, session_id, record_id }

CREATE OR REPLACE FUNCTION attendance.register_attendance_v2(
    p_user_id uuid,
    p_crew_id uuid,
    p_captured_at timestamptz,
    p_captured_lat double precision,
    p_captured_lng double precision,
    p_location_id int DEFAULT NULL,
    p_exercise_type_id int DEFAULT NULL,
    p_is_host boolean DEFAULT false,
    p_location_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = attendance, public, pg_temp
AS $$
DECLARE
    v_window_min int;
    v_radius_m   int;
    v_session_id uuid;
    v_record_id  uuid;
    v_candidate_id uuid;
BEGIN
    -- 시스템 settings 로드 (없으면 디폴트 사용)
    SELECT COALESCE((value)::int, 15) INTO v_window_min
      FROM attendance.system_settings WHERE key = 'session_window_minutes';
    IF v_window_min IS NULL THEN v_window_min := 15; END IF;

    SELECT COALESCE((value)::int, 100) INTO v_radius_m
      FROM attendance.system_settings WHERE key = 'session_radius_m';
    IF v_radius_m IS NULL THEN v_radius_m := 100; END IF;

    -- 좌표가 있을 때만 클러스터링 시도
    IF p_captured_lat IS NOT NULL AND p_captured_lng IS NOT NULL THEN
        -- 활성 세션 중 시간/거리 안에 들어가는 가장 가까운 세션 선택
        SELECT s.id INTO v_candidate_id
          FROM attendance.sessions s
         WHERE s.crew_id = p_crew_id
           AND s.ended_at IS NULL
           AND ABS(EXTRACT(EPOCH FROM (
                 p_captured_at - COALESCE(
                     (SELECT MAX(joined_at)
                        FROM attendance.session_members
                       WHERE session_id = s.id),
                     s.started_at
                 )
               ))) <= v_window_min * 60
           AND (
               6371000 * 2 * asin(sqrt(
                   power(sin(radians(s.center_lat - p_captured_lat) / 2), 2)
                 + cos(radians(p_captured_lat))
                 * cos(radians(s.center_lat))
                 * power(sin(radians(s.center_lng - p_captured_lng) / 2), 2)
               ))
           ) <= v_radius_m
         ORDER BY (
             6371000 * 2 * asin(sqrt(
                 power(sin(radians(s.center_lat - p_captured_lat) / 2), 2)
               + cos(radians(p_captured_lat))
               * cos(radians(s.center_lat))
               * power(sin(radians(s.center_lng - p_captured_lng) / 2), 2)
             ))
         ) ASC
         LIMIT 1;

        -- attach or create
        IF v_candidate_id IS NOT NULL THEN
            v_session_id := v_candidate_id;
        ELSE
            INSERT INTO attendance.sessions
                (crew_id, started_at, center_lat, center_lng, radius_m)
            VALUES
                (p_crew_id, p_captured_at, p_captured_lat,
                 p_captured_lng, v_radius_m)
            RETURNING id INTO v_session_id;
        END IF;
    END IF;

    -- attendance_records insert
    INSERT INTO attendance.attendance_records (
        user_id,
        crew_id,
        attendance_timestamp,
        location_id,
        exercise_type_id,
        is_host,
        location,
        session_id,
        captured_lat,
        captured_lng,
        status
    ) VALUES (
        p_user_id,
        p_crew_id,
        p_captured_at,
        p_location_id,
        p_exercise_type_id,
        COALESCE(p_is_host, false),
        COALESCE(p_location_name, '미등록 장소'),
        v_session_id,
        p_captured_lat,
        p_captured_lng,
        'confirmed'
    )
    RETURNING id INTO v_record_id;

    -- session_members 연결 (세션 생성/귀속됐을 때만)
    IF v_session_id IS NOT NULL THEN
        INSERT INTO attendance.session_members
            (session_id, user_id, attendance_record_id, joined_at)
        VALUES
            (v_session_id, p_user_id, v_record_id, p_captured_at)
        ON CONFLICT (session_id, user_id) DO NOTHING;
    END IF;

    RETURN jsonb_build_object(
        'success',    true,
        'session_id', v_session_id,
        'record_id',  v_record_id
    );
END;
$$;

REVOKE ALL ON FUNCTION attendance.register_attendance_v2(
    uuid, uuid, timestamptz, double precision, double precision,
    int, int, boolean, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION attendance.register_attendance_v2(
    uuid, uuid, timestamptz, double precision, double precision,
    int, int, boolean, text
) TO authenticated;
