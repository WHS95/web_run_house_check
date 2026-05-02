-- 최근 30분 내 동일 크루의 활성 모임 1건 조회
-- 사용 시나리오: 사용자가 홈 진입 시 "지금 출석 중인 모임" 배너 노출용
--
-- 규칙
--   - 본인 제외, deleted_at IS NULL
--   - location이 NULL/빈문자열인 출석은 제외 (사용자가 식별 불가)
--   - 같은 location의 출석들을 하나의 모임으로 묶음
--   - 가장 인원이 많은 location 1건 선택, 동률이면 가장 최근 시작
--   - meeting_started_at = 해당 location 출석 중 가장 이른 attendance_timestamp
--   - 본인이 30분 내 같은 location에 출석한 적 있으면 결과 없음 반환

CREATE OR REPLACE FUNCTION attendance.get_recent_active_meet(
    p_user_id UUID,
    p_crew_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_window_start TIMESTAMP := NOW() - INTERVAL '30 minutes';
    v_meet RECORD;
    v_self_attended BOOLEAN;
BEGIN
    SELECT
        ar.location,
        COUNT(DISTINCT ar.user_id) AS attendee_count,
        MIN(ar.attendance_timestamp) AS meeting_started_at
    INTO v_meet
    FROM attendance.attendance_records ar
    WHERE ar.crew_id = p_crew_id
      AND ar.deleted_at IS NULL
      AND ar.user_id <> p_user_id
      AND ar.attendance_timestamp >= v_window_start
      AND ar.location IS NOT NULL
      AND length(trim(ar.location)) > 0
    GROUP BY ar.location
    ORDER BY attendee_count DESC, meeting_started_at DESC
    LIMIT 1;

    IF v_meet.location IS NULL THEN
        RETURN json_build_object('success', true, 'data', null);
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM attendance.attendance_records ar
        WHERE ar.crew_id = p_crew_id
          AND ar.user_id = p_user_id
          AND ar.deleted_at IS NULL
          AND ar.attendance_timestamp >= v_window_start
          AND ar.location = v_meet.location
    ) INTO v_self_attended;

    IF v_self_attended THEN
        RETURN json_build_object('success', true, 'data', null);
    END IF;

    RETURN json_build_object(
        'success', true,
        'data', json_build_object(
            'location', v_meet.location,
            'attendeeCount', v_meet.attendee_count,
            'meetingStartedAt', v_meet.meeting_started_at
        )
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'internal_error',
            'message', SQLERRM
        );
END;
$$;

GRANT EXECUTE ON FUNCTION attendance.get_recent_active_meet(UUID, UUID) TO authenticated;
COMMENT ON FUNCTION attendance.get_recent_active_meet(UUID, UUID) IS
'홈 배너 — 최근 30분 내 동일 크루 활성 모임 1건. 본인이 같은 모임에 출석 했으면 null.';
