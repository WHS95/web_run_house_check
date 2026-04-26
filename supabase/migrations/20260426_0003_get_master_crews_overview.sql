CREATE OR REPLACE FUNCTION attendance.get_master_crews_overview()
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  description TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ,
  member_count BIGINT,
  last_attendance_at TIMESTAMPTZ,
  total_attendance_count BIGINT,
  active_members_30d BIGINT,
  activity_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = attendance, public
AS $$
DECLARE
  v_role_id INT;
BEGIN
  -- 마스터 권한 검증
  SELECT role_id INTO v_role_id
  FROM attendance.user_roles
  WHERE user_id = auth.uid();

  IF v_role_id IS NULL OR v_role_id <> 1 THEN
    RAISE EXCEPTION 'forbidden: master admin only'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.description,
    c.profile_image_url,
    c.created_at,
    COUNT(DISTINCT uc.user_id) AS member_count,
    MAX(ar.attendance_timestamp) FILTER (WHERE ar.deleted_at IS NULL)
      AS last_attendance_at,
    COUNT(ar.id) FILTER (WHERE ar.deleted_at IS NULL)
      AS total_attendance_count,
    COUNT(DISTINCT ar.user_id) FILTER (
      WHERE ar.deleted_at IS NULL
      AND ar.attendance_timestamp >= NOW() - INTERVAL '30 days'
    ) AS active_members_30d,
    CASE
      WHEN MAX(ar.attendance_timestamp) FILTER (WHERE ar.deleted_at IS NULL)
           >= NOW() - INTERVAL '30 days' THEN 'active'
      WHEN MAX(ar.attendance_timestamp) FILTER (WHERE ar.deleted_at IS NULL)
           >= NOW() - INTERVAL '180 days' THEN 'dormant'
      ELSE 'inactive'
    END AS activity_status
  FROM attendance.crews c
  LEFT JOIN attendance.user_crews uc ON uc.crew_id = c.id
  LEFT JOIN attendance.attendance_records ar ON ar.crew_id = c.id
  GROUP BY c.id
  ORDER BY last_attendance_at DESC NULLS LAST, c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION attendance.get_master_crews_overview()
  TO authenticated;

COMMENT ON FUNCTION attendance.get_master_crews_overview() IS
  '마스터 관리자용 크루 목록 + 활성도 집계 (단일 호출)';
