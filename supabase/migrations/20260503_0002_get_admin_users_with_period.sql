-- 회원 관리 화면에서 특정 기간 내 출석 횟수 기준으로 조회하기 위한 RPC.
-- 기존 get_admin_users_unified 와 동일한 출력 스키마 + period 필터.
-- p_from/p_to 가 NULL 이면 lifetime 조회 (= 기존 RPC 동작).
-- attendance_count: 기간 내 출석 횟수 (기간 미지정 시 lifetime 과 동일)
-- lifetime_attendance_count: 항상 lifetime (기간과 무관, UI 비교용)

CREATE OR REPLACE FUNCTION attendance.get_admin_users_with_period(
    p_crew_id uuid DEFAULT NULL::uuid,
    p_from timestamptz DEFAULT NULL::timestamptz,
    p_to timestamptz DEFAULT NULL::timestamptz
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_result JSON;
    v_users JSON;
BEGIN
    WITH user_with_period_attendance AS (
        SELECT
            u.id,
            u.email,
            u.first_name,
            u.birth_year,
            u.phone,
            u.profile_image_url,
            u.is_crew_verified,
            u.verified_crew_id,
            u.created_at,
            u.join_date,
            u.status,
            uc.status AS crew_status,
            uc.suspended_at,
            uc.suspension_reason,
            (
                SELECT ar.attendance_timestamp
                FROM attendance.attendance_records ar
                WHERE ar.user_id = u.id
                  AND ar.deleted_at IS NULL
                  AND (p_crew_id IS NULL OR ar.crew_id = p_crew_id)
                ORDER BY ar.attendance_timestamp DESC
                LIMIT 1
            ) AS last_attendance_date,
            (
                SELECT COUNT(*)
                FROM attendance.attendance_records ar
                WHERE ar.user_id = u.id
                  AND ar.deleted_at IS NULL
                  AND (p_crew_id IS NULL OR ar.crew_id = p_crew_id)
                  AND (p_from IS NULL OR ar.attendance_timestamp >= p_from)
                  AND (p_to IS NULL OR ar.attendance_timestamp < p_to)
            ) AS attendance_count,
            (
                SELECT COUNT(*)
                FROM attendance.attendance_records ar
                WHERE ar.user_id = u.id
                  AND ar.deleted_at IS NULL
                  AND (p_crew_id IS NULL OR ar.crew_id = p_crew_id)
            ) AS lifetime_attendance_count,
            c.name AS crew_name,
            COALESCE(cg.name_override, g.name, 'Beginer') AS rank_name
        FROM attendance.users u
        LEFT JOIN attendance.user_crews uc ON u.id = uc.user_id
            AND (p_crew_id IS NULL OR uc.crew_id = p_crew_id)
        LEFT JOIN attendance.crews c ON u.verified_crew_id = c.id
        LEFT JOIN attendance.crew_grades cg ON uc.crew_grade_id = cg.id
        LEFT JOIN attendance.grades g ON cg.grade_id = g.id
        WHERE
            (p_crew_id IS NULL OR u.verified_crew_id = p_crew_id)
        ORDER BY u.created_at DESC
    )
    SELECT json_agg(
        json_build_object(
            'id', id,
            'email', email,
            'first_name', COALESCE(first_name, 'N/A'),
            'birth_year', birth_year,
            'phone', phone,
            'profile_image_url', profile_image_url,
            'is_crew_verified', is_crew_verified,
            'verified_crew_id', verified_crew_id,
            'created_at', created_at,
            'join_date', join_date,
            'status', COALESCE(crew_status, status),
            'suspended_at', suspended_at,
            'suspension_reason', suspension_reason,
            'last_attendance_date', last_attendance_date,
            'attendance_count', attendance_count,
            'lifetime_attendance_count', lifetime_attendance_count,
            'crew_name', crew_name,
            'rank_name', rank_name
        )
        ORDER BY created_at DESC
    ) INTO v_users
    FROM user_with_period_attendance;

    v_result := json_build_object(
        'success', true,
        'error', NULL,
        'meta', json_build_object(
            'total_count', (
                SELECT COUNT(*)
                FROM attendance.users u
                WHERE (p_crew_id IS NULL OR u.verified_crew_id = p_crew_id)
            ),
            'crew_id', p_crew_id,
            'from', p_from,
            'to', p_to
        ),
        'data', COALESCE(v_users, '[]'::json)
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'internal_error',
            'message', SQLERRM,
            'data', NULL
        );
END;
$function$;

GRANT EXECUTE ON FUNCTION attendance.get_admin_users_with_period(uuid, timestamptz, timestamptz) TO authenticated;
