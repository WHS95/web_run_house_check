CREATE OR REPLACE FUNCTION attendance.get_master_crew_detail(p_crew_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = attendance, public
AS $$
DECLARE
  v_role_id INT;
  v_result JSON;
BEGIN
  -- 마스터 권한 검증
  SELECT role_id INTO v_role_id
  FROM attendance.user_roles
  WHERE user_id = auth.uid();

  IF v_role_id IS NULL OR v_role_id <> 1 THEN
    RAISE EXCEPTION 'forbidden: master admin only'
      USING ERRCODE = '42501';
  END IF;

  SELECT json_build_object(
    'crew', (
      SELECT row_to_json(c)
      FROM (
        SELECT id, name, description, profile_image_url,
               region, max_members, location_based_attendance,
               accuracy_range, allow_unregistered_location,
               created_at
        FROM attendance.crews
        WHERE id = p_crew_id
      ) c
    ),
    'activity', (
      SELECT json_build_object(
        'last_attendance_at',
          MAX(ar.attendance_timestamp) FILTER (WHERE ar.deleted_at IS NULL),
        'total_attendance_count',
          COUNT(ar.id) FILTER (WHERE ar.deleted_at IS NULL),
        'active_members_30d',
          COUNT(DISTINCT ar.user_id) FILTER (
            WHERE ar.deleted_at IS NULL
            AND ar.attendance_timestamp >= NOW() - INTERVAL '30 days'
          ),
        'activity_status',
          CASE
            WHEN MAX(ar.attendance_timestamp) FILTER (WHERE ar.deleted_at IS NULL)
                 >= NOW() - INTERVAL '30 days' THEN 'active'
            WHEN MAX(ar.attendance_timestamp) FILTER (WHERE ar.deleted_at IS NULL)
                 >= NOW() - INTERVAL '180 days' THEN 'dormant'
            ELSE 'inactive'
          END
      )
      FROM attendance.attendance_records ar
      WHERE ar.crew_id = p_crew_id
    ),
    'members', (
      SELECT COALESCE(json_agg(m ORDER BY m.crew_role_rank, m.last_attendance_at DESC NULLS LAST), '[]'::json)
      FROM (
        SELECT
          u.id,
          u.first_name,
          u.email,
          uc.crew_role,
          uc.joined_at,
          uc.status,
          CASE WHEN uc.crew_role = 'CREW_MANAGER' THEN 0 ELSE 1 END
            AS crew_role_rank,
          (
            SELECT MAX(ar2.attendance_timestamp)
            FROM attendance.attendance_records ar2
            WHERE ar2.user_id = u.id AND ar2.crew_id = p_crew_id
              AND ar2.deleted_at IS NULL
          ) AS last_attendance_at
        FROM attendance.user_crews uc
        JOIN attendance.users u ON u.id = uc.user_id
        WHERE uc.crew_id = p_crew_id
      ) m
    ),
    'invite_codes', (
      SELECT COALESCE(json_agg(ic ORDER BY ic.created_at DESC), '[]'::json)
      FROM (
        SELECT id, invite_code, description, is_active,
               is_first_admin_code, consumed_by, created_at
        FROM attendance.crew_invite_codes
        WHERE crew_id = p_crew_id
      ) ic
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION attendance.get_master_crew_detail(UUID)
  TO authenticated;

COMMENT ON FUNCTION attendance.get_master_crew_detail(UUID) IS
  '마스터 관리자용 크루 상세 (활성도 + 멤버 + 코드)';
